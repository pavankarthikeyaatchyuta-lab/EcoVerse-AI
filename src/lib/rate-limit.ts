import { createHash } from 'node:crypto';

type RateLimitResult = {
  allowed: boolean;
  retryAfterMs?: number;
  source: 'firestore' | 'memory';
};

type RateLimitOptions = {
  identifier: string;
  scope: string;
  windowMs: number;
};

type FirestoreLike = {
  collection: (name: string) => RateLimitDocumentCollection;
  runTransaction: <T>(fn: (transaction: RateLimitTransaction) => Promise<T>) => Promise<T>;
};

type RateLimitDocumentCollection = {
  doc: (id: string) => RateLimitDocumentReference;
};

type RateLimitDocumentReference = {
  get: () => Promise<{ exists: boolean; data: () => { lastRequestAt?: number } | undefined }>;
  set: (value: Record<string, unknown>, options?: { merge?: boolean }) => Promise<void>;
};

type RateLimitTransaction = {
  get: (ref: RateLimitDocumentReference) => Promise<{ exists: boolean; data: () => { lastRequestAt?: number } | undefined }>;
  set: (ref: RateLimitDocumentReference, value: Record<string, unknown>, options?: { merge?: boolean }) => void;
};

const memoryRateLimit = new Map<string, number>();
let firestoreDbPromise: Promise<FirestoreLike | null> | null = null;

function getRateLimitKey(identifier: string, scope: string) {
  return `${scope}:${createHash('sha256').update(identifier).digest('hex')}`;
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

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const key = getRateLimitKey(options.identifier, options.scope);
  const now = Date.now();

  try {
    const db = await getFirestoreDb();
    if (db) {
      const docRef = db.collection('rate_limits').doc(key);

      const result = await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(docRef);
        const lastRequestAt = snap.exists ? snap.data()?.lastRequestAt ?? 0 : 0;

        if (lastRequestAt && now - lastRequestAt < options.windowMs) {
          return {
            allowed: false,
            retryAfterMs: options.windowMs - (now - lastRequestAt),
            source: 'firestore' as const,
          };
        }

        transaction.set(
          docRef,
          {
            key,
            scope: options.scope,
            lastRequestAt: now,
            updatedAt: now,
          },
          { merge: true }
        );

        return { allowed: true, source: 'firestore' as const };
      });

      return result;
    }
  } catch (error) {
    console.error('Firestore rate limit fallback:', error);
  }

  const lastRequestAt = memoryRateLimit.get(key);
  if (lastRequestAt && now - lastRequestAt < options.windowMs) {
    return {
      allowed: false,
      retryAfterMs: options.windowMs - (now - lastRequestAt),
      source: 'memory',
    };
  }

  memoryRateLimit.set(key, now);
  return { allowed: true, source: 'memory' };
}
