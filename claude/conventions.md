# Code & Design Conventions

## JavaScript

### Naming
| Art | Stil | Beispiel |
|---|---|---|
| Variablen / Funktionen | camelCase | `renderTicketCard`, `ticketId` |
| Konstanten (module-level) | UPPER_SNAKE | `STATUS_ORDER`, `ICON` |
| DOM-IDs | kebab-case | `ticket-42`, `comments-42` |
| CSS-Klassen | kebab-case | `ticket-card`, `btn-danger` |

### State-Mutationen
Immer über die `Store.*` Funktionen in `store.js` (`createTicket`,
`updateTicket`, `deleteTicket`, `addComment`, `deleteComment`, …).
Nie das interne `data`-Objekt in `store.js` direkt von außen mutieren.
Nach einer Mutation, die den Status ändert, `patchTicketCard()` statt
eines vollständigen Re-Renders verwenden, damit die Timeline animiert.

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
- Fehler aus User-Aktionen (Speichern, Löschen, …) mit
  `showToast('Fehler: ' + err.message, 'error')` anzeigen
- Lade-Fehler (z.B. `data/seed.json` nicht erreichbar) als `error-banner`
  in den Container rendern (nicht als Toast)
- Kein `try/catch` für Logik, die nicht fehlschlagen kann

## CSS

### Neue Farben / Abstände
Immer CSS Custom Properties aus `:root` verwenden — keine Hard-coded Werte.
Neue Variablen in `:root` definieren, bevor sie verwendet werden.

### Status-Farben
Leben ausschließlich in **einer** Stelle: dem `[data-status="..."]`-
Regelblock am Anfang von `style.css`, der `--accent`/`--accent-bg`/
`--accent-border` setzt. Jedes Element, das eine Statusfarbe braucht
(Badge, Ticket-Karte, Timeline-Knoten, Kanban-Spalte), bekommt einfach
selbst das `data-status`-Attribut — kein JS-Duplikat, keine zweite Quelle.

### Avatar-Farben
Werden via `data-idx` Attribut gesetzt. Index 0–5 deterministisch aus `avatarIdx(name)`.
Farbpalette in `style.css` unter `.comment-avatar[data-idx="N"]`.

### Media Queries – Reihenfolge in style.css
1. Reset & `:root` Tokens (inkl. `[data-status]`-Block)
2. Component styles (Topbar, Cards, Timeline, Comments, Buttons, Login,
   States, Toast, Modals, Filter-Bar, Kanban)
3. Utilities (scroll, selection, scrollbar)
4. `@media (max-width: 768px)` — Tablet
5. `@media (max-width: 480px)` — Mobile
6. `@media (hover: none) and (pointer: coarse)` — Touch
7. `@media (max-width: 400px)` — Tiny
8. `@supports (padding-bottom: env(...))` — iOS Safe Area

Neue Komponenten werden im Component-Block ergänzt (nicht als separater
Abschnitt am Dateiende), responsive Anpassungen dafür in die passende
Media-Query oben.

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

Immer mit Co-Author-Zeile abschließen (Modellname an die jeweils
aktuelle Session anpassen):
```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```
