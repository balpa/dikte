# Dikte

Turkish Classical Music Note Dictation App — converts sound to musical notes using the 53-TET (koma) system.

## Features

- **Pitch Detection** — Real-time microphone input with McLeod pitch detection (pitchy)
- **53-TET Koma System** — Full support for AEU accidentals (Fazla, Bakiye, Küçük/Büyük mücenneb, Tanini)
- **Staff Notation** — VexFlow-powered SVG rendering with click-to-place note entry
- **10 Makams** — Rast, Uşşak, Hicaz, Segâh, Hüseyni, Kürdilihicazkâr, Nihavend, Buselik, Karcığar, Sabâ
- **Audio File Import** — Analyze audio files with onset detection and automatic note extraction
- **Bilingual** — Turkish and English interface (i18next)
- **File I/O** — Save and load `.dikte` files (JSON format)
- **Undo/Redo** — Full history support

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start in development mode
npm run dev

# Production build
npm run build

# Type check
npm run typecheck
```

## Tech Stack

- **Electron** + electron-vite
- **React 19** + TypeScript
- **Tailwind CSS 4** (PostCSS)
- **VexFlow 5** — SVG music notation
- **pitchy** — McLeod pitch detection
- **Zustand** — State management
- **i18next** — Internationalization (TR/EN)

## Domain

One octave = 53 koma. Natural notes map to koma positions: Do(0), Re(9), Mi(17), Fa(22), Sol(31), La(40), Si(48).

AEU accidentals provide 5 sharp and 5 flat variants with koma offsets of ±1, ±4, ±5, ±8, ±9.

Reference pitch: A4 = 440 Hz.

## License

MIT
