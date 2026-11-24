
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

const environmentalRef = collection(
  db,
  COLLECTIONS.ENVIRONMENTAL_RECORDS
);

// EnergyLens permission policy
const canCreate = (role) =>
  ["manager", "staff"].includes(role);

const canEdit = (role) =>
  ["manager", "staff"].includes(role);

// Validate environmental data
function validateEnvironmentalData(data) {
  if (!data.facility_id) {
    throw new Error("Facility ID is required.");
  }

  if (!data.timestamp) {
    throw new Error("Environmental timestamp is required.");
  }

  if (!data.weather_condition?.trim()) {
    throw new Error("Weather condition is required.");
  }

  const numericFields = [
    "temperature",
    "humidity",
    "rainfall",
    "solar_radiation",
  ];

  for (const field of numericFields) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ""
    ) {
      throw new Error(`${field} is required.`);
    }

    if (!Number.isFinite(Number(data[field]))) {
      throw new Error(`${field} must be a valid number.`);
    }
  }

  if (
    Number(data.rainfall) < 0 ||
    Number(data.solar_radiation) < 0
  ) {
    throw new Error(
      "Rainfall and solar radiation cannot be negative."
    );
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
    throw new Error("Invalid environmental timestamp.");
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

// Prepare environmental data using ERD field names
function prepareEnvironmentalData(data) {
  validateEnvironmentalData(data);

  return {
    timestamp: convertTimestamp(data.timestamp),
    temperature: Number(data.temperature),
    humidity: Number(data.humidity),
    weather_condition: data.weather_condition.trim(),
    rainfall: Number(data.rainfall),
    solar_radiation: Number(data.solar_radiation),
    facility_id: data.facility_id,
  };
}

// Get environmental records for a facility
export async function getEnvironmentalRecords(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    environmentalRef,
    where("facility_id", "==", facilityId),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    environmental_id: item.id,
    ...item.data(),
  }));
}

// Get one environmental record
export async function getEnvironmentalRecordById(
  environmentalId
) {
  if (!environmentalId) {
    throw new Error("Environmental record ID is required.");
  }

  const recordDocRef = doc(
    db,
    COLLECTIONS.ENVIRONMENTAL_RECORDS,
    environmentalId
  );

  const snapshot = await getDoc(recordDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    environmental_id: snapshot.id,
    ...snapshot.data(),
  };
}

// Create environmental record
// Manager and Staff only
export async function createEnvironmentalRecord(
  data,
  currentUser
) {
  if (!canCreate(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can create environmental records."
    );
  }

  const environmentalData =
    prepareEnvironmentalData(data);

  await validateFacility(environmentalData.facility_id);

  const result = await addDoc(environmentalRef, {
    ...environmentalData,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return result.id;
}

// Update environmental record
// Manager and Staff only
export async function updateEnvironmentalRecord(
  environmentalId,
  data,
  currentUser
) {
  if (!canEdit(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can edit environmental records."
    );
  }

  if (!environmentalId) {
    throw new Error("Environmental record ID is required.");
  }

  const environmentalData =
    prepareEnvironmentalData(data);

  await validateFacility(environmentalData.facility_id);

  const recordDocRef = doc(
    db,
    COLLECTIONS.ENVIRONMENTAL_RECORDS,
    environmentalId
  );

  await updateDoc(recordDocRef, {
    ...environmentalData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// Delete environmental record
// Manager only
export async function deleteEnvironmentalRecord(
  environmentalId,
  currentUser
) {
  if (currentUser?.role !== "manager") {
    throw new Error(
      "Only Managers can delete environmental records."
    );
  }

  if (!environmentalId) {
    throw new Error("Environmental record ID is required.");
  }

  const recordDocRef = doc(
    db,
    COLLECTIONS.ENVIRONMENTAL_RECORDS,
    environmentalId
  );

  await deleteDoc(recordDocRef);

  return true;
}
