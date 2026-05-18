# Architecture – Ticketsystem Showcase

## Tech Stack

| Layer | Technologie |
|---|---|
| Hosting | Cloudflare Pages |
| Backend | Cloudflare Pages Functions (`functions/api/[[route]].js`) |
| Datenbank | Cloudflare D1 (SQLite, Region WEUR) |
| Frontend | Vanilla HTML + CSS + JS (kein Framework) |
| CLI | `npx wrangler` (portables Node, nicht im PATH) |

## Dateistruktur

```
Ticketsystem/
├── CLAUDE.md                     ← Verbindliche Claude-Regeln (auto-geladen)
├── claude/                       ← Claude-Kontext-Ordner
│   ├── architecture.md
│   └── conventions.md
├── wrangler.toml                 ← Cloudflare-Config (D1-Binding: "DB")
├── schema.sql                    ← DB-Schema (einmalig remote ausgeführt)
├── seed.sql                      ← Demo-Daten (SENSIBEL – nicht eigenständig ausführen)
├── functions/
│   └── api/
│       └── [[route]].js          ← Catch-all Pages Function (gesamtes API)
└── public/                       ← Statische Frontend-Dateien
    ├── index.html                ← Login-Seite
    ├── client.html               ← Kunden-Ansicht (eigene Tickets + Kommentare)
    ├── admin.html                ← Admin-Ansicht (alle Tickets, Löschen)
    ├── app.js                    ← Geteilte Utilities (alle Seiten)
    └── style.css                 ← Design System + Responsive Styles
```

## Datenbank-Schema

```sql
users    (id, username, role, display_name)
tickets  (id, user_id, title, platform, status, description)
comments (id, ticket_id, user_id, username, text, created_at)
```

**Status-Werte** (exakt, keine anderen verwenden):
`Konzept` | `Entwicklung` | `Testen` | `Optimieren` | `Bereit zu Abnahme` | `Abgenommen durch Kunden`

**User-Accounts:**
| username | role   | Anzeigename     |
|----------|--------|-----------------|
| admin    | admin  | Admin           |
| karl     | client | Karl KFZ        |
| bob      | client | Bob Baumeister  |
| beate    | client | Beate Bäcker    |

## API-Routen (`/api/...`)

| Method | Pfad | Auth | Beschreibung |
|--------|------|------|---|
| POST | `/login` | — | Setzt Session via `X-User-ID`-Header |
| GET | `/tickets` | User | Admin: alle; Client: eigene |
| DELETE | `/tickets/:id` | Admin | Löscht Ticket + alle Kommentare |
| GET | `/tickets/:id` | User | Ticket + Kommentare |
| POST | `/tickets/:id/comments` | User | Kommentar hinzufügen |
| DELETE | `/comments/:id` | Admin | Einzelnen Kommentar löschen |

## Authentifizierung (Demo-Modus)

Kein echtes JWT/Session-System. Der User wird in `localStorage` unter `ts_user`
gespeichert. Jede API-Request schickt `X-User-ID: <id>` im Header.
Die Worker-Funktion schlägt die ID gegen die D1-`users`-Tabelle nach.

`requireAuth(role)` in `app.js` leitet ohne gültigen User auf `index.html` um.

## CSS Design System

CSS Custom Properties in `:root` (definiert in `style.css`):

```
--primary / --primary-dark / --primary-light / --primary-border
--bg / --surface / --border / --border-subtle
--tx-1 (darkest) … --tx-4 (lightest)
--red / --red-bg / --red-border
--r-xs … --r-full  (Border-Radius-Skala)
--sh-xs … --sh-xl  (Box-Shadow-Skala)
```

**Responsive Breakpoints:**
- `≤ 768px` — Tablet
- `≤ 480px` — Mobile (inkl. Modal Bottom-Sheet)
- `≤ 400px` — Tiny Screens
- `@media (hover: none) and (pointer: coarse)` — Touch-Geräte
- `@supports (padding-bottom: env(safe-area-inset-bottom))` — iOS Safe Area

## Cloudflare Deployment

- **D1 Binding:** Variable `DB` → Database `ticketsystem-db` (ID: `9fcadd93-...`)
- **Muss im Cloudflare Pages Dashboard** unter Settings → Functions → D1 bindings
  konfiguriert sein (nicht nur in `wrangler.toml`)
- Remote D1 Query: via MCP-Tool `d1_database_query` (wenn Node nicht im PATH)
- GitHub Remote: `https://github.com/paulberger353/ticketsystem-showcase.git`
