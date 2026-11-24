
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

const costRef = collection(db, COLLECTIONS.COST_RECORDS);

// EnergyLens permission policy
const canCreate = (role) =>
  ["manager", "staff"].includes(role);

const canEdit = (role) =>
  ["manager", "staff"].includes(role);

// Validate cost information
function validateCostData(data) {
  if (!data.facility_id) {
    throw new Error("Facility ID is required.");
  }

  if (!data.energy_id) {
    throw new Error("Energy record ID is required.");
  }

  if (!data.record_date) {
    throw new Error("Record date is required.");
  }

  const numericFields = [
    "electricity_cost",
    "cost_per_kwh",
  ];

  for (const field of numericFields) {
    const value = Number(data[field]);

    if (!Number.isFinite(value) || value < 0) {
      throw new Error(
        `${field} must be a valid non-negative number.`
      );
    }
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
    throw new Error("Invalid cost record date.");
  }

  return Timestamp.fromDate(date);
}

// Verify that the linked energy record exists
// and belongs to the same facility
async function validateEnergyRelationship(
  energyId,
  facilityId
) {
  const energyDocRef = doc(
    db,
    COLLECTIONS.ENERGY_RECORDS,
    energyId
  );

  const energySnapshot = await getDoc(energyDocRef);

  if (!energySnapshot.exists()) {
    throw new Error("Linked energy record does not exist.");
  }

  const energyData = energySnapshot.data();

  if (energyData.facility_id !== facilityId) {
    throw new Error(
      "Energy record and cost record must belong to the same facility."
    );
  }
}

// Prepare cost data according to ERD
function prepareCostData(data) {
  validateCostData(data);

  return {
    record_date: convertRecordDate(data.record_date),
    electricity_cost: Number(data.electricity_cost),
    cost_per_kwh: Number(data.cost_per_kwh),
    facility_id: data.facility_id,
    energy_id: data.energy_id,
  };
}

// Get all cost records for a facility
export async function getCostRecords(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    costRef,
    where("facility_id", "==", facilityId),
    orderBy("record_date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    cost_id: item.id,
    ...item.data(),
  }));
}

// Get one cost record by ID
export async function getCostRecordById(costId) {
  if (!costId) {
    throw new Error("Cost record ID is required.");
  }

  const costDocRef = doc(
    db,
    COLLECTIONS.COST_RECORDS,
    costId
  );

  const snapshot = await getDoc(costDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    cost_id: snapshot.id,
    ...snapshot.data(),
  };
}

// Create cost record
// Manager and Staff only
export async function createCostRecord(data, currentUser) {
  if (!canCreate(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can create cost records."
    );
  }

  const costData = prepareCostData(data);

  await validateEnergyRelationship(
    costData.energy_id,
    costData.facility_id
  );

  const result = await addDoc(costRef, {
    ...costData,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return result.id;
}

// Update cost record
// Manager and Staff only
export async function updateCostRecord(
  costId,
  data,
  currentUser
) {
  if (!canEdit(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can edit cost records."
    );
  }

  if (!costId) {
    throw new Error("Cost record ID is required.");
  }

  const costData = prepareCostData(data);

  await validateEnergyRelationship(
    costData.energy_id,
    costData.facility_id
  );

  const costDocRef = doc(
    db,
    COLLECTIONS.COST_RECORDS,
    costId
  );

  await updateDoc(costDocRef, {
    ...costData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// Delete cost record
// Manager only
export async function deleteCostRecord(
  costId,
  currentUser
) {
  if (currentUser?.role !== "manager") {
    throw new Error(
      "Only Managers can delete cost records."
    );
  }

  if (!costId) {
    throw new Error("Cost record ID is required.");
  }

  const costDocRef = doc(
    db,
    COLLECTIONS.COST_RECORDS,
    costId
  );

  await deleteDoc(costDocRef);

  return true;
}
