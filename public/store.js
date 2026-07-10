/* ─── In-memory data store (replaces the old D1-backed API) ────────────────
   Seed data is fetched once per page load and never written back anywhere,
   so a hard refresh always returns to the original demo state. */

const STATUS_ORDER = [
  'Konzept',
  'Entwicklung',
  'Testen',
  'Optimieren',
  'Bereit zu Abnahme',
  'Abgenommen durch Kunden',
];

const Store = (() => {
  let data = null;
  let nextTicketId = 1;
  let nextCommentId = 1;
  let initPromise = null;

  function init() {
    if (!initPromise) {
      initPromise = (async () => {
        const res  = await fetch('data/seed.json');
        const seed = await res.json();
        data = structuredClone(seed);
        nextTicketId  = data.tickets.reduce((max, t) => Math.max(max, t.id), 0) + 1;
        nextCommentId = data.tickets
          .flatMap(t => t.comments)
          .reduce((max, c) => Math.max(max, c.id), 0) + 1;
      })();
    }
    return initPromise;
  }

  function findUserByUsername(username) {
    return data.users.find(u => u.username === username);
  }

  function getClientUsers() {
    return data.users.filter(u => u.role === 'client');
  }

  function withOwner(t) {
    const owner = data.users.find(u => u.id === t.user_id);
    return { ...t, owner_name: owner ? owner.display_name : '' };
  }

  function getTickets(user) {
    const own = user.role === 'admin' ? data.tickets : data.tickets.filter(t => t.user_id === user.id);
    return own.map(withOwner).sort((a, b) => b.id - a.id);
  }

  function getTicket(id) {
    const t = data.tickets.find(t => t.id === id);
    return t ? withOwner(t) : null;
  }

  function createTicket({ title, user_id, status, platform, description }) {
    const ticket = {
      id: nextTicketId++,
      user_id,
      title,
      platform: platform || '',
      status: status || STATUS_ORDER[0],
      description: description || '',
      created_at: new Date().toISOString(),
      comments: [],
    };
    data.tickets.unshift(ticket);
    return withOwner(ticket);
  }

  function updateTicket(id, patch) {
    const ticket = data.tickets.find(t => t.id === id);
    if (!ticket) return null;
    Object.assign(ticket, patch);
    return withOwner(ticket);
  }

  function deleteTicket(id) {
    data.tickets = data.tickets.filter(t => t.id !== id);
  }

  function addComment(ticketId, { user_id, username, text }) {
    const ticket = data.tickets.find(t => t.id === ticketId);
    if (!ticket) return null;
    const comment = {
      id: nextCommentId++,
      user_id,
      username,
      text,
      created_at: new Date().toISOString(),
    };
    ticket.comments.push(comment);
    return comment;
  }

  function deleteComment(ticketId, commentId) {
    const ticket = data.tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    ticket.comments = ticket.comments.filter(c => c.id !== commentId);
  }

  return {
    init,
    findUserByUsername,
    getClientUsers,
    getTickets,
    getTicket,
    createTicket,
    updateTicket,
    deleteTicket,
    addComment,
    deleteComment,
  };
})();
