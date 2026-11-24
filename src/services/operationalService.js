
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
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

const operationalRef = collection(
  db,
  COLLECTIONS.OPERATIONAL_RECORDS
);

// EnergyLens permission policy
const canCreate = (role) =>
  ["manager", "staff"].includes(role);

const canEdit = (role) =>
  ["manager", "staff"].includes(role);

// Validate operational data
function validateOperationalData(data) {
  if (!data.facility_id) {
    throw new Error("Facility ID is required.");
  }

  if (!data.record_date) {
    throw new Error("Record date is required.");
  }

  const operatingHours = Number(data.operating_hours);
  const occupancy = Number(data.occupancy);
  const utilizationRate = Number(data.utilization_rate);

  if (
    !Number.isFinite(operatingHours) ||
    operatingHours < 0 ||
    operatingHours > 24
  ) {
    throw new Error(
      "Operating hours must be between 0 and 24."
    );
  }

  if (!Number.isFinite(occupancy) || occupancy < 0) {
    throw new Error(
      "Occupancy must be a non-negative number."
    );
  }

  if (
    !Number.isFinite(utilizationRate) ||
    utilizationRate < 0 ||
    utilizationRate > 100
  ) {
    throw new Error(
      "Utilization rate must be between 0 and 100."
    );
  }
}

// Convert date to Firestore Timestamp
function convertRecordDate(value) {
  if (value instanceof Timestamp) {
    return value;
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid operational record date.");
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

// Prepare data using ERD field names
function prepareOperationalData(data) {
  validateOperationalData(data);

  return {
    record_date: convertRecordDate(data.record_date),
    operating_hours: Number(data.operating_hours),
    occupancy: Number(data.occupancy),
    utilization_rate: Number(data.utilization_rate),
    facility_id: data.facility_id,
  };
}

// Get all operational records for a facility
export async function getOperationalRecords(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    operationalRef,
    where("facility_id", "==", facilityId),
    orderBy("record_date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    operation_id: item.id,
    ...item.data(),
  }));
}

// Get one operational record
export async function getOperationalRecordById(operationId) {
  if (!operationId) {
    throw new Error("Operational record ID is required.");
  }

  const recordDocRef = doc(
    db,
    COLLECTIONS.OPERATIONAL_RECORDS,
    operationId
  );

  const snapshot = await getDoc(recordDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    operation_id: snapshot.id,
    ...snapshot.data(),
  };
}

// Create operational record
// Manager and Staff only
export async function createOperationalRecord(
  data,
  currentUser
) {
  if (!canCreate(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can create operational records."
    );
  }

  const operationalData = prepareOperationalData(data);

  await validateFacility(operationalData.facility_id);

  const result = await addDoc(operationalRef, {
    ...operationalData,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return result.id;
}

// Update operational record
// Manager and Staff only
export async function updateOperationalRecord(
  operationId,
  data,
  currentUser
) {
  if (!canEdit(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can edit operational records."
    );
  }

  if (!operationId) {
    throw new Error("Operational record ID is required.");
  }

  const operationalData = prepareOperationalData(data);

  await validateFacility(operationalData.facility_id);

  const recordDocRef = doc(
    db,
    COLLECTIONS.OPERATIONAL_RECORDS,
    operationId
  );

  await updateDoc(recordDocRef, {
    ...operationalData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// Delete operational record
// Manager only
export async function deleteOperationalRecord(
  operationId,
  currentUser
) {
  if (currentUser?.role !== "manager") {
    throw new Error(
      "Only Managers can delete operational records."
    );
  }

  if (!operationId) {
    throw new Error("Operational record ID is required.");
  }

  const recordDocRef = doc(
    db,
    COLLECTIONS.OPERATIONAL_RECORDS,
    operationId
  );

  await deleteDoc(recordDocRef);

  return true;
}
