const FAVORITE_STORAGE_KEY = "forgeFavoriteLoras";
const FAVORITES_ENDPOINT = "/forge-card-favorites/favorites";

const favoriteState = {
    loaded: false,
    loadPromise: null,
    saveTimer: null,
    favorites: new Set(),
};

let favoritesOnlyMode = false;

function readLocalFavorites() {
    try {
        const values = JSON.parse(localStorage.getItem(FAVORITE_STORAGE_KEY) || "[]");
        return Array.isArray(values) ? values.filter((value) => typeof value === "string" && value.trim()) : [];
    } catch (error) {
        console.warn("[ForgeCardFavorites] Failed to read browser favorites", error);
        return [];
    }
}

function writeLocalFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
        console.warn("[ForgeCardFavorites] Failed to update browser favorites backup", error);
    }
}

function uniqueFavorites(values) {
    const favorites = [];
    const seen = new Set();

    for (const value of values || []) {
        if (typeof value !== "string") continue;

        const trimmed = value.trim();
        if (!trimmed || seen.has(trimmed)) continue;

        seen.add(trimmed);
        favorites.push(trimmed);
    }

    return favorites;
}

function favoritesArray() {
    return Array.from(favoriteState.favorites);
}

async function saveFavoritesToServer() {
    const favorites = favoritesArray();
    writeLocalFavorites(favorites);

    try {
        const response = await fetch(FAVORITES_ENDPOINT, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({favorites}),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || response.statusText);
    } catch (error) {
        console.warn("[ForgeCardFavorites] Server favorites save failed; browser backup is still updated", error);
    }
}

function scheduleFavoritesSave() {
    if (favoriteState.saveTimer) {
        clearTimeout(favoriteState.saveTimer);
    }

    favoriteState.saveTimer = setTimeout(() => {
        favoriteState.saveTimer = null;
        saveFavoritesToServer();
    }, 250);
}

async function loadFavorites() {
    if (favoriteState.loaded) return favoritesArray();
    if (favoriteState.loadPromise) return favoriteState.loadPromise;

    favoriteState.loadPromise = (async () => {
        const localFavorites = readLocalFavorites();

        try {
            const response = await fetch(FAVORITES_ENDPOINT);
            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error(data.error || response.statusText);

            const serverFavorites = Array.isArray(data.favorites) ? data.favorites : [];
            const mergedFavorites = uniqueFavorites(serverFavorites.concat(localFavorites));
            favoriteState.favorites = new Set(mergedFavorites);
            favoriteState.loaded = true;
            writeLocalFavorites(mergedFavorites);

            if (mergedFavorites.length !== serverFavorites.length) {
                scheduleFavoritesSave();
            }

            return mergedFavorites;
        } catch (error) {
            console.warn("[ForgeCardFavorites] Server favorites unavailable; using browser favorites", error);
            const fallbackFavorites = uniqueFavorites(localFavorites);
            favoriteState.favorites = new Set(fallbackFavorites);
            favoriteState.loaded = true;
            writeLocalFavorites(fallbackFavorites);
            return fallbackFavorites;
        } finally {
            favoriteState.loadPromise = null;
        }
    })();

    return favoriteState.loadPromise;
}

function getCardName(card) {
    return (
        card.getAttribute("data-name") ||
        card.getAttribute("title") ||
        card.innerText ||
        Math.random().toString()
    ).trim();
}

function shouldSkipCard(card) {
    return card.matches('[data-no-favorite="true"], .forge-prompt-sets-add-card');
}

function setHeartState(btn, active) {
    if (active) {
        btn.innerHTML = "&#9829;";
        btn.style.color = "#ff4d88";
        btn.style.opacity = "1";
    } else {
        btn.innerHTML = "&#9825;";
        btn.style.color = "#ffffff";
        btn.style.opacity = "0.8";
    }
}

function refreshFavoriteButtons() {
    const favorites = favoriteState.favorites;
    gradioApp().querySelectorAll(".forge-favorite-btn").forEach((button) => {
        const card = button.closest(".card");
        if (!card) return;
        setHeartState(button, favorites.has(getCardName(card)));
    });
}

function applyFavoritesOnlyFilter() {
    const favorites = favoriteState.favorites;

    gradioApp().querySelectorAll(".extra-network-cards .card").forEach((card) => {
        if (shouldSkipCard(card)) {
            card.style.display = "";
            return;
        }

        if (!favoritesOnlyMode || favorites.has(getCardName(card))) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}

function updateFavoritesFilterButtons() {
    gradioApp().querySelectorAll(".forge-favorites-filter-btn").forEach((btn) => {
        btn.textContent = "❤️";
        btn.style.color = "";
        btn.style.opacity = favoritesOnlyMode ? "1" : "0.75";
        btn.style.filter = favoritesOnlyMode ? "drop-shadow(0 0 6px rgba(255,80,120,0.75))" : "none";
        btn.title = favoritesOnlyMode ? "Showing favorites only" : "Favorites only";
    });
}

function injectFavoriteButtons() {
    if (!favoriteState.loaded) {
        loadFavorites().then(() => {
            injectFavoriteButtons();
            applyFavoritesOnlyFilter();
        });
        return;
    }

    const cards = gradioApp().querySelectorAll(".extra-network-cards .card");

    cards.forEach((card) => {
        if (shouldSkipCard(card)) return;
        if (card.querySelector(".forge-favorite-btn")) return;

        card.style.position = "relative";

        const cardName = getCardName(card);
        const heart = document.createElement("div");

        heart.className = "forge-favorite-btn";
        heart.style.position = "absolute";
        heart.style.top = "8px";
        heart.style.left = "8px";
        heart.style.zIndex = "100";
        heart.style.fontSize = "24px";
        heart.style.cursor = "pointer";
        heart.style.userSelect = "none";
        heart.style.textShadow = "0 0 5px black";
        heart.style.transition = "all 0.15s ease";

        setHeartState(heart, favoriteState.favorites.has(cardName));

        heart.onmouseenter = () => {
            heart.style.transform = "scale(1.2)";
            heart.style.filter = "drop-shadow(0 0 6px rgba(255,80,120,0.9))";
        };

        heart.onmouseleave = () => {
            heart.style.transform = "scale(1)";
            heart.style.filter = "none";
        };

        heart.onclick = (e) => {
            e.stopPropagation();

            if (favoriteState.favorites.has(cardName)) {
                favoriteState.favorites.delete(cardName);
            } else {
                favoriteState.favorites.add(cardName);
            }

            setHeartState(heart, favoriteState.favorites.has(cardName));
            updateFavoritesFilterButtons();
            applyFavoritesOnlyFilter();
            saveFavoritesToServer();
        };

        card.appendChild(heart);
    });
}

function toggleFavoritesOnly() {
    favoritesOnlyMode = !favoritesOnlyMode;
    updateFavoritesFilterButtons();
    applyFavoritesOnlyFilter();
}

function createFavoritesButton() {
    const controls = gradioApp().querySelectorAll(".extra-network-control");
    if (!controls.length) return;

    controls.forEach((control) => {
        if (control.querySelector(".forge-favorites-filter-btn")) return;

        const btn = document.createElement("button");
        btn.className = "forge-favorites-filter-btn";
        btn.textContent = "❤️";
        btn.title = "Favorites only";

        btn.style.marginLeft = "0px";
        btn.style.width = "auto";
        btn.style.height = "auto";
        btn.style.padding = "6px 2px";
        btn.style.borderRadius = "6px";
        btn.style.cursor = "pointer";
        btn.style.fontSize = "20px";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";

        btn.onclick = () => {
            toggleFavoritesOnly();
        };

        control.appendChild(btn);
    });

    updateFavoritesFilterButtons();
}

onUiLoaded(() => {
    setTimeout(() => {
        loadFavorites().then(() => {
            createFavoritesButton();
            injectFavoriteButtons();
            refreshFavoriteButtons();
            applyFavoritesOnlyFilter();
        });

        setInterval(() => {
            createFavoritesButton();
            injectFavoriteButtons();
            refreshFavoriteButtons();
            applyFavoritesOnlyFilter();
        }, 2000);
    }, 1500);
});
