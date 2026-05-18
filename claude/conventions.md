# Code & Design Conventions

## JavaScript

### Naming
| Art | Stil | Beispiel |
|---|---|---|
| Variablen / Funktionen | camelCase | `renderTicketCard`, `ticketId` |
| Konstanten (module-level) | UPPER_SNAKE | `STATUS_STYLES`, `ICON`, `API` |
| DOM-IDs | kebab-case | `ticket-42`, `comments-42` |
| CSS-Klassen | kebab-case | `ticket-card`, `btn-danger` |

### API-Calls
Immer über die zentrale `api(path, opts)` Funktion in `app.js`.
Nie `fetch()` direkt verwenden — `api()` setzt automatisch den `X-User-ID`-Header.

### Template Literals (HTML in JS)
- User-Content immer durch `esc()` escapen
- IDs und Event-Handler-Daten als `data-*` Attribute setzen, nie in `onclick`-Strings
  interpolieren (verhindert Injection durch Sonderzeichen in Titeln/Namen)

```js
// RICHTIG
<button data-ticket-id="${t.id}" onclick="deleteTicket(this)">

// FALSCH – bricht bei Anführungszeichen im Titel
<button onclick="deleteTicket(${t.id}, '${t.title}')">
```

### Error Handling
- API-Fehler immer mit `showToast('Fehler: ' + err.message, 'error')` anzeigen
- Lade-Fehler als `error-banner` in den Container rendern (nicht als Toast)
- Kein `try/catch` für Logik, die nicht fehlschlagen kann

## CSS

### Neue Farben / Abstände
Immer CSS Custom Properties aus `:root` verwenden — keine Hard-coded Werte.
Neue Variablen in `:root` definieren, bevor sie verwendet werden.

### Status-Farben
Werden in zwei Stellen gesetzt und müssen synchron bleiben:
1. `STATUS_STYLES` Objekt in `app.js` (für `.status-badge`)
2. `[data-status="..."]` Selektoren in `style.css` (für linke Karten-Border)

### Avatar-Farben
Werden via `data-idx` Attribut gesetzt. Index 0–5 deterministisch aus `avatarIdx(name)`.
Farbpalette in `style.css` unter `.comment-avatar[data-idx="N"]`.

### Media Queries – Reihenfolge in style.css
1. Base styles
2. Component styles
3. `@media (max-width: 768px)` — Tablet
4. `@media (max-width: 480px)` — Mobile
5. `@media (max-width: 400px)` — Tiny
6. `@media (hover: none) and (pointer: coarse)` — Touch
7. `@supports (padding-bottom: env(...))` — iOS Safe Area
8. Utilities (scroll, selection, scrollbar)
9. Modals / Overlays

### iOS Zoom-Verhinderung
Alle `<input>` und `<textarea>` Elemente müssen bei `≤768px` mindestens `font-size: 16px`
haben. Das ist bereits global geregelt — bei neuen Inputs prüfen ob der spezifischere
Selector die globale Regel überschreibt.

## HTML

### Seitenstruktur
Jede Seite lädt `app.js` als erstes Script, dann inline-Script für seitenspezifische Logik.
`requireAuth(role)` ist immer der erste Aufruf im inline-Script.

### Neue Seiten
Müssen die `topbar`-Struktur aus `admin.html` / `client.html` übernehmen (Logo, Spacer,
User-Badge, Logout-Button) und `app.js` laden.

## Commit-Messages

Format: Imperativ, Englisch, max 72 Zeichen in der ersten Zeile.
```
Add password modal for admin login
Fix comment deletion on mobile
Optimize ticket card layout for small screens
```

Stil-Referenz aus bisherigen Commits:
- `Optimized GUI for Desktop`
- `Optimized GUI for Mobile`
- `Implemented Loginsystem for admin`

Immer mit Co-Author-Zeile abschließen:
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Pages Function (Backend)

- Alle Routen in `functions/api/[[route]].js` — kein Split in mehrere Dateien
- CORS-Header auf **jeder** Response setzen (inkl. OPTIONS preflight)
- Auth-Check: `request.headers.get('X-User-ID')` → D1-Lookup
- Nach INSERT: neue Row via `result.meta.last_row_id` zurücklesen
- Fehlermeldungen immer als `{ error: "..." }` mit passendem HTTP-Status
