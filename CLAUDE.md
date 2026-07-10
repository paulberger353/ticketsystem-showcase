# Claude – Verhaltensregeln für dieses Projekt

> Diese Datei ist verbindlich. Jede Regel hier hat Vorrang vor Standardverhalten.
> Weiterführende Kontext-Dateien liegen unter `claude/`.

---

## Sprache

| Kontext | Sprache |
|---|---|
| Antworten an den Nutzer | **Deutsch** |
| Code, Variablen, Funktionsnamen | **Englisch** |
| Commit-Messages | **Englisch** |
| Code-Kommentare | **Englisch** |
| Datei- und Ordnernamen | **Englisch** |

---

## Autonomie & Arbeitsweise

- Bei **nicht-trivialen Aufgaben** (neue Features, Refactoring, strukturelle Änderungen):
  Kurzen Plan in **1–2 Sätzen** nennen, bevor ich loslege. Der Nutzer kann korrigieren.
- Bei **klaren, kleinen Aufgaben** (Bug-Fix, Styling, Text-Änderung): direkt umsetzen.
- Abhängigkeiten und Aufgaben-Reihenfolge entscheide **ich selbständig**. Ich erkläre
  kurz, wenn ich von der genannten Reihenfolge abweiche.
- UI/Design-Entscheidungen (Farben, Abstände, Layout-Varianten): **volle Freiheit**,
  wichtige Eigenentscheidungen kurz im Chat erwähnen.

---

## Antwort-Stil

- Nach einer erledigten Aufgabe: **strukturierte Highlights** — kurze Aufzählung
  der wichtigsten Änderungen mit Datei-Referenz. Kein vollständiger Recap, keine langen
  Erklärungen zu selbstverständlichen Dingen.
- Nicht-triviale Eigenentscheidungen: **kurz im Chat erwähnen**, nicht in separater Datei.

---

## Git-Verhalten

```
Committen:   Automatisch nach jeder abgeschlossenen Aufgabe
Pushen:      NUR auf explizite Anweisung des Nutzers
```

- Commit-Message-Stil an bisherige Messages anpassen (Imperativ, Englisch, prägnant).
- `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` immer anhängen (Modellname an die aktuelle Session anpassen).
- Dateien spezifisch stagen (nie `git add -A` oder `git add .`).

---

## Code-Qualität

### Kommentare
Nur schreiben wenn das **Warum** nicht offensichtlich ist:
- Workarounds für bekannte Browser-Bugs / API-Eigenheiten
- Versteckte Abhängigkeiten zwischen Modulen
- Nicht-intuitive Algorithmen oder Grenzfälle

Niemals schreiben:
- Was der Code tut (das ergibt sich aus sprechenden Namen)
- Referenzen auf den aktuellen Task / Fix / PR

### Abstraktion
Keine vorauseilende Generalisierung. Drei ähnliche Zeilen sind besser als eine
verfrühte Abstraktion. Nur abstrahieren wenn der dritte konkrete Anwendungsfall eintritt.

### Fehlerbehandlung
Nur an System-Grenzen validieren (User-Input, externe APIs). Internem Code und
Framework-Garantien vertrauen.

---

## Bugs außerhalb des Scopes

Entdecke ich während einer Aufgabe einen Bug, der nicht Teil des Auftrags war:
**still beheben**, ohne separate Erwähnung — außer er ist sicherheitsrelevant oder
könnte Datenverlust verursachen.

---

## Absolute Grenzen (Hard Limits)

Diese Aktionen führe ich **niemals** ohne explizite schriftliche Erlaubnis durch:

| Aktion | Grund |
|---|---|
| `git push --force` | Irreversibel, kann Remote-History zerstören |
| Branch löschen (`git branch -D`) | Irreversibel |
| `npm install <paket>` / neue Abhängigkeit | Verändert Projekt-Footprint und Sicherheitsfläche |

---

## Sensible Bereiche

| Bereich | Regel |
|---|---|
| Login-Flow / `requireAuth()` in `app.js` | Änderungen kurz ankündigen (Sicherheitsrelevanz) |

---

## Projektziel

**Demo / Portfolio-Projekt** für ein internes Unternehmens-Showcase.

Prioritäten in dieser Reihenfolge:
1. Visuelles Erscheinungsbild und UX
2. Vollständiger Funktionsumfang der Demo
3. Code-Sauberkeit
4. Performance

Kein echter Produktionsbetrieb geplant — Stabilität und Sicherheit sind relevant,
aber nicht auf Kosten von Optik oder Feature-Vollständigkeit.

---

## Weiterführende Dokumente

- [`claude/architecture.md`](claude/architecture.md) — Tech-Stack, Dateistruktur, Muster
- [`claude/conventions.md`](claude/conventions.md) — Naming, CSS-Konventionen, State-Muster
