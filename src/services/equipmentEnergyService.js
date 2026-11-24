
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

const measurementRef = collection(
  db,
  COLLECTIONS.EQUIPMENT_ENERGY_MEASUREMENTS
);

// EnergyLens permission policy
const canCreate = (role) =>
  ["manager", "staff"].includes(role);

const canEdit = (role) =>
  ["manager", "staff"].includes(role);

// Generate deterministic composite document ID
function getMeasurementId(equipmentId, energyId) {
  return `${encodeURIComponent(equipmentId)}~${encodeURIComponent(energyId)}`;
}

// Validate measurement data
function validateMeasurementData(data) {
  if (!data.equipment_id) {
    throw new Error("Equipment ID is required.");
  }

  if (!data.energy_id) {
    throw new Error("Energy record ID is required.");
  }

  if (!data.timestamp) {
    throw new Error("Measurement timestamp is required.");
  }

  for (const field of ["power_kw", "energy_kwh"]) {
    const value = Number(data[field]);

    if (!Number.isFinite(value) || value < 0) {
      throw new Error(
        `${field} must be a valid non-negative number.`
      );
    }
  }

  if (!data.operating_status?.trim()) {
    throw new Error("Operating status is required.");
  }
}

// Convert date to Firestore Timestamp
function convertTimestamp(value) {
  if (value instanceof Timestamp) {
    return value;
  }

  const date = value instanceof Date
    ? value
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid measurement timestamp.");
  }

  return Timestamp.fromDate(date);
}

// Verify equipment and energy record relationships
async function validateRelationships(equipmentId, energyId) {
  const equipmentRef = doc(
    db,
    COLLECTIONS.EQUIPMENT,
    equipmentId
  );

  const energyRef = doc(
    db,
    COLLECTIONS.ENERGY_RECORDS,
    energyId
  );

  const [equipmentSnapshot, energySnapshot] =
    await Promise.all([
      getDoc(equipmentRef),
      getDoc(energyRef),
    ]);

  if (!equipmentSnapshot.exists()) {
    throw new Error("Equipment record does not exist.");
  }

  if (!energySnapshot.exists()) {
    throw new Error("Energy record does not exist.");
  }

  const equipment = equipmentSnapshot.data();
  const energy = energySnapshot.data();

  if (equipment.facility_id !== energy.facility_id) {
    throw new Error(
      "Equipment and energy record must belong to the same facility."
    );
  }
}

// Prepare measurement data
function prepareMeasurementData(data) {
  validateMeasurementData(data);

  return {
    equipment_id: data.equipment_id,
    energy_id: data.energy_id,
    timestamp: convertTimestamp(data.timestamp),
    power_kw: Number(data.power_kw),
    energy_kwh: Number(data.energy_kwh),
    operating_status: data.operating_status.trim(),
  };
}

// Get measurements for equipment
export async function getMeasurementsByEquipment(equipmentId) {
  if (!equipmentId) {
    throw new Error("Equipment ID is required.");
  }

  const q = query(
    measurementRef,
    where("equipment_id", "==", equipmentId),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    measurement_id: item.id,
    ...item.data(),
  }));
}

// Get measurements for energy record
export async function getMeasurementsByEnergy(energyId) {
  if (!energyId) {
    throw new Error("Energy record ID is required.");
  }

  const q = query(
    measurementRef,
    where("energy_id", "==", energyId),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    measurement_id: item.id,
    ...item.data(),
  }));
}

// Get one measurement using composite key
export async function getEquipmentEnergyMeasurement(
  equipmentId,
  energyId
) {
  const measurementId = getMeasurementId(
    equipmentId,
    energyId
  );

  const measurementDocRef = doc(
    db,
    COLLECTIONS.EQUIPMENT_ENERGY_MEASUREMENTS,
    measurementId
  );

  const snapshot = await getDoc(measurementDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    measurement_id: snapshot.id,
    ...snapshot.data(),
  };
}

// Create measurement
// Manager and Staff only
export async function createEquipmentEnergyMeasurement(
  data,
  currentUser
) {
  if (!canCreate(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can create measurements."
    );
  }

  const measurementData = prepareMeasurementData(data);

  await validateRelationships(
    measurementData.equipment_id,
    measurementData.energy_id
  );

  const measurementId = getMeasurementId(
    measurementData.equipment_id,
    measurementData.energy_id
  );

  const measurementDocRef = doc(
    db,
    COLLECTIONS.EQUIPMENT_ENERGY_MEASUREMENTS,
    measurementId
  );

  // Prevent accidental overwriting of an existing pair
  const existing = await getDoc(measurementDocRef);

  if (existing.exists()) {
    throw new Error(
      "A measurement already exists for this equipment-energy pair."
    );
  }

  await setDoc(measurementDocRef, {
    ...measurementData,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return measurementId;
}

// Update measurement
// Manager and Staff only
export async function updateEquipmentEnergyMeasurement(
  equipmentId,
  energyId,
  data,
  currentUser
) {
  if (!canEdit(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can edit measurements."
    );
  }

  const measurementData = prepareMeasurementData({
    ...data,
    equipment_id: equipmentId,
    energy_id: energyId,
  });

  await validateRelationships(equipmentId, energyId);

  const measurementId = getMeasurementId(
    equipmentId,
    energyId
  );

  const measurementDocRef = doc(
    db,
    COLLECTIONS.EQUIPMENT_ENERGY_MEASUREMENTS,
    measurementId
  );

  await updateDoc(measurementDocRef, {
    ...measurementData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// Delete measurement
// Manager only
export async function deleteEquipmentEnergyMeasurement(
  equipmentId,
  energyId,
  currentUser
) {
  if (currentUser?.role !== "manager") {
    throw new Error(
      "Only Managers can delete measurements."
    );
  }

  const measurementId = getMeasurementId(
    equipmentId,
    energyId
  );

  const measurementDocRef = doc(
    db,
    COLLECTIONS.EQUIPMENT_ENERGY_MEASUREMENTS,
    measurementId
  );

  await deleteDoc(measurementDocRef);

  return true;
}
