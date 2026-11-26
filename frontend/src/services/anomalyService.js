
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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";
import { ROLE_PERMISSIONS } from "../constants/roles";

const anomalyRef = collection(
  db,
  COLLECTIONS.ENERGY_ANOMALIES
);

// Check permissions using the central roles configuration
function checkPermission(currentUser, permission) {
  if (!currentUser?.uid || !currentUser?.role) {
    throw new Error("Authenticated user is required.");
  }

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  if (!permissions?.[permission]) {
    throw new Error(
      `You do not have permission to ${permission} anomaly records.`
    );
  }
}

// Validate anomaly data
function validateAnomalyData(data) {
  if (!data.facility_id) {
    throw new Error("Facility ID is required.");
  }

  if (!data.detection_date) {
    throw new Error("Detection date is required.");
  }

  if (
    data.energy_kwh === undefined ||
    data.energy_kwh === null ||
    data.energy_kwh === "" ||
    !Number.isFinite(Number(data.energy_kwh)) ||
    Number(data.energy_kwh) < 0
  ) {
    throw new Error("Energy consumption must be a valid non-negative number.");
  }

  if (
    data.anomaly_score === undefined ||
    data.anomaly_score === null ||
    data.anomaly_score === "" ||
    !Number.isFinite(Number(data.anomaly_score))
  ) {
    throw new Error("Anomaly score must be a valid number.");
  }

  if (
    typeof data.anomaly_status !== "string" ||
    !data.anomaly_status.trim()
  ) {
    throw new Error("Anomaly status is required.");
  }
}

// Convert date to Firestore Timestamp
function convertTimestamp(value) {
  if (value instanceof Timestamp) {
    return value;
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid detection date.");
  }

  return Timestamp.fromDate(date);
}

// Verify facility exists
async function validateFacility(facilityId) {
  const facilityDocRef = doc(
    db,
    COLLECTIONS.FACILITIES,
    facilityId
  );

  const snapshot = await getDoc(facilityDocRef);

  if (!snapshot.exists()) {
    throw new Error("Selected facility does not exist.");
  }
}

// Prepare anomaly data
function prepareAnomalyData(data) {
  validateAnomalyData(data);

  return {
    detection_date: convertTimestamp(data.detection_date),
    energy_kwh: Number(data.energy_kwh),
    anomaly_score: Number(data.anomaly_score),
    anomaly_status: data.anomaly_status.trim(),
    facility_id: data.facility_id,
  };
}

// GET ALL ANOMALIES FOR A FACILITY
export async function getAnomalies(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    anomalyRef,
    where("facility_id", "==", facilityId),
    orderBy("detection_date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    anomaly_id: item.id,
    ...item.data(),
  }));
}

// GET ANOMALY BY ID
export async function getAnomalyById(anomalyId) {
  if (!anomalyId) {
    throw new Error("Anomaly ID is required.");
  }

  const anomalyDocRef = doc(
    db,
    COLLECTIONS.ENERGY_ANOMALIES,
    anomalyId
  );

  const snapshot = await getDoc(anomalyDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    anomaly_id: snapshot.id,
    ...snapshot.data(),
  };
}

// CREATE ANOMALY
// Manager and Staff
export async function createAnomaly(data, currentUser) {
  checkPermission(currentUser, "create");

  const anomalyData = prepareAnomalyData(data);

  await validateFacility(anomalyData.facility_id);

  const newAnomalyRef = doc(anomalyRef);

  await setDoc(newAnomalyRef, {
    ...anomalyData,
    anomaly_id: newAnomalyRef.id,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return newAnomalyRef.id;
}

// UPDATE ANOMALY
// Manager and Staff
export async function updateAnomaly(
  anomalyId,
  data,
  currentUser
) {
  checkPermission(currentUser, "update");

  if (!anomalyId) {
    throw new Error("Anomaly ID is required.");
  }

  const anomalyData = prepareAnomalyData(data);

  await validateFacility(anomalyData.facility_id);

  const anomalyDocRef = doc(
    db,
    COLLECTIONS.ENERGY_ANOMALIES,
    anomalyId
  );

  const snapshot = await getDoc(anomalyDocRef);

  if (!snapshot.exists()) {
    throw new Error("Anomaly record not found.");
  }

  await updateDoc(anomalyDocRef, {
    ...anomalyData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// UPDATE ANOMALY STATUS ONLY
export async function updateAnomalyStatus(
  anomalyId,
  newStatus,
  currentUser
) {
  checkPermission(currentUser, "update");

  if (!anomalyId || !newStatus?.trim()) {
    throw new Error("Anomaly ID and status are required.");
  }

  const anomalyDocRef = doc(
    db,
    COLLECTIONS.ENERGY_ANOMALIES,
    anomalyId
  );

  const snapshot = await getDoc(anomalyDocRef);

  if (!snapshot.exists()) {
    throw new Error("Anomaly record not found.");
  }

  await updateDoc(anomalyDocRef, {
    anomaly_status: newStatus.trim(),
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// DELETE ANOMALY
// Manager only
export async function deleteAnomaly(
  anomalyId,
  currentUser
) {
  checkPermission(currentUser, "delete");

  if (!anomalyId) {
    throw new Error("Anomaly ID is required.");
  }

  const anomalyDocRef = doc(
    db,
    COLLECTIONS.ENERGY_ANOMALIES,
    anomalyId
  );

  const snapshot = await getDoc(anomalyDocRef);

  if (!snapshot.exists()) {
    throw new Error("Anomaly record not found.");
  }

  await deleteDoc(anomalyDocRef);

  return true;
}
