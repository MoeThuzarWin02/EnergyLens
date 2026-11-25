
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";

const facilitiesRef = collection(db, COLLECTIONS.FACILITIES);

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
// Existing documents without an active field are treated as active.
export async function getAllFacilities() {
  const q = query(
    facilitiesRef,
    orderBy("facilityName", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => {
      const data = item.data();

      return {
        facilityId: item.id,
        ...data,
        active: data.active !== false,
      };
    })
    .filter((facility) => facility.active);
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

  const data = snapshot.data();

  return {
    facilityId: snapshot.id,
    ...data,
    active: data.active !== false,
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

  if (!facilityId) {
    throw new Error("Facility ID is required.");
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

  if (!facilityId) {
    throw new Error("Facility ID is required.");
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
