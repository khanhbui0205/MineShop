/**
 * Resolve the linked Minecraft username for a user document.
 * Legacy accounts may only have portal `username` populated.
 */
function resolveMinecraftUsername(user) {
  if (!user) return '';
  return (user.minecraftUsername || user.username || '').trim();
}

module.exports = { resolveMinecraftUsername };
