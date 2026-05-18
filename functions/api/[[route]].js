/**
 * Cloudflare Pages Function – catch-all handler für /api/*
 * Routes:
 *   POST   /api/login
 *   GET    /api/users                  (Admin)
 *   GET    /api/tickets
 *   POST   /api/tickets                (Admin)
 *   GET    /api/tickets/:id
 *   PATCH  /api/tickets/:id            (Admin)
 *   DELETE /api/tickets/:id            (Admin)
 *   POST   /api/tickets/:id/comments
 *   DELETE /api/comments/:id           (Admin)
 */
export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;
  const segs = params.route || [];
  const [s0, s1, s2] = segs;

  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-ID',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });

  const getUser = async () => {
    const raw = request.headers.get('X-User-ID');
    if (!raw) return null;
    const id = parseInt(raw, 10);
    if (isNaN(id)) return null;
    return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  };

  const VALID_STATUSES = [
    'Konzept', 'Entwicklung', 'Testen', 'Optimieren',
    'Bereit zu Abnahme', 'Abgenommen durch Kunden',
  ];

  try {

    // ── POST /api/login ──────────────────────────────────────────────────────
    if (s0 === 'login' && !s1 && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const username = (body.username || '').trim();
      if (!username) return json({ error: 'Benutzername erforderlich' }, 400);

      const user = await env.DB
        .prepare('SELECT * FROM users WHERE username = ?')
        .bind(username)
        .first();

      if (!user) return json({ error: 'Benutzer nicht gefunden' }, 404);
      return json({ user });
    }

    // ── GET /api/users (Admin) ───────────────────────────────────────────────
    if (s0 === 'users' && !s1 && method === 'GET') {
      const user = await getUser();
      if (!user) return json({ error: 'Nicht autorisiert' }, 401);
      if (user.role !== 'admin') return json({ error: 'Nur Admins' }, 403);

      const { results } = await env.DB
        .prepare("SELECT id, display_name, username FROM users WHERE role = 'client' ORDER BY display_name")
        .all();
      return json({ users: results });
    }

    // ── GET /api/tickets ─────────────────────────────────────────────────────
    if (s0 === 'tickets' && !s1 && method === 'GET') {
      const user = await getUser();
      if (!user) return json({ error: 'Nicht autorisiert' }, 401);

      const stmt = user.role === 'admin'
        ? env.DB.prepare(`
            SELECT t.*, u.display_name AS owner_name
            FROM tickets t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.id DESC`)
        : env.DB.prepare(`
            SELECT t.*, u.display_name AS owner_name
            FROM tickets t
            JOIN users u ON t.user_id = u.id
            WHERE t.user_id = ?
            ORDER BY t.id DESC`).bind(user.id);

      const { results } = await stmt.all();
      return json({ tickets: results });
    }

    // ── POST /api/tickets (Admin) ────────────────────────────────────────────
    if (s0 === 'tickets' && !s1 && method === 'POST') {
      const user = await getUser();
      if (!user) return json({ error: 'Nicht autorisiert' }, 401);
      if (user.role !== 'admin') return json({ error: 'Nur Admins dürfen Tickets erstellen' }, 403);

      const body = await request.json().catch(() => ({}));
      const title       = (body.title || '').trim();
      const description = (body.description || '').trim();
      const platform    = (body.platform || '').trim();
      const status      = body.status || 'Konzept';
      const userId      = parseInt(body.user_id, 10);

      if (!title) return json({ error: 'Titel ist erforderlich' }, 400);
      if (!userId || isNaN(userId)) return json({ error: 'Benutzer ist erforderlich' }, 400);
      if (!VALID_STATUSES.includes(status)) return json({ error: 'Ungültiger Status' }, 400);

      const result = await env.DB
        .prepare('INSERT INTO tickets (user_id, title, description, platform, status) VALUES (?, ?, ?, ?, ?)')
        .bind(userId, title, description, platform, status)
        .run();

      const ticket = await env.DB
        .prepare('SELECT t.*, u.display_name AS owner_name FROM tickets t JOIN users u ON t.user_id = u.id WHERE t.id = ?')
        .bind(result.meta.last_row_id)
        .first();

      return json({ ticket }, 201);
    }

    // ── GET /api/tickets/:id ─────────────────────────────────────────────────
    if (s0 === 'tickets' && s1 && !s2 && method === 'GET') {
      const user = await getUser();
      if (!user) return json({ error: 'Nicht autorisiert' }, 401);

      const ticket = await env.DB
        .prepare(`
          SELECT t.*, u.display_name AS owner_name
          FROM tickets t
          JOIN users u ON t.user_id = u.id
          WHERE t.id = ?`)
        .bind(parseInt(s1, 10))
        .first();

      if (!ticket) return json({ error: 'Ticket nicht gefunden' }, 404);
      if (user.role === 'client' && ticket.user_id !== user.id) {
        return json({ error: 'Zugriff verweigert' }, 403);
      }

      const { results: comments } = await env.DB
        .prepare('SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC')
        .bind(parseInt(s1, 10))
        .all();

      return json({ ticket, comments });
    }

    // ── PATCH /api/tickets/:id (Admin) ───────────────────────────────────────
    if (s0 === 'tickets' && s1 && !s2 && method === 'PATCH') {
      const user = await getUser();
      if (!user) return json({ error: 'Nicht autorisiert' }, 401);
      if (user.role !== 'admin') return json({ error: 'Nur Admins dürfen bearbeiten' }, 403);

      const ticketId = parseInt(s1, 10);
      const body = await request.json().catch(() => ({}));

      const fields = [];
      const values = [];

      if (body.title !== undefined) {
        const title = body.title.trim();
        if (!title) return json({ error: 'Titel darf nicht leer sein' }, 400);
        fields.push('title = ?');
        values.push(title);
      }
      if (body.description !== undefined) {
        fields.push('description = ?');
        values.push(body.description.trim());
      }
      if (body.platform !== undefined) {
        fields.push('platform = ?');
        values.push(body.platform.trim());
      }
      if (body.status !== undefined) {
        if (!VALID_STATUSES.includes(body.status)) return json({ error: 'Ungültiger Status' }, 400);
        fields.push('status = ?');
        values.push(body.status);
      }

      if (!fields.length) return json({ error: 'Keine Felder zum Aktualisieren' }, 400);

      values.push(ticketId);
      await env.DB
        .prepare(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();

      const ticket = await env.DB
        .prepare('SELECT t.*, u.display_name AS owner_name FROM tickets t JOIN users u ON t.user_id = u.id WHERE t.id = ?')
        .bind(ticketId)
        .first();

      if (!ticket) return json({ error: 'Ticket nicht gefunden' }, 404);
      return json({ ticket });
    }

    // ── DELETE /api/tickets/:id (Admin) ──────────────────────────────────────
    if (s0 === 'tickets' && s1 && !s2 && method === 'DELETE') {
      const user = await getUser();
      if (!user) return json({ error: 'Nicht autorisiert' }, 401);
      if (user.role !== 'admin') return json({ error: 'Nur Admins dürfen löschen' }, 403);

      const ticketId = parseInt(s1, 10);
      await env.DB.prepare('DELETE FROM comments WHERE ticket_id = ?').bind(ticketId).run();
      await env.DB.prepare('DELETE FROM tickets WHERE id = ?').bind(ticketId).run();
      return json({ ok: true, message: 'Ticket gelöscht' });
    }

    // ── POST /api/tickets/:id/comments ───────────────────────────────────────
    if (s0 === 'tickets' && s1 && s2 === 'comments' && method === 'POST') {
      const user = await getUser();
      if (!user) return json({ error: 'Nicht autorisiert' }, 401);

      const ticketId = parseInt(s1, 10);
      const ticket = await env.DB
        .prepare('SELECT * FROM tickets WHERE id = ?')
        .bind(ticketId)
        .first();

      if (!ticket) return json({ error: 'Ticket nicht gefunden' }, 404);
      if (user.role === 'client' && ticket.user_id !== user.id) {
        return json({ error: 'Zugriff verweigert' }, 403);
      }

      const body = await request.json().catch(() => ({}));
      const text = (body.text || '').trim();
      if (!text) return json({ error: 'Kommentartext darf nicht leer sein' }, 400);

      const result = await env.DB
        .prepare('INSERT INTO comments (ticket_id, user_id, username, text) VALUES (?, ?, ?, ?)')
        .bind(ticketId, user.id, user.display_name, text)
        .run();

      const comment = await env.DB
        .prepare('SELECT * FROM comments WHERE id = ?')
        .bind(result.meta.last_row_id)
        .first();

      return json({ comment }, 201);
    }

    // ── DELETE /api/comments/:id (Admin) ─────────────────────────────────────
    if (s0 === 'comments' && s1 && !s2 && method === 'DELETE') {
      const user = await getUser();
      if (!user) return json({ error: 'Nicht autorisiert' }, 401);
      if (user.role !== 'admin') return json({ error: 'Nur Admins dürfen löschen' }, 403);

      await env.DB
        .prepare('DELETE FROM comments WHERE id = ?')
        .bind(parseInt(s1, 10))
        .run();

      return json({ ok: true, message: 'Kommentar gelöscht' });
    }

    return json({ error: 'Route nicht gefunden' }, 404);

  } catch (err) {
    console.error('[API Error]', err);
    return json({ error: 'Interner Serverfehler: ' + err.message }, 500);
  }
}
