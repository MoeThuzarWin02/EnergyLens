
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

const featureRef = collection(
  db,
  COLLECTIONS.FEATURE_IMPORTANCE
);

// Centralized permission checking
function checkPermission(currentUser, permission) {
  if (!currentUser?.uid || !currentUser?.role) {
    throw new Error("Authenticated user is required.");
  }

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  if (!permissions?.[permission]) {
    throw new Error(
      `You do not have permission to ${permission} feature importance records.`
    );
  }
}

// Validate feature importance data
function validateFeatureData(data) {
  if (!data.feature_name?.trim()) {
    throw new Error("Feature name is required.");
  }

  if (
    data.importance_score === undefined ||
    data.importance_score === null ||
    data.importance_score === "" ||
    !Number.isFinite(Number(data.importance_score))
  ) {
    throw new Error(
      "Importance score must be a valid number."
    );
  }

  const rank = Number(data.importance_rank);

  if (!Number.isInteger(rank) || rank < 1) {
    throw new Error(
      "Importance rank must be a positive integer."
    );
  }

  if (!data.facility_id) {
    throw new Error("Facility ID is required.");
  }

  if (!data.analysis_date) {
    throw new Error("Analysis date is required.");
  }
}

// Convert date into Firestore Timestamp
function convertTimestamp(value) {
  if (value instanceof Timestamp) {
    return value;
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid analysis date.");
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

// Prepare feature importance data
function prepareFeatureData(data) {
  validateFeatureData(data);

  return {
    feature_name: data.feature_name.trim(),
    importance_score: Number(data.importance_score),
    importance_rank: Number(data.importance_rank),
    analysis_date: convertTimestamp(data.analysis_date),
    facility_id: data.facility_id,
  };
}

// GET ALL FEATURE IMPORTANCE RECORDS FOR A FACILITY
export async function getFeatureImportance(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    featureRef,
    where("facility_id", "==", facilityId),
    orderBy("analysis_date", "desc"),
    orderBy("importance_rank", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    features_id: item.id,
    ...item.data(),
  }));
}

// GET FEATURE IMPORTANCE BY ID
export async function getFeatureImportanceById(featuresId) {
  if (!featuresId) {
    throw new Error("Feature ID is required.");
  }

  const featureDocRef = doc(
    db,
    COLLECTIONS.FEATURE_IMPORTANCE,
    featuresId
  );

  const snapshot = await getDoc(featureDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    features_id: snapshot.id,
    ...snapshot.data(),
  };
}

// CREATE FEATURE IMPORTANCE RECORD
// Manager and Staff can create.
// Analyst results should be saved through a trusted backend.
export async function createFeatureImportance(data, currentUser) {
  checkPermission(currentUser, "create");

  const featureData = prepareFeatureData(data);

  await validateFacility(featureData.facility_id);

  const newFeatureRef = doc(featureRef);

  await setDoc(newFeatureRef, {
    ...featureData,
    features_id: newFeatureRef.id,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return newFeatureRef.id;
}

// UPDATE FEATURE IMPORTANCE RECORD
// Manager and Staff can update.
export async function updateFeatureImportance(
  featuresId,
  data,
  currentUser
) {
  checkPermission(currentUser, "update");

  if (!featuresId) {
    throw new Error("Feature ID is required.");
  }

  const featureData = prepareFeatureData(data);

  await validateFacility(featureData.facility_id);

  const featureDocRef = doc(
    db,
    COLLECTIONS.FEATURE_IMPORTANCE,
    featuresId
  );

  const snapshot = await getDoc(featureDocRef);

  if (!snapshot.exists()) {
    throw new Error(
      "Feature importance record not found."
    );
  }

  await updateDoc(featureDocRef, {
    ...featureData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// DELETE FEATURE IMPORTANCE RECORD
// Manager only
export async function deleteFeatureImportance(
  featuresId,
  currentUser
) {
  checkPermission(currentUser, "delete");

  if (!featuresId) {
    throw new Error("Feature ID is required.");
  }

  const featureDocRef = doc(
    db,
    COLLECTIONS.FEATURE_IMPORTANCE,
    featuresId
  );

  const snapshot = await getDoc(featureDocRef);

  if (!snapshot.exists()) {
    throw new Error(
      "Feature importance record not found."
    );
  }

  await deleteDoc(featureDocRef);

  return true;
}
