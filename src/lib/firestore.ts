import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Mapping of roles to Firestore collection names
const roleCollectionMap: Record<string, string> = {
  aspirante: "aspirantes_demo",
  deportista: "aspirantes_demo",
  admin: "admins",
  tribunal: "tribunales",
  director: "directores",
  juez: "judges",
  arbitro: "arbitros",
  medico: "medicos",
};

/** Retrieve a user profile from the appropriate collection */
export async function getUserProfile<T>(role: string, uid: string): Promise<T | null> {
  const coll = roleCollectionMap[role];
  if (!coll) return null;
  const docRef = doc(db, coll, uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as T) : null;
}

/** Ensure a profile document exists for the given user and role */
export async function ensureProfileExists(role: string, uid: string, email: string): Promise<void> {
  const coll = roleCollectionMap[role];
  if (!coll) return;
  const docRef = doc(db, coll, uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, { uid, email } as any);
  }
}
