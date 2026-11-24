
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";

// Reference to facilities collection
const facilitiesRef = collection(
  db,
  COLLECTIONS.FACILITIES
);

// Validate facility information
function validateFacility(data) {
  if (!data.facilityName?.trim()) {
    throw new Error("Facility name is required.");
  }

  if (!data.facilityType?.trim()) {
    throw new Error("Facility type is required.");
  }

  if (!data.location?.trim()) {
    throw new Error("Facility location is required.");
  }

  if (
    !Number.isFinite(Number(data.facilitySize)) ||
    Number(data.facilitySize) <= 0
  ) {
    throw new Error("Facility size must be greater than zero.");
  }
}

// Get all active facilities
export async function getAllFacilities() {
  const q = query(
    facilitiesRef,
    where("active", "==", true),
    orderBy("facilityName", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    facilityId: item.id,
    ...item.data(),
  }));
}

// Get facilities assigned to a user
export async function getUserFacilities(facilityIds = []) {
  if (!Array.isArray(facilityIds)) {
    throw new Error("Facility IDs must be an array.");
  }

  const uniqueIds = [...new Set(facilityIds)];

  const results = await Promise.all(
    uniqueIds.map((id) => getFacilityById(id))
  );

  return results.filter(
    (facility) => facility && facility.active !== false
  );
}

// Get facility by ID
export async function getFacilityById(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const facilityRef = doc(
    db,
    COLLECTIONS.FACILITIES,
    facilityId
  );

  const snapshot = await getDoc(facilityRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    facilityId: snapshot.id,
    ...snapshot.data(),
  };
}

// Create a facility
export async function createFacility(data, currentUser) {
  if (currentUser?.role !== "manager") {
    throw new Error("Only Managers can create facilities.");
  }

  validateFacility(data);

  const facilityData = {
    facilityName: data.facilityName.trim(),
    facilitySize: Number(data.facilitySize),
    facilityType: data.facilityType.trim(),
    location: data.location.trim(),
    active: true,
    createdBy: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const result = await addDoc(
    facilitiesRef,
    facilityData
  );

  return result.id;
}

// Update facility
export async function updateFacility(
  facilityId,
  data,
  currentUser
) {
  if (currentUser?.role !== "manager") {
    throw new Error("Only Managers can update facilities.");
  }

  validateFacility(data);

  const facilityRef = doc(
    db,
    COLLECTIONS.FACILITIES,
    facilityId
  );

  await updateDoc(facilityRef, {
    facilityName: data.facilityName.trim(),
    facilitySize: Number(data.facilitySize),
    facilityType: data.facilityType.trim(),
    location: data.location.trim(),
    updatedAt: serverTimestamp(),
  });

  return true;
}

// Archive facility instead of permanently deleting it
export async function archiveFacility(
  facilityId,
  currentUser
) {
  if (currentUser?.role !== "manager") {
    throw new Error("Only Managers can archive facilities.");
  }

  const facilityRef = doc(
    db,
    COLLECTIONS.FACILITIES,
    facilityId
  );

  await updateDoc(facilityRef, {
    active: false,
    updatedAt: serverTimestamp(),
    archivedBy: currentUser.uid,
  });

  return true;
}