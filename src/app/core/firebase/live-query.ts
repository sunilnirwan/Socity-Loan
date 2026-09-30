import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { DocumentReference, DocumentSnapshot, Query, Unsubscribe, onSnapshot } from 'firebase/firestore';
import { AuthService, LoggedInUser } from '../services/auth.service';

/**
 * Live Firestore listener scoped to the signed-in user.
 * Waits for auth, (re)subscribes when the user/role changes, and clears data on logout.
 */
export function listenAsUser(
  auth: AuthService,
  refFor: (u: LoggedInUser) => Query | DocumentReference,
  onDocs: (docs: DocumentSnapshot[]) => void
): void {
  let unsub: Unsubscribe | null = null;

  combineLatest([auth.getIsAuthReady$(), auth.getCurrentUser$()]).pipe(
    map(([ready, u]) => (ready && u ? u : null)),
    distinctUntilChanged((a, b) => a?.uid === b?.uid && a?.role === b?.role)
  ).subscribe(u => {
    unsub?.();
    unsub = null;
    if (!u) {
      onDocs([]);
      return;
    }
    const ref = refFor(u);
    const onError = (err: unknown) => console.warn('Live listener error:', err);
    unsub = ref instanceof DocumentReference
      ? onSnapshot(ref, s => onDocs(s.exists() ? [s] : []), onError)
      : onSnapshot(ref, s => onDocs(s.docs), onError);
  });
}
