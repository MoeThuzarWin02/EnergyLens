
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";

export async function getCurrentUserProfile(uid) {
  if (!uid) {
    throw new Error("User UID is required.");
  }

  const userRef = doc(db, COLLECTIONS.USERS, uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    uid: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getUsersByRole(role) {
  const usersRef = collection(db, COLLECTIONS.USERS);

  const usersQuery = query(
    usersRef,
    where("role", "==", role),
    orderBy("displayName", "asc")
  );

  const snapshot = await getDocs(usersQuery);

  return snapshot.docs.map((item) => ({
    uid: item.id,
    ...item.data(),
  }));
}

export async function getActiveUsers() {
  const usersRef = collection(db, COLLECTIONS.USERS);

  const usersQuery = query(
    usersRef,
    where("active", "==", true),
    orderBy("displayName", "asc")
  );

  const snapshot = await getDocs(usersQuery);

  return snapshot.docs.map((item) => ({
    uid: item.id,
    ...item.data(),
  }));
}
