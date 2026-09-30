import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

export const firebaseApp: FirebaseApp = getApps().length === 0
  ? initializeApp(environment.firebase)
  : getApp();

export const firebaseAuth: Auth = getAuth(firebaseApp);
export const firestoreDb: Firestore = getFirestore(firebaseApp);

/** Separate Auth instance so an admin can create members without being signed out. */
const secondaryApp: FirebaseApp = getApps().find(a => a.name === 'secondary')
  ?? initializeApp(environment.firebase, 'secondary');
export const secondaryAuth: Auth = getAuth(secondaryApp);

if (environment.useEmulators) {
  try {
    connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
    connectAuthEmulator(secondaryAuth, 'http://localhost:9099');
    connectFirestoreEmulator(firestoreDb, 'localhost', 8080);
  } catch (e) {
    console.warn('Emulators already connected or error:', e);
  }
}
