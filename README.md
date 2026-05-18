# Forge Card Favorites ❤️

Small JavaScript-only extension for Stable Diffusion WebUI Forge that adds
favorite toggles to Extra Networks cards.

![Preview](image/favpic001.png)

## Features

- Adds a heart button to Extra Networks cards
- Mark cards as favorites or remove them from favorites
- Adds a Favorites Only heart button to show only your favorite cards
- Stores favorites in browser `localStorage`
- No Python dependencies and no startup installer

## Install

Clone or copy this folder into:

```text
webui/extensions/forge-card-favorites
```

Then restart Forge.

## Notes

- Favorites are stored in the current browser profile, not in Forge settings.
- Clearing browser site data will clear favorites.
- The extension only modifies the Forge UI in the browser.
