import { createHash } from 'node:crypto';

type CachedPayload<T> = {
  payload: T;
  createdAt: number;
};

type FirestoreLike = {
  collection: (name: string) => {
    doc: (id: string) => {
      get: () => Promise<{ exists: boolean; data: () => CachedPayload<unknown> | undefined }>;
      set: (value: CachedPayload<unknown>, options?: { merge?: boolean }) => Promise<void>;
    };
  };
};

const memoryCache = new Map<string, CachedPayload<unknown>>();
let firestoreDbPromise: Promise<FirestoreLike | null> | null = null;

function createCacheKey(keyParts: Array<string | number | boolean | null | undefined>) {
  return createHash('sha256').update(JSON.stringify(keyParts)).digest('hex');
}

async function getFirestoreDb(): Promise<FirestoreLike | null> {
  if (firestoreDbPromise) return firestoreDbPromise;

  firestoreDbPromise = (async () => {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      return null;
    }

    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }

    return getFirestore() as unknown as FirestoreLike;
  })();

  return firestoreDbPromise;
}

export async function getCachedAiPayload<T>(keyParts: Array<string | number | boolean | null | undefined>, ttlMs: number): Promise<T | null> {
  const key = createCacheKey(keyParts);
  const now = Date.now();

  try {
    const db = await getFirestoreDb();
    if (db) {
      const snap = await db.collection('ai_cache').doc(key).get();
      if (snap.exists) {
        const record = snap.data();
        if (record && now - record.createdAt < ttlMs) {
          return record.payload as T;
        }
      }
    }
  } catch (error) {
    console.error('Firestore cache read fallback:', error);
  }

  const memoryRecord = memoryCache.get(key);
  if (memoryRecord && now - memoryRecord.createdAt < ttlMs) {
    return memoryRecord.payload as T;
  }

  return null;
}

export async function setCachedAiPayload<T>(
  keyParts: Array<string | number | boolean | null | undefined>,
  payload: T
): Promise<void> {
  const key = createCacheKey(keyParts);
  const record: CachedPayload<T> = {
    payload,
    createdAt: Date.now(),
  };

  memoryCache.set(key, record);

  try {
    const db = await getFirestoreDb();
    if (db) {
      await db.collection('ai_cache').doc(key).set(record as CachedPayload<unknown>, { merge: true });
    }
  } catch (error) {
    console.error('Firestore cache write fallback:', error);
  }
}
