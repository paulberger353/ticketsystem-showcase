INSERT OR IGNORE INTO users (id, username, role, display_name) VALUES
  (1, 'admin', 'admin',  'Admin'),
  (2, 'karl',  'client', 'Karl KFZ'),
  (3, 'bob',   'client', 'Bob Baumeister'),
  (4, 'beate', 'client', 'Beate Bäcker');

INSERT OR IGNORE INTO tickets (id, user_id, title, platform, status, description) VALUES
  (1, 2, 'Desktop-Werkstattplaner v2',  'Desktop (Windows)',      'Entwicklung',
   'Modernisierung des bestehenden Werkstattplaners für KFZ-Werkstätten. Geplante Features: digitale Terminplanung, Kundenverwaltung, automatische Rechnungsstellung und Lagerverwaltung.'),
  (2, 3, 'Bau-Projektplaner WebApp',    'Web (Browser)',          'Testen',
   'Webbasierte Anwendung zur Verwaltung von Bauprojekten. Funktionen: Bauzeitenplanung, Ressourcenverwaltung, Fortschrittsberichte und zentralisierte Dokumentenablage.'),
  (3, 4, 'Web-Bestellsystem & App',     'Web + Mobile (iOS/Android)', 'Konzept',
   'Online-Bestellsystem für eine Bäckerei mit mobiler App-Komponente. Features: digitaler Produktkatalog, Online-Vorbestellungen, Abholzeitverwaltung und Kundenkonto mit Bestellhistorie.');
