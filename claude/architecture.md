# Architecture – Ticketsystem Showcase

## Tech Stack

| Layer | Technologie |
|---|---|
| Hosting | Cloudflare Pages (rein statisch, keine Functions/Bindings) |
| Daten | `public/data/seed.json` + In-Memory State (`public/store.js`) |
| Frontend | Vanilla HTML + CSS + JS (kein Framework) |
| CLI | `npx wrangler` (portables Node, nicht im PATH) |

Es gibt **keinen Server-Code** und **keine Datenbank**. Die App ist eine
statische Seite; sämtliche Logik läuft im Browser.

## Dateistruktur

```
Ticketsystem/
├── CLAUDE.md                     ← Verbindliche Claude-Regeln (auto-geladen)
├── claude/                       ← Claude-Kontext-Ordner
│   ├── architecture.md
│   └── conventions.md
├── wrangler.toml                 ← Cloudflare-Config (rein statisches Pages-Deployment)
└── public/                       ← Statische Frontend-Dateien (= gesamte App)
    ├── index.html                ← Login-Seite (Account-Auswahl)
    ├── client.html                ← Kunden-Ansicht (eigene Tickets + Kommentare)
    ├── admin.html                 ← Admin-Ansicht (alle Tickets, Liste + Kanban-Board)
    ├── app.js                    ← Geteilte Utilities (alle Seiten)
    ├── store.js                  ← In-Memory State/CRUD (ersetzt die frühere API)
    ├── data/seed.json            ← Hartcodierte Demo-Daten (User + Tickets)
    └── style.css                 ← Design System + Responsive Styles
```

## Datenmodell (`public/data/seed.json`)

```
users    (id, username, role, display_name)
tickets  (id, user_id, title, platform, status, description, created_at, comments[])
comments (id, user_id, username, text, created_at) — verschachtelt im Ticket
```

**Status-Werte** (exakt, keine anderen verwenden — auch `STATUS_ORDER` in
`store.js`):
`Konzept` | `Entwicklung` | `Testen` | `Optimieren` | `Bereit zu Abnahme` | `Abgenommen durch Kunden`

**User-Accounts:**
| username | role   | Anzeigename     |
|----------|--------|-----------------|
| admin    | admin  | Admin           |
| karl     | client | Karl KFZ        |
| bob      | client | Bob Baumeister  |
| beate    | client | Beate Bäcker    |

## State Module (`public/store.js`)

Lädt `data/seed.json` einmal pro Seitenaufruf (`Store.init()`, idempotent
via internem Promise-Cache) in ein In-Memory-Objekt (`structuredClone` —
das Original bleibt unangetastet). Alle Mutationen passieren nur im
Speicher; nichts wird zurückgeschrieben. **Ein Hard-Refresh oder eine neue
Seiten-Navigation lädt die Seed-Daten erneut frisch — jede Änderung
(Tickets, Kommentare, Status) geht dabei verloren.** Das ist gewollt: die
App ist eine Demo ohne Persistenz.

Öffentliche Funktionen:
- `init()` — lädt/cached die Seed-Daten
- `findUserByUsername(username)`, `getClientUsers()`
- `getTickets(user)`, `getTicket(id)` — geben Tickets inkl. `owner_name` zurück
- `createTicket(fields)`, `updateTicket(id, patch)`, `deleteTicket(id)`
- `addComment(ticketId, {user_id, username, text})`, `deleteComment(ticketId, commentId)`

`STATUS_ORDER` (globales Array, ebenfalls in `store.js`) ist die einzige
Quelle der Wahrheit für Reihenfolge und Namen der 6 Status — wird von
Timeline, Kanban-Spalten und Stats-Bar gemeinsam genutzt.

## Authentifizierung (Demo-Modus)

Kein Server, keine echten Passwörter (außer einer rein clientseitigen
Formalität beim Admin-Login). Der eingeloggte User wird in `localStorage`
unter `ts_user` gespeichert und bleibt über Reloads hinweg erhalten.

- Ein echter Reload von `index.html` bei bestehender Session leitet
  automatisch zum passenden Dashboard weiter (Session bleibt bestehen).
- Navigation über den Browser-**Zurück**-Button auf `index.html`
  unterdrückt diesen Auto-Redirect gezielt (Prüfung über
  `performance.getEntriesByType('navigation')[0].type === 'back_forward'`),
  damit man dort einen anderen Account wählen kann, ohne sofort wieder
  weitergeleitet zu werden.

`requireAuth(role)` in `app.js` leitet ohne gültigen User (oder falscher
Rolle) auf `index.html` um.

## CSS Design System — "Technical / Blueprint"

CSS Custom Properties in `:root` (definiert in `style.css`):

```
--ink-950 … --ink-600   Oberflächen (dunkles Blueprint-Navy)
--line / --line-soft    Rahmen/Trennlinien
--paper / --muted / --faint   Textfarben
--signal / --signal-bg / --signal-ink   Akzentfarbe (Amber)
--red / --red-bg / --red-border         Fehler/Danger
--status-*               6 Status-Akzentfarben (siehe unten)
--font-display / --font-body / --font-mono   Space Grotesk / IBM Plex Sans / IBM Plex Mono
--r-xs … --r-full        Border-Radius-Skala (klein, technisch)
--sh-sm … --sh-xl        Box-Shadow-Skala (nur für Overlays)
```

**Statusfarben leben ausschließlich in einem einzigen CSS-Block** (kein
JS-Duplikat mehr): Jedes Element mit `data-status="…"` erbt automatisch
`--accent` / `--accent-bg` / `--accent-border` aus dem `[data-status="…"]`-
Regelblock am Anfang von `style.css`. Badge, Ticket-Karte, Timeline-Knoten
und Kanban-Spalte lesen alle aus denselben drei Variablen.

**Responsive Breakpoints** (unverändert in Struktur/Reihenfolge):
- `≤ 768px` — Tablet
- `≤ 480px` — Mobile (inkl. Modal Bottom-Sheet, Kanban-Spaltenbreite)
- `≤ 400px` — Tiny Screens
- `@media (hover: none) and (pointer: coarse)` — Touch-Geräte (u.a. zeigt
  dies den Kanban-Quick-Status-Button statt Drag & Drop)
- `@supports (padding-bottom: env(safe-area-inset-bottom))` — iOS Safe Area

## Kernfeatures

**Status-Timeline** (`renderTimeline()` in `app.js`): horizontaler Stepper
auf jeder Ticket-Karte, zeigt die Position im 6-stufigen Workflow. Bei
Statusänderungen wird das bestehende DOM-Element gezielt gepatcht
(`updateTimelineDOM()`/`patchTicketCard()`) statt neu gerendert, damit die
Füllung sichtbar animiert statt zu springen.

**Kanban-Board** (`admin.html`, nur Admin): Liste/Board-Umschalter, 6
Spalten nach `STATUS_ORDER`. Drag & Drop über native HTML5-DnD-API; auf
Touch-Geräten ersetzt ein Tap-Menü (`openQuickStatusMenu()`) das Draggen.
Beide Wege laufen über denselben `Store.updateTicket()`-Pfad wie das
Edit-Modal.

## Cloudflare Deployment

- Rein statisches Pages-Deployment (`pages_build_output_dir = "public"`),
  keine D1-Bindings, keine Functions.
- `npm run dev` → `wrangler pages dev public/`
- `npm run deploy` → `wrangler pages deploy public/`
- GitHub Remote: `https://github.com/paulberger353/ticketsystem-showcase.git`
