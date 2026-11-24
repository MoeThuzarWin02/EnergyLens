
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
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";
import { ROLE_PERMISSIONS } from "../constants/roles";

const correlationRef = collection(
  db,
  COLLECTIONS.CORRELATION_RESULTS
);

// Check permissions
function checkPermission(currentUser, permission) {
  if (!currentUser?.uid || !currentUser?.role) {
    throw new Error("Authenticated user is required.");
  }

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  if (!permissions?.[permission]) {
    throw new Error(
      `You do not have permission to ${permission} correlation results.`
    );
  }
}

// Validate correlation data
function validateCorrelationData(data) {
  if (
    typeof data.variable1 !== "string" ||
    !data.variable1.trim()
  ) {
    throw new Error("First variable is required.");
  }

  if (
    typeof data.variable2 !== "string" ||
    !data.variable2.trim()
  ) {
    throw new Error("Second variable is required.");
  }

  if (data.variable1.trim() === data.variable2.trim()) {
    throw new Error("Please select two different variables.");
  }

  const coefficient = Number(data.correlationCoefficient);

  if (
    data.correlationCoefficient === undefined ||
    data.correlationCoefficient === null ||
    String(data.correlationCoefficient).trim() === "" ||
    !Number.isFinite(coefficient) ||
    coefficient < -1 ||
    coefficient > 1
  ) {
    throw new Error(
      "Correlation coefficient must be between -1 and 1."
    );
  }

  if (
    typeof data.correlationStrength !== "string" ||
    !data.correlationStrength.trim()
  ) {
    throw new Error("Correlation strength is required.");
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

// Prepare correlation data
async function prepareCorrelationData(data) {
  validateCorrelationData(data);

  const facility = await getFacility(data.facilityId);

  if (!facility.name) {
    throw new Error("Facility name is missing.");
  }

  return {
    variable1: data.variable1.trim(),
    variable2: data.variable2.trim(),

    // Preserve decimal representation as a string
    correlationCoefficient: String(
      data.correlationCoefficient
    ),

    correlationStrength: data.correlationStrength.trim(),
    facilityId: data.facilityId,
    facilityName: facility.name,
  };
}

// GET ALL CORRELATION RESULTS FOR A FACILITY
export async function getCorrelationResults(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    correlationRef,
    where("facilityId", "==", facilityId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({
      correlation_id: item.id,
      ...item.data(),
    }))
    .sort((a, b) =>
      a.variable1.localeCompare(b.variable1)
    );
}

// GET CORRELATION RESULT BY ID
export async function getCorrelationResultById(
  correlationId
) {
  if (!correlationId) {
    throw new Error("Correlation ID is required.");
  }

  const correlationDocRef = doc(
    db,
    COLLECTIONS.CORRELATION_RESULTS,
    correlationId
  );

  const snapshot = await getDoc(correlationDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    correlation_id: snapshot.id,
    ...snapshot.data(),
  };
}

// CREATE CORRELATION RESULT
// Manager and Staff
export async function createCorrelationResult(
  data,
  currentUser
) {
  checkPermission(currentUser, "create");

  const correlationData =
    await prepareCorrelationData(data);

  const newCorrelationRef = doc(correlationRef);

  await setDoc(newCorrelationRef, {
    ...correlationData,
    correlation_id: newCorrelationRef.id,
  });

  return newCorrelationRef.id;
}

// UPDATE CORRELATION RESULT
// Manager and Staff
export async function updateCorrelationResult(
  correlationId,
  data,
  currentUser
) {
  checkPermission(currentUser, "update");

  if (!correlationId) {
    throw new Error("Correlation ID is required.");
  }

  const correlationDocRef = doc(
    db,
    COLLECTIONS.CORRELATION_RESULTS,
    correlationId
  );

  const snapshot = await getDoc(correlationDocRef);

  if (!snapshot.exists()) {
    throw new Error("Correlation result not found.");
  }

  const correlationData =
    await prepareCorrelationData(data);

  await updateDoc(
    correlationDocRef,
    correlationData
  );

  return true;
}

// DELETE CORRELATION RESULT
// Manager only
export async function deleteCorrelationResult(
  correlationId,
  currentUser
) {
  checkPermission(currentUser, "delete");

  if (!correlationId) {
    throw new Error("Correlation ID is required.");
  }

  const correlationDocRef = doc(
    db,
    COLLECTIONS.CORRELATION_RESULTS,
    correlationId
  );

  const snapshot = await getDoc(correlationDocRef);

  if (!snapshot.exists()) {
    throw new Error("Correlation result not found.");
  }

  await deleteDoc(correlationDocRef);

  return true;
}
