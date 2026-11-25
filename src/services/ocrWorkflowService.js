
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";

const auditCollection = collection(
  db,
  COLLECTIONS.AUDIT_LOGS
);

/**
 * Create an audit log entry.
 */
export async function createAuditLog({
  userId,
  userRole,
  action,
  entityType,
  entityId,
  details = {},
}) {
  if (!userId || !userRole || !action || !entityType) {
    throw new Error("Required audit information is missing.");
  }

  const auditData = {
    userId,
    userRole,
    action,
    entityType,
    entityId: entityId || null,
    details,
    createdAt: serverTimestamp(),
  };

  const result = await addDoc(
    auditCollection,
    auditData
  );

  return result.id;
}

/**
 * Get recent audit logs.
 * Manager-only application-level check.
 */
export async function getAuditLogs(role, maxResults = 100) {
  if (role !== "manager") {
    throw new Error("Only managers can view audit logs.");
  }

  const auditQuery = query(
    auditCollection,
    orderBy("createdAt", "desc"),
    limit(Math.min(Math.max(maxResults, 1), 200))
  );

  const snapshot = await getDocs(auditQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

/**
 * Get audit logs for a specific user.
 */
export async function getAuditLogsByUser(
  userId,
  role,
  maxResults = 100
) {
  if (role !== "manager") {
    throw new Error("Only managers can view audit logs.");
  }

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const auditQuery = query(
    auditCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(Math.min(Math.max(maxResults, 1), 200))
  );

  const snapshot = await getDocs(auditQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}