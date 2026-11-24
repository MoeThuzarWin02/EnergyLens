
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
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";
import { ROLE_PERMISSIONS } from "../constants/roles";

const analysisRef = collection(
  db,
  COLLECTIONS.EQUIPMENT_ANALYSIS
);

// Centralized permission checking
function checkPermission(currentUser, permission) {
  if (!currentUser?.uid || !currentUser?.role) {
    throw new Error("Authenticated user is required.");
  }

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  if (!permissions?.[permission]) {
    throw new Error(
      `You do not have permission to ${permission} equipment analysis records.`
    );
  }
}

// Validate equipment analysis data
function validateAnalysisData(data) {
  if (!data.facilityId?.trim()) {
    throw new Error("Facility ID is required.");
  }

  const numericFields = [
    "totalEnergyKwh",
    "operatingHours",
    "utilizationRate",
  ];

  for (const field of numericFields) {
    const value = data[field];

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === "" ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0
    ) {
      throw new Error(
        `${field} must be a valid non-negative decimal value.`
      );
    }
  }
}

// Verify facility and retrieve its name
async function getFacility(facilityId) {
  const facilityDocRef = doc(
    db,
    COLLECTIONS.FACILITIES,
    facilityId
  );

  const snapshot = await getDoc(facilityDocRef);

  if (!snapshot.exists()) {
    throw new Error("Selected facility does not exist.");
  }

  const facility = snapshot.data();

  if (!facility.name) {
    throw new Error("Facility name is missing.");
  }

  return facility;
}

// Prepare analysis data
async function prepareAnalysisData(data) {
  validateAnalysisData(data);

  const facility = await getFacility(data.facilityId);

  return {
    totalEnergyKwh: String(data.totalEnergyKwh),
    operatingHours: String(data.operatingHours),
    utilizationRate: String(data.utilizationRate),
    facilityId: data.facilityId,
    facilityName: facility.name,
  };
}

// GET ALL EQUIPMENT ANALYSIS RECORDS FOR A FACILITY
export async function getEquipmentAnalysis(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    analysisRef,
    where("facilityId", "==", facilityId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    analysis_id: item.id,
    ...item.data(),
  }));
}

// GET EQUIPMENT ANALYSIS BY ID
export async function getEquipmentAnalysisById(analysisId) {
  if (!analysisId) {
    throw new Error("Analysis ID is required.");
  }

  const analysisDocRef = doc(
    db,
    COLLECTIONS.EQUIPMENT_ANALYSIS,
    analysisId
  );

  const snapshot = await getDoc(analysisDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    analysis_id: snapshot.id,
    ...snapshot.data(),
  };
}

// CREATE EQUIPMENT ANALYSIS
// Manager and Staff
export async function createEquipmentAnalysis(
  data,
  currentUser
) {
  checkPermission(currentUser, "create");

  const analysisData = await prepareAnalysisData(data);

  const newAnalysisRef = doc(analysisRef);

  await setDoc(newAnalysisRef, {
    ...analysisData,
    analysis_id: newAnalysisRef.id,
    created_by: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newAnalysisRef.id;
}

// UPDATE EQUIPMENT ANALYSIS
// Manager and Staff
export async function updateEquipmentAnalysis(
  analysisId,
  data,
  currentUser
) {
  checkPermission(currentUser, "update");

  if (!analysisId) {
    throw new Error("Analysis ID is required.");
  }

  const analysisData = await prepareAnalysisData(data);

  const analysisDocRef = doc(
    db,
    COLLECTIONS.EQUIPMENT_ANALYSIS,
    analysisId
  );

  const snapshot = await getDoc(analysisDocRef);

  if (!snapshot.exists()) {
    throw new Error("Equipment analysis record not found.");
  }

  await updateDoc(analysisDocRef, {
    ...analysisData,
    updated_by: currentUser.uid,
    updatedAt: serverTimestamp(),
  });

  return true;
}

// DELETE EQUIPMENT ANALYSIS
// Manager only
export async function deleteEquipmentAnalysis(
  analysisId,
  currentUser
) {
  checkPermission(currentUser, "delete");

  if (!analysisId) {
    throw new Error("Analysis ID is required.");
  }

  const analysisDocRef = doc(
    db,
    COLLECTIONS.EQUIPMENT_ANALYSIS,
    analysisId
  );

  const snapshot = await getDoc(analysisDocRef);

  if (!snapshot.exists()) {
    throw new Error("Equipment analysis record not found.");
  }

  await deleteDoc(analysisDocRef);

  return true;
}
