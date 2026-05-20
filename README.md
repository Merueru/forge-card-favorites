[README.md](https://github.com/user-attachments/files/28066494/README.md)
# Forge Card Favorites ❤️

Small Stable Diffusion WebUI Forge extension that adds favorite toggles to Extra
Networks cards.

![Preview](image/favpic001.png)

## Features

- Adds a heart button to Extra Networks cards
- Adds a Favorites Only filter button to Extra Networks controls
- Stores favorites in the extension data folder so they can be shared by
  browsers that open the same Forge install
- No Python package dependencies and no startup installer

## Install

Clone or copy this folder into:

```text
webui/extensions/forge-card-favorites
```

Then restart Forge.

## Notes

- Favorites are saved to `data/favorites.json` inside this extension folder.
- The `data/` folder is ignored by git because it is user data.
- After installing or updating, restart Forge once so the backend route is
  registered.
