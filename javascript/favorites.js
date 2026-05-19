const FAVORITE_STORAGE_KEY = 'forgeFavoriteLoras';

function getFavorites() {
    return JSON.parse(
        localStorage.getItem(FAVORITE_STORAGE_KEY) || '[]'
    );
}

function saveFavorites(favorites) {
    localStorage.setItem(
        FAVORITE_STORAGE_KEY,
        JSON.stringify(favorites)
    );
}

function getCardName(card) {

    return (
        card.getAttribute('data-name') ||
        card.getAttribute('title') ||
        card.innerText ||
        Math.random().toString()
    ).trim();
}

function setHeartState(btn, active) {

    if (active) {
        btn.innerHTML = '♥';
        btn.style.color = '#ff4d88';
        btn.style.opacity = '1';
    } else {
        btn.innerHTML = '♡';
        btn.style.color = '#ffffff';
        btn.style.opacity = '0.8';
    }
}

function injectFavoriteButtons() {

    const cards = gradioApp().querySelectorAll(
        '.extra-network-cards .card'
    );

    const favorites = getFavorites();

    cards.forEach(card => {

        if (card.matches('[data-no-favorite="true"], .forge-prompt-sets-add-card')) {
            return;
        }

        if (card.querySelector('.forge-favorite-btn')) {
            return;
        }

        card.style.position = 'relative';

        const cardName = getCardName(card);

        const heart = document.createElement('div');

        heart.className = 'forge-favorite-btn';

        heart.style.position = 'absolute';
        heart.style.top = '8px';
        heart.style.left = '8px';
        heart.style.zIndex = '100';
        heart.style.fontSize = '24px';
        heart.style.cursor = 'pointer';
        heart.style.userSelect = 'none';
        heart.style.textShadow = '0 0 5px black';
        heart.style.transition = 'all 0.15s ease';

        let active = favorites.includes(cardName);

        setHeartState(heart, active);

        heart.onmouseenter = () => {

            heart.style.transform = 'scale(1.2)';
            heart.style.filter = 'drop-shadow(0 0 6px rgba(255,80,120,0.9))';
        };

        heart.onmouseleave = () => {

            heart.style.transform = 'scale(1)';
            heart.style.filter = 'none';
        };

        heart.onclick = (e) => {

            e.stopPropagation();

            let favs = getFavorites();

            if (favs.includes(cardName)) {

                favs = favs.filter(x => x !== cardName);
                active = false;

            } else {

                favs.push(cardName);
                active = true;
            }

            saveFavorites(favs);

            setHeartState(heart, active);
        };

        card.appendChild(heart);
    });
}

let favoritesOnlyMode = false;

function toggleFavoritesOnly() {

    favoritesOnlyMode = !favoritesOnlyMode;

    const favorites = getFavorites();

    const cards = gradioApp().querySelectorAll(
        '.extra-network-cards .card'
    );

    cards.forEach(card => {

        if (card.matches('[data-no-favorite="true"], .forge-prompt-sets-add-card')) {
            card.style.display = '';
            return;
        }

        const cardName = getCardName(card);

        if (!favoritesOnlyMode) {

            card.style.display = '';
            return;
        }

        if (favorites.includes(cardName)) {

            card.style.display = '';

        } else {

            card.style.display = 'none';
        }
    });

    const btn = document.getElementById(
        'forge-favorites-filter-btn'
    );

    if (btn) {

        btn.innerHTML = favoritesOnlyMode
            ? '❤️'
            : '♡';

        btn.style.color = favoritesOnlyMode
            ? '#ff4d88'
            : '';
    }
}

function createFavoritesButton() {

    if (document.getElementById(
        'forge-favorites-filter-btn'
    )) {
        return;
    }

    const controls = gradioApp().querySelectorAll(
        '.extra-network-control'
    );

    if (!controls.length) {
        return;
    }

    controls.forEach(control => {

        const btn = document.createElement('button');

        btn.id = 'forge-favorites-filter-btn';

        btn.innerHTML = '❤️';
        btn.title = 'Favorites Only';

        btn.style.marginLeft = '16px';
        btn.style.width = '10px';
        btn.style.height = '38px';
        btn.style.padding = '0';
        btn.style.borderRadius = '8px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '20px';

        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';

        btn.onclick = () => {
            toggleFavoritesOnly();
        };

        control.appendChild(btn);
    });
}

onUiLoaded(() => {

    setTimeout(() => {

        createFavoritesButton();

        injectFavoriteButtons();

        setInterval(() => {
            injectFavoriteButtons();
        }, 2000);

    }, 1500);

});
