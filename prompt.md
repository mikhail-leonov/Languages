# Parallel Align – Project Specification

## Overview

Parallel Align is a web-based single‑page application that challenges users to align scattered translations of phrases across multiple languages. The core mechanic is a drag‑and‑drop / tap‑to‑swap puzzle: given a fixed “key” column (a reference language), the user must rearrange tiles in other columns so that each row forms a coherent phrase in all selected languages. The app stores phrasebooks in the browser’s IndexedDB, supports voice pronunciation, and provides a fully localised UI.

**Primary goal:** Provide an engaging, educational, and accessible tool for practising parallel language recognition and word order across languages.

---

## Core Features

- **Phrasebook management**
  - Import JSON phrasebooks (merge into existing data)
  - Load a built‑in example phrasebook
  - Export the entire database as JSON
  - Clear the database
  - All data persists in the browser’s IndexedDB (nothing is sent to a server).

- **Language and difficulty selection**
  - User picks two or more languages from those present in the phrasebook.
  - One language is designated as the **base** (key column) – its order is fixed.
  - Three difficulty levels determine the number of phrases to align (Easy: 2–4, Normal: 5–7, Supreme: 8–10).

- **Alignment board**
  - The base column is shown in correct order.
  - For each other language, the phrases are randomly shuffled.
  - Tiles can be swapped by drag‑and‑drop (desktop) or by tapping one then another (touch).
  - Each tile includes a speaker button to hear the phrase spoken using the Web Speech API.
  - A live score indicates how many tiles are in the correct position.

- **Checking and feedback**
  - A “Check alignment” button highlights correct (green) and incorrect (red) tiles, and shows a final score.
  - When all tiles are correctly aligned, a victory message appears with an option to start a new round.

- **Re‑scramble** – reshuffle the non‑base columns at any time.
- **Change setup** – return to the language/difficulty selection without losing the current database.

- **Internationalisation (i18n)**
  - The entire UI is localised. Currently supported languages: English, Russian, Spanish, French, German, Italian, Portuguese, Esperanto.
  - Locale files are separate JavaScript modules that register themselves into a global dropdown.

- **Pronunciation**
  - The Web Speech API is used to read each phrase aloud using the appropriate language’s BCP 47 code (e.g., `en-US`, `ru-RU`).
  - A speaker button is available on every tile.

---

## Data Model

The application works with a flat list of phrase **categories**, each containing an array of phrase **entries**. An entry is an object whose keys are language codes (e.g., `english`, `russian`) and values are the translated text.

### JSON Structure
```json
{
  "categories": [
    {
      "name": "Greetings",
      "phrases": [
        { "english": "Hello", "russian": "Привет", "spanish": "Hola", "french": "Bonjour" },
        { "english": "Goodbye", "russian": "До свидания", "spanish": "Adiós", "french": "Au revoir" }
      ]
    }
  ]
}
categories: array of objects.

name: string (category title).

phrases: array of objects, each containing language‑keyed strings.

Import Behaviour
Import merges new categories and phrases with existing ones.

If a category already exists (by case‑insensitive name), new phrases are added; existing phrases are kept.

Duplicate phrases (identical across all language fields) are automatically de‑duplicated.

Database
IndexedDB stores two object stores:

categories: auto‑incrementing ID, name, phrases (array of phrase objects).

meta: key‑value store for application metadata (e.g., current UI locale).

User Interface & Screens
Database Management (Offcanvas)
Shows current status (number of categories, phrases, languages).

Buttons: Import JSON, Load Example, Export JSON, Empty Database.

Displays expected JSON shape for reference.

Empty State
When no phrasebook is loaded, a central screen invites the user to import a JSON file or load the built‑in example.

Setup Screen
Three sequential steps:

Language selection – a grid of language chips (each phrasebook language present). Toggle on/off.

Base language – from the selected set, choose which column will be the fixed key.

Difficulty – choose Easy, Normal, or Supreme (determines number of phrases to align).

A “Begin the round” button starts the game.

Game Board
Title, difficulty and number of lines.

Buttons: Re‑scramble, Change Setup, Check Alignment.

A hint line explains how to swap tiles.

A grid with:

Row numbers (1..n).

One column per selected language.

Each tile contains the phrase text and a speaker button.

The base column is visually distinguished and not movable.

A live score display (“X of Y tiles in their true place”).

When all tiles are correctly aligned, a victory overlay is shown.

Interactions
Drag and drop (desktop) – click and drag a tile onto another tile in the same column; they swap.

Tap (touch) – tap a tile to select it, then tap another tile in the same column to swap.

Speaker button – triggers speechSynthesis to read the phrase aloud using the corresponding language’s BCP code.

Technical Architecture
File Structure
text
/
├── index.html
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   └── lng/
│       ├── en.js
│       ├── ru.js
│       ├── es.js
│       ├── fr.js
│       ├── de.js
│       ├── it.js
│       ├── pt.js
│       └── eo.js
└── (optional) example data (embedded in app.js)
Core JavaScript (app.js)
i18n layer – a global I18N object holds translation strings for the current locale. The UI is updated via data-i18n attributes or the t() function.

Language registry – UI_LOCALES array collects all available interface languages from locale files.

Phrasebook language descriptors – KNOWN maps language keys (e.g., english) to display names, native names, codes, and tint colours.

IndexedDB wrapper – dbMerge, dbGetAll, dbClear, etc. Handles merging and persistence.

State management – DATA (all categories), ALL_PHRASES (flat list of all phrase objects), LANGS (unique language keys), chosen (selected languages), difficulty, round (current game state).

Game logic – selecting random phrases, shuffling tiles, swapping, checking correctness, scoring.

UI rendering – renderEmpty, renderSetup, renderBoard functions that inject HTML into the main container.

Event wiring – drag/drop, tap, speaker, reshuffle, check, etc.

Locale Files
Each locale file (e.g., js/lng/en.js) registers itself with UI_LOCALES and provides a translation object for all UI strings. The keys must match across all locales.

CSS
Uses custom properties for theming, with a warm, paper‑like aesthetic.

Responsive design with flexbox/grid.

Styling for tiles, drag states, selected tiles, correct/incorrect markers.

User Experience Considerations
Accessibility – keyboard support is limited (tap/drag is primary), but semantic HTML and ARIA labels should be considered.

Responsive – works on both desktop and mobile (touch events).

Feedback – visual cues for tile selection, drag, and correctness.

Performance – all data is stored locally; no network requests after initial load.

Implementation Dependencies
Bootstrap 5 – for layout, offcanvas, and dropdown components (optional but used in this implementation).

Web Speech API – for text‑to‑speech (built‑in to modern browsers).

Fonts – Google Fonts (Inter, Fraunces).

Example Data
The application includes a built‑in example phrasebook with three categories: Greetings & Basic Interaction, Getting Around, and At the Restaurant. Each contains 5–6 phrases covering English, Russian, Spanish, French, German, Portuguese, Italian.

Future Enhancements (Optional)
Support for more languages in the UI.

Ability to edit or delete phrases/categories.

Persist selected language preferences in IndexedDB.

Sound effects for actions.

Timer or streak tracking.

Sharing of custom phrasebooks via URL.

Developer Prompt
Build a complete web application called Parallel Align that enables users to import JSON phrasebooks, select languages, and play an alignment game where they drag tiles to re‑order translations so that each row matches a single phrase across all selected languages. The app must store data in IndexedDB, include a built‑in example, support drag‑and‑drop and tap‑to‑swap interactions, provide voice pronunciation via the Web Speech API, and have a fully localised UI in English, Russian, Spanish, French, German, Italian, Portuguese, and Esperanto. The interface should be responsive and visually polished. Implement the code as a single HTML page with separate CSS and JavaScript files, following the architecture described above. Include all necessary i18n dictionaries and a clear setup flow.

