import json
import os
import tempfile
import threading
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from modules import script_callbacks


EXTENSION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(EXTENSION_DIR, "data")
FAVORITES_PATH = os.path.join(DATA_DIR, "favorites.json")
ENDPOINT_BASE = "/forge-card-favorites"
MAX_FAVORITES = 20000
_lock = threading.Lock()


def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def ensure_dirs():
    os.makedirs(DATA_DIR, exist_ok=True)


def normalize_favorites(values):
    favorites = []
    seen = set()

    if not isinstance(values, list):
        return favorites

    for value in values[:MAX_FAVORITES]:
        if not isinstance(value, str):
            continue

        value = value.strip()
        if not value or value in seen:
            continue

        seen.add(value)
        favorites.append(value)

    return favorites


def read_data():
    ensure_dirs()
    if not os.path.exists(FAVORITES_PATH):
        return {"version": 1, "favorites": [], "updated_at": None}

    try:
        with open(FAVORITES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        print(f"[ForgeCardFavorites] Failed to read favorites: {exc}")
        return {"version": 1, "favorites": [], "updated_at": None}

    if not isinstance(data, dict):
        return {"version": 1, "favorites": [], "updated_at": None}

    return {
        "version": 1,
        "favorites": normalize_favorites(data.get("favorites", [])),
        "updated_at": data.get("updated_at"),
    }


def write_data(favorites):
    ensure_dirs()
    data = {
        "version": 1,
        "favorites": normalize_favorites(favorites),
        "updated_at": now_iso(),
    }

    fd, temp_path = tempfile.mkstemp(prefix="favorites-", suffix=".json", dir=DATA_DIR)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(temp_path, FAVORITES_PATH)
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass

    return data


def register_routes(demo, app: FastAPI):
    @app.get(f"{ENDPOINT_BASE}/favorites")
    async def get_favorites():
        with _lock:
            data = read_data()
        return JSONResponse({"ok": True, **data})

    @app.post(f"{ENDPOINT_BASE}/favorites")
    async def set_favorites(request: Request):
        try:
            payload = await request.json()
            favorites = normalize_favorites(payload.get("favorites", []))
            with _lock:
                data = write_data(favorites)
            return JSONResponse({"ok": True, **data})
        except Exception as exc:
            print(f"[ForgeCardFavorites] Failed to save favorites: {exc}")
            return JSONResponse({"ok": False, "error": str(exc)}, status_code=400)


script_callbacks.on_app_started(register_routes)
