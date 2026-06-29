import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
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
export async function getUserProfile<T>(role: string, uidOrEmail: string): Promise<T | null> {
  const coll = roleCollectionMap[role];
  if (!coll) return null;

  // 1. Try to get doc directly by doc ID
  const docRef = doc(db, coll, uidOrEmail);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as T;
  }

  // 2. Query collection by email field
  const q = query(collection(db, coll), where("email", "==", uidOrEmail.toLowerCase().trim()));
  const qSnap = await getDocs(q);
  if (!qSnap.empty) {
    return qSnap.docs[0].data() as T;
  }

  return null;
}

/** Ensure a profile document exists for the given user and role */
export async function ensureProfileExists(
  role: string,
  uid: string,
  email: string,
  additionalData?: Record<string, any>
): Promise<void> {
  const coll = roleCollectionMap[role] || "aspirantes_demo";
  const docRef = doc(db, coll, uid);
  const snap = await getDoc(docRef);

  const baseData = {
    uid,
    email,
    id: uid,
    name: additionalData?.displayName || additionalData?.name || email.split('@')[0],
    active: true,
    ...additionalData
  };

  if (!snap.exists()) {
    await setDoc(docRef, baseData);
  } else if (additionalData) {
    await updateDoc(docRef, additionalData);
  }
}
