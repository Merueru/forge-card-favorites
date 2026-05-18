# Forge Card Favorites

Small JavaScript-only extension for Stable Diffusion WebUI Forge that adds
favorite toggles to Extra Networks cards.

![Preview](image/favpic001.png)

## Features

- Adds a heart button to Extra Networks cards
- Stores favorites in browser `localStorage`
- Adds a Favorites Only filter button to Extra Networks controls
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
