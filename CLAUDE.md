# Dikte

Turkish Classical Music Note Dictation App — converts sound to musical notes using the 53-TET (koma) system.

## Commands

- `npm run dev` — Start Electron app in development mode (electron-vite)
- `npm run build` — Production build to `out/`
- `npm run typecheck` — Run TypeScript type checking (`tsc --noEmit`)

## Architecture

Electron app with three processes:

- **Main** (`src/main/`) — App lifecycle, native menus, IPC file dialogs
- **Preload** (`src/preload/`) — contextBridge exposing `window.api`
- **Renderer** (`src/renderer/`) — React 19 SPA

### Key directories

- `renderer/core/` — Pure math/data: 53-TET koma system, AEU accidentals, makam definitions, pitch-to-note conversion
- `renderer/audio/` — Web Audio API pitch detection (pitchy), onset detection, file analysis
- `renderer/components/staff/` — VexFlow SVG staff rendering, click-to-place interaction
- `renderer/components/toolbar/` — Duration and accidental selection UI
- `renderer/components/audio/` — Microphone panel, file import, tuner display
- `renderer/store/` — Zustand store with manual undo/redo history
- `renderer/i18n/` — Turkish/English translations (i18next)
- `renderer/types/` — Shared TypeScript interfaces

### Data flow

```
Hz (mic/file) → hzToKoma() → komaToDikteNote() → DikteNote → Zustand store → VexFlow render
Manual entry: click position → createNote(natural, octave, accidental) → store → render
```

## Tech stack

- Electron + electron-vite (bundler)
- React 19 + TypeScript
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- VexFlow 5 (SVG notation rendering)
- pitchy (McLeod pitch detection)
- Zustand (state management)
- i18next + react-i18next (TR/EN)

## Domain: Turkish 53-TET koma system

One octave = 53 koma. Natural notes: Do(0), Re(9), Mi(17), Fa(22), Sol(31), La(40), Si(48).

AEU accidentals (5 sharp + 5 flat): Fazla(±1), Bakiye(±4), Küçük mücenneb(±5), Büyük mücenneb(±8), Tanini(±9).

Reference pitch: A4 = 440 Hz = koma 40 from C4.

## File format

`.dikte` files are JSON matching the `DikteFile` interface: `{ version: string, score: Score }`.

## Code conventions

- Use `--legacy-peer-deps` when installing npm packages
- VexFlow accidentals use Western approximations (`#`, `b`, `+`, `db`, `##`, `bb`) with koma labels
- All IPC channels go through the preload bridge — never use `nodeIntegration`
- Note IDs are generated with `note_${Date.now()}_${counter}` pattern
- Translations use nested keys: `t('accidentals.bakiye_sharp')`, `t('makam.rast')`
