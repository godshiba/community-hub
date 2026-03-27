# Tech Stack

## Runtime & Build

| Package | Version | Role |
|---------|---------|------|
| electron | ^33.0.0 | Desktop runtime |
| electron-vite | ^3.0.0 | Build tool (Vite for Electron) |
| electron-builder | ^25.0.0 | Packaging (dmg, exe, AppImage) |

## Frontend

| Package | Version | Role |
|---------|---------|------|
| react | ^19.0.0 | UI framework |
| react-dom | ^19.0.0 | React DOM renderer |
| typescript | ^5.7.0 | Type safety (strict mode) |

## Styling & Components

| Package | Version | Role |
|---------|---------|------|
| tailwindcss | ^4.0.0 | Utility CSS engine |
| shadcn/ui | latest | Component primitives |
| lucide-react | ^0.460.0 | Icons |
| class-variance-authority | ^0.7.0 | Component variants (shadcn dep) |
| clsx + tailwind-merge | latest | Class merging utilities |

## State & Data

| Package | Version | Role |
|---------|---------|------|
| zustand | ^5.0.0 | State management |
| better-sqlite3 | ^11.0.0 | Local database |
| date-fns | ^4.0.0 | Date manipulation |
| recharts | ^2.15.0 | Charts and graphs |
| papaparse | ^5.5.0 | CSV export |
| jspdf + html2canvas | latest | PDF export |

## Rich Text (Scheduler)

| Package | Version | Role |
|---------|---------|------|
| @tiptap/react | ^2.10.0 | Rich text editor |
| @tiptap/starter-kit | ^2.10.0 | Base extensions |

## Platform SDKs

| Package | Version | Role |
|---------|---------|------|
| discord.js | ^14.16.0 | Discord bot API |
| node-telegram-bot-api | ^0.66.0 | Telegram bot API |

## AI Providers (all optional)

| Package | Version | Role |
|---------|---------|------|
| openai | ^4.70.0 | OpenAI + Grok (compatible SDK) |
| @anthropic-ai/sdk | ^0.30.0 | Claude API |
| @google/generative-ai | ^0.21.0 | Gemini API |

## Dev Dependencies

| Package | Version | Role |
|---------|---------|------|
| @types/better-sqlite3 | latest | SQLite types |
| @types/node-telegram-bot-api | latest | Telegram types |
| vitest | ^2.0.0 | Unit testing |
| @testing-library/react | ^16.0.0 | Component testing |

## Notes

- Grok uses OpenAI-compatible SDK with different base URL — no separate package needed
- All AI provider packages are optional peer dependencies
- Versions are minimum targets, pin exact versions in lockfile
