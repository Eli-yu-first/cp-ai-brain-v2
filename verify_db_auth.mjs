import { appRouter } from './server/routers.ts';
import { getDb, getUserByOpenId, upsertUser } from './server/db.ts';

async function verifyDb() {
  const db = await getDb();
  if (!db) {
    return { connected: false, reason: 'DATABASE_URL 不可用或连接失败' };
  }

  const openId = `migration-check-${Date.now()}`;
  await upsertUser({
    openId,
    name: 'Migration Check User',
    email: 'migration-check@example.com',
    loginMethod: 'manus',
    role: 'user',
    lastSignedIn: new Date(),
  });

  const user = await getUserByOpenId(openId);
  return {
    connected: true,
    wroteUser: Boolean(user),
    readBackOpenId: user?.openId ?? null,
    readBackRole: user?.role ?? null,
  };
}

async function verifyAuth() {
  const unauthenticatedCtx = {
    user: null,
    req: { protocol: 'https', headers: {} },
    res: { clearCookie() {} },
  };

  const authenticatedCtx = {
    user: {
      id: 999999,
      openId: 'auth-check-user',
      email: 'auth-check@example.com',
      name: 'Auth Check',
      loginMethod: 'manus',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: 'https', headers: {} },
    res: { clearCookie() {} },
  };

  const unauthCaller = appRouter.createCaller(unauthenticatedCtx);
  const authCaller = appRouter.createCaller(authenticatedCtx);

  let unauthError = null;
  try {
    await unauthCaller.platform.snapshot({ timeframe: 'month' });
  } catch (error) {
    unauthError = error?.message ?? String(error);
  }

  const authSnapshot = await authCaller.platform.snapshot({ timeframe: 'month' });

  return {
    unauthRejected: Boolean(unauthError),
    unauthError,
    authSucceeded: Array.isArray(authSnapshot.chainMetrics),
    authMetricCount: authSnapshot.chainMetrics?.length ?? 0,
  };
}

async function main() {
  const db = await verifyDb();
  const auth = await verifyAuth();

  console.log(JSON.stringify({ db, auth }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
