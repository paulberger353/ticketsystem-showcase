CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT    NOT NULL UNIQUE,
  role         TEXT    NOT NULL CHECK(role IN ('client', 'admin')),
  display_name TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  title       TEXT    NOT NULL,
  platform    TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'Konzept'
                CHECK(status IN (
                  'Konzept',
                  'Entwicklung',
                  'Testen',
                  'Optimieren',
                  'Bereit zu Abnahme',
                  'Abgenommen durch Kunden'
                )),
  description TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id  INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  username   TEXT    NOT NULL,
  text       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  FOREIGN KEY (user_id)   REFERENCES users(id)
);
