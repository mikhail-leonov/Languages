# Languages

A private, browser-based phrasebook app. Load multilingual phrasebooks, browse them by category, and keep your library on hand between visits — everything is stored locally in your browser, and nothing is uploaded anywhere.

The app is plain HTML, CSS, and vanilla JavaScript built on Bootstrap, with no build step and no server. The interface itself is translated into several languages.

---

## Features

- **Local phrasebook library** — phrasebooks are kept in an in-browser database (IndexedDB), so your library is still there when you come back. Nothing leaves your device.
- **Category-based phrases** — each phrasebook is a set of named categories, and each category holds phrases with one entry per language (for example English / French / German).
- **Import & export**
  - Import a phrasebook from a JSON file into the database.
  - Load a built-in **example phrasebook** to try things out.
  - Export your whole database back to JSON for backup or sharing.
  - Empty the database when you want a clean slate.
- **Translated interface** — switch the UI language from the masthead; the app ships with several interface language packs.
- **Status at a glance** — a pill in the header shows whether a phrasebook is currently loaded, and the Database panel reports current status.

---

## Getting started

The app is fully static and only needs to be served over HTTP. (Opening `index.html` directly from the file system generally won't work, because browsers restrict IndexedDB on the `file://` protocol.)

From the project root:

```bash
# Python 3
python -m http.server 8000

# or Node
npx serve .
```

Then open `http://localhost:8000/` in a modern browser.

On first run the database is empty — the header shows **No phrasebook loaded**. Open **Database**, then either **Load the example phrasebook** or **Import JSON into database** to get started.

> All data lives in your browser's IndexedDB. Clearing site data — or using **Empty the database** — permanently removes it, so export to JSON first if you want a backup.

---

## Phrasebook JSON format

Imported files use this shape: a list of categories, each with a list of phrases, where every phrase carries one field per language.

```json
{
  "categories": [
    {
      "name": "Greetings",
      "phrases": [
        { "english": "Hello", "french": "Bonjour", "german": "Hallo" }
      ]
    }
  ]
}
```

You can add or omit language fields per phrase to match the languages you care about.

---

## Project structure

```
index.html                     App shell: masthead, main stage, Database panel
public/
  css/
    bootstrap/bootstrap.min.css Bootstrap base styles
    app.css                     App theme
  fonts/
    common/fraunces.css         Fraunces display font
  js/
    bootstrap/bootstrap.min.js  Bootstrap behaviour (dropdown, offcanvas)
    lng/
      en.js  ru.js  es.js  fr.js
      de.js  it.js  pt.js  sp.js   Interface language packs
    app.js                      Application logic (loads last)
```

`index.html` loads Bootstrap, then each interface language pack, then `app.js` — so the translation strings are registered before the app initializes. Interface text is marked up with `data-i18n` attributes that the app resolves against the active language pack.

---

## Adding an interface language

1. Copy one of the existing packs in `public/js/lng/` to `public/js/lng/<code>.js`.
2. Translate its strings (the `data-i18n` keys used in `index.html`, such as `app_sub`, `nav_database`, `oc_import`, `oc_export`).
3. Add a matching `<script src="public/js/lng/<code>.js">` tag in `index.html`, before `app.js`.

The new language then becomes selectable from the masthead's language switcher.

---

## Browser support

A current desktop or mobile browser with IndexedDB support and ES2017+. Bootstrap 5 handles the dropdown and the slide-in Database panel.

---

## Privacy

There is no backend. Your phrasebooks are stored only in your own browser's database and are never uploaded. Use the JSON export to back them up or move them to another machine.
