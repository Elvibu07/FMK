import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';

/**
 * Hook that reads the current Firebase Auth user's photoURL and displayName,
 * and reacts to changes (e.g. after the user uploads a new avatar).
 */
export function useFirebaseProfile() {
  const [photoURL, setPhotoURL] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    // Read immediately if already signed in
    const user = auth.currentUser;
    if (user) {
      setPhotoURL(user.photoURL || '');
      setDisplayName(user.displayName || '');
    }

    // Also react to future changes (e.g. after avatar upload)
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        setPhotoURL(u.photoURL || '');
        setDisplayName(u.displayName || '');
      }
    });

    return () => unsubscribe();
  }, []);

  return { photoURL, displayName };
}
