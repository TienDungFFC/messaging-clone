import { redis } from './redis.js';

export const upsert = async function (connectionId, meta) {
  await redis.hSet('presence', connectionId, JSON.stringify({
    meta,
    when: Date.now()
  }));
};

export const remove = async function (connectionId) {
  await redis.hDel('presence', connectionId);
};

export const list = async function () {
  const active = [];
  const dead = [];
  const now = Date.now();
  const presence = await redis.hGetAll('presence');

  for (const connection in presence) {
    const details = JSON.parse(presence[connection]);
    details.connection = connection;

    if (now - details.when > 8000) {
      dead.push(details);
    } else {
      active.push(details);
    }
  }

  if (dead.length) {
    clean(dead);
  }

  return active;
};

const clean = function (toDelete) {
  console.log(`Cleaning ${toDelete.length} expired presences`);
  for (const presence of toDelete) {
    remove(presence.connection);
  }
};

export const isOnline = async function (userId) {
  const presenceList = await list();
  return presenceList.some((entry) => entry.meta.userId === userId);
};
