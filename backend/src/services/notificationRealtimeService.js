const clientsByUserId = new Map();

function writeEvent(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function addNotificationClient(userId, res) {
  const key = userId.toString();
  const clients = clientsByUserId.get(key) || new Set();
  clients.add(res);
  clientsByUserId.set(key, clients);

  writeEvent(res, 'notification:ready', { ok: true });

  return () => {
    clients.delete(res);
    if (clients.size === 0) {
      clientsByUserId.delete(key);
    }
  };
}

function publishNotification(userIds, notification) {
  userIds.forEach((userId) => {
    const clients = clientsByUserId.get(userId.toString());
    if (!clients) return;

    clients.forEach((res) => {
      writeEvent(res, 'notification:new', notification);
    });
  });
}

module.exports = {
  addNotificationClient,
  publishNotification,
};
