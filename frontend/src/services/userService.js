
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
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


// ========================================
// GET ALL USERS (MANAGER ONLY)
// ========================================

export async function getAllUsers() {
  const usersRef = collection(db, COLLECTIONS.USERS);
  const snapshot = await getDocs(usersRef);

  return snapshot.docs.map((item) => ({
    uid: item.id,
    ...item.data(),
  }));
}

// ========================================
// UPDATE USER ACCOUNT
// ========================================

export async function updateUserAccount(uid, changes) {
  if (!uid) {
    throw new Error("User UID is required.");
  }

  const allowedRoles = [
    "manager",
    "analyst",
    "staff",
    "stakeholder",
  ];

  const updates = {};

  if (changes.role !== undefined) {
    const role = changes.role.toLowerCase();

    if (!allowedRoles.includes(role)) {
      throw new Error("Invalid user role.");
    }

    updates.role = role;
  }

  if (changes.active !== undefined) {
    if (typeof changes.active !== "boolean") {
      throw new Error("Active status must be a boolean.");
    }

    updates.active = changes.active;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No valid changes provided.");
  }

  const userRef = doc(db, COLLECTIONS.USERS, uid);

  await updateDoc(userRef, updates);

  return {
    uid,
    ...updates,
  };
}
