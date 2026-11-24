
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";
import { ROLE_PERMISSIONS } from "../constants/roles";

const processingLogsRef = collection(
  db,
  COLLECTIONS.PROCESSING_LOGS
);

// Check user permissions
function checkPermission(currentUser, permission) {
  if (!currentUser?.uid || !currentUser?.role) {
    throw new Error("Authenticated user is required.");
  }

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  if (!permissions?.[permission]) {
    throw new Error(
      `You do not have permission to ${permission} processing logs.`
    );
  }
}

// Validate processing log information
function validateProcessingLog(data) {
  if (!data.processingDate) {
    throw new Error("Processing date is required.");
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(data.processingDate) ||
    Number.isNaN(Date.parse(`${data.processingDate}T00:00:00Z`))
  ) {
    throw new Error("Processing date must use YYYY-MM-DD format.");
  }

  if (
    !Number.isInteger(data.recordsProcessed) ||
    data.recordsProcessed < 0
  ) {
    throw new Error(
      "Records processed must be a non-negative integer."
    );
  }

  if (
    typeof data.missingValuesHandled !== "string" ||
    !data.missingValuesHandled.trim()
  ) {
    throw new Error(
      "Missing values handled information is required."
    );
  }

  if (
    typeof data.processingStatus !== "string" ||
    !data.processingStatus.trim()
  ) {
    throw new Error("Processing status is required.");
  }

  if (
    typeof data.facilityId !== "string" ||
    !data.facilityId.trim()
  ) {
    throw new Error("Facility ID is required.");
  }
}

// Verify facility exists
async function getFacility(facilityId) {
  const facilityRef = doc(
    db,
    COLLECTIONS.FACILITIES,
    facilityId
  );

  const snapshot = await getDoc(facilityRef);

  if (!snapshot.exists()) {
    throw new Error("Selected facility does not exist.");
  }

  return snapshot.data();
}

// Prepare data
async function prepareProcessingLog(data) {
  validateProcessingLog(data);

  const facility = await getFacility(data.facilityId);

  return {
    processingDate: data.processingDate,
    recordsProcessed: data.recordsProcessed,
    missingValuesHandled: data.missingValuesHandled.trim(),
    processingStatus: data.processingStatus.trim(),
    facilityId: data.facilityId,
    facilityName: facility.name,
  };
}

// GET ALL PROCESSING LOGS FOR A FACILITY
export async function getProcessingLogs(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    processingLogsRef,
    where("facilityId", "==", facilityId),
    orderBy("processingDate", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    log_id: item.id,
    ...item.data(),
  }));
}

// GET PROCESSING LOG BY ID
export async function getProcessingLogById(logId) {
  if (!logId) {
    throw new Error("Processing log ID is required.");
  }

  const logRef = doc(
    db,
    COLLECTIONS.PROCESSING_LOGS,
    logId
  );

  const snapshot = await getDoc(logRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    log_id: snapshot.id,
    ...snapshot.data(),
  };
}

// CREATE PROCESSING LOG
// Manager and Staff
export async function createProcessingLog(data, currentUser) {
  checkPermission(currentUser, "create");

  const logData = await prepareProcessingLog(data);

  const newLogRef = doc(processingLogsRef);

  await setDoc(newLogRef, {
    ...logData,
    log_id: newLogRef.id,
  });

  return newLogRef.id;
}

// UPDATE PROCESSING LOG
// Manager and Staff
export async function updateProcessingLog(
  logId,
  data,
  currentUser
) {
  checkPermission(currentUser, "update");

  if (!logId) {
    throw new Error("Processing log ID is required.");
  }

  const logRef = doc(
    db,
    COLLECTIONS.PROCESSING_LOGS,
    logId
  );

  const snapshot = await getDoc(logRef);

  if (!snapshot.exists()) {
    throw new Error("Processing log not found.");
  }

  const logData = await prepareProcessingLog(data);

  await updateDoc(logRef, logData);

  return true;
}

// DELETE PROCESSING LOG
// Manager only (according to your role permissions)
export async function deleteProcessingLog(
  logId,
  currentUser
) {
  checkPermission(currentUser, "delete");

  if (!logId) {
    throw new Error("Processing log ID is required.");
  }

  const logRef = doc(
    db,
    COLLECTIONS.PROCESSING_LOGS,
    logId
  );

  const snapshot = await getDoc(logRef);

  if (!snapshot.exists()) {
    throw new Error("Processing log not found.");
  }

  await deleteDoc(logRef);

  return true;
}
