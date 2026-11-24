
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

const energyRef = collection(db, COLLECTIONS.ENERGY_RECORDS);

const canCreate = (role) =>
  ["manager", "staff"].includes(role);

const canEdit = (role) =>
  ["manager", "staff"].includes(role);

// Validate energy record
function validateEnergyData(data) {
  if (!data.facility_id) {
    throw new Error("Facility ID is required.");
  }

  if (!data.record_date) {
    throw new Error("Record date is required.");
  }

  const numericFields = [
    "electricity_consumption_kwh",
    "peak_demand_kw",
    "energy_use_intensity",
  ];

  for (const field of numericFields) {
    const value = Number(data[field]);

    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be a valid non-negative number.`);
    }
  }

  if (data.historical_consumption === undefined ||
      data.historical_consumption === null) {
    throw new Error("Historical consumption is required.");
  }
}

// Convert date input to Firestore Timestamp
function convertRecordDate(value) {
  if (value instanceof Timestamp) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid record date.");
  }

  return Timestamp.fromDate(date);
}

// Prepare fields using the ERD naming convention
function prepareEnergyData(data) {
  validateEnergyData(data);

  return {
    facility_id: data.facility_id,
    record_date: convertRecordDate(data.record_date),
    electricity_consumption_kwh:
      Number(data.electricity_consumption_kwh),
    peak_demand_kw: Number(data.peak_demand_kw),
    energy_use_intensity: Number(data.energy_use_intensity),
    historical_consumption: data.historical_consumption,
  };
}

// Get energy records for one facility
export async function getEnergyRecords(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    energyRef,
    where("facility_id", "==", facilityId),
    orderBy("record_date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    energy_id: item.id,
    ...item.data(),
  }));
}

// Get one energy record
export async function getEnergyRecordById(energyId) {
  if (!energyId) {
    throw new Error("Energy record ID is required.");
  }

  const recordRef = doc(
    db,
    COLLECTIONS.ENERGY_RECORDS,
    energyId
  );

  const snapshot = await getDoc(recordRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    energy_id: snapshot.id,
    ...snapshot.data(),
  };
}

// Create an energy record
// Manager, Analyst and Staff can submit new records
export async function createEnergyRecord(data, currentUser) {
  if (!canCreate(currentUser?.role)) {
    throw new Error("You do not have permission to create energy records.");
  }

  const energyData = prepareEnergyData(data);

  const result = await addDoc(energyRef, {
    ...energyData,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return result.id;
}

// Update an existing energy record
// Only Manager and Analyst can edit records
export async function updateEnergyRecord(
  energyId,
  data,
  currentUser
) {
  if (!canEdit(currentUser?.role)) {
    throw new Error("Only Managers and Staff can edit energy records.");
  }

  if (!energyId) {
    throw new Error("Energy record ID is required.");
  }

  const energyData = prepareEnergyData(data);

  const recordRef = doc(
    db,
    COLLECTIONS.ENERGY_RECORDS,
    energyId
  );

  await updateDoc(recordRef, {
    ...energyData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// Permanently delete an energy record
// Manager only
export async function deleteEnergyRecord(energyId, currentUser) {
  if (currentUser?.role !== "manager") {
    throw new Error("Only Managers can delete energy records.");
  }

  const recordRef = doc(
    db,
    COLLECTIONS.ENERGY_RECORDS,
    energyId
  );

  await deleteDoc(recordRef);

  return true;
}