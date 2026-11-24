
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
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";

const equipmentRef = collection(
  db,
  COLLECTIONS.EQUIPMENT
);

// EnergyLens permission policy
const canCreate = (role) =>
  ["manager", "staff"].includes(role);

const canEdit = (role) =>
  ["manager", "staff"].includes(role);

// Validate equipment data
function validateEquipmentData(data) {
  if (!data.equipment_name?.trim()) {
    throw new Error("Equipment name is required.");
  }

  if (!data.equipment_type?.trim()) {
    throw new Error("Equipment type is required.");
  }

  if (!data.facility_id) {
    throw new Error("Facility ID is required.");
  }

  const efficiency = Number(data.equipment_efficiency);
  const age = Number(data.equipment_age);

  if (!Number.isFinite(efficiency) || efficiency < 0) {
    throw new Error(
      "Equipment efficiency must be a non-negative number."
    );
  }

  if (!Number.isFinite(age) || age < 0) {
    throw new Error(
      "Equipment age must be a non-negative number."
    );
  }
}

// Verify that the facility exists
async function validateFacility(facilityId) {
  const facilityRef = doc(
    db,
    COLLECTIONS.FACILITIES,
    facilityId
  );

  const snapshot = await getDoc(facilityRef);

  if (!snapshot.exists()) {
    throw new Error("Selected facility does not exist.");
  }
}

// Prepare equipment data
function prepareEquipmentData(data) {
  validateEquipmentData(data);

  return {
    equipment_name: data.equipment_name.trim(),
    equipment_type: data.equipment_type.trim(),
    equipment_efficiency: Number(data.equipment_efficiency),
    equipment_age: Number(data.equipment_age),
    facility_id: data.facility_id,
  };
}

// Get all equipment for a facility
export async function getEquipmentByFacility(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    equipmentRef,
    where("facility_id", "==", facilityId),
    orderBy("equipment_name", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    equipment_id: item.id,
    ...item.data(),
  }));
}

// Get one equipment record
export async function getEquipmentById(equipmentId) {
  if (!equipmentId) {
    throw new Error("Equipment ID is required.");
  }

  const equipmentDocRef = doc(
    db,
    COLLECTIONS.EQUIPMENT,
    equipmentId
  );

  const snapshot = await getDoc(equipmentDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    equipment_id: snapshot.id,
    ...snapshot.data(),
  };
}

// Create equipment
// Manager and Staff only
export async function createEquipment(data, currentUser) {
  if (!canCreate(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can add equipment."
    );
  }

  const equipmentData = prepareEquipmentData(data);

  await validateFacility(equipmentData.facility_id);

  const result = await addDoc(equipmentRef, {
    ...equipmentData,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return result.id;
}

// Update equipment
// Manager and Staff only
export async function updateEquipment(
  equipmentId,
  data,
  currentUser
) {
  if (!canEdit(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can edit equipment."
    );
  }

  if (!equipmentId) {
    throw new Error("Equipment ID is required.");
  }

  const equipmentData = prepareEquipmentData(data);

  await validateFacility(equipmentData.facility_id);

  const equipmentDocRef = doc(
    db,
    COLLECTIONS.EQUIPMENT,
    equipmentId
  );

  await updateDoc(equipmentDocRef, {
    ...equipmentData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// Delete equipment
// Manager only
export async function deleteEquipment(
  equipmentId,
  currentUser
) {
  if (currentUser?.role !== "manager") {
    throw new Error(
      "Only Managers can delete equipment."
    );
  }

  if (!equipmentId) {
    throw new Error("Equipment ID is required.");
  }

  const equipmentDocRef = doc(
    db,
    COLLECTIONS.EQUIPMENT,
    equipmentId
  );

  await deleteDoc(equipmentDocRef);

  return true;
}
