import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

export function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log('[ADMIN] Initializing Firebase Admin');
  console.log('[ADMIN] Project ID present:', !!projectId);
  console.log('[ADMIN] Client email present:', !!clientEmail);
  console.log('[ADMIN] Private key present:', !!privateKey);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Missing Firebase Admin environment variables: ${[
        !projectId && 'FIREBASE_PROJECT_ID',
        !clientEmail && 'FIREBASE_CLIENT_EMAIL',
        !privateKey && 'FIREBASE_PRIVATE_KEY',
      ]
        .filter(Boolean)
        .join(', ')}`
    );
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });

  return app;
}

export function getAdminDb() {
  getAdminApp();
  return getFirestore();
}
