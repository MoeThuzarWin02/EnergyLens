
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

const visualizationRef = collection(
  db,
  COLLECTIONS.VISUALIZATION_CONFIGS
);

// Centralized permission checking
function checkPermission(currentUser, permission) {
  if (!currentUser?.uid || !currentUser?.role) {
    throw new Error("Authenticated user is required.");
  }

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  if (!permissions?.[permission]) {
    throw new Error(
      `You do not have permission to ${permission} visualization configurations.`
    );
  }
}

// Validate visualization configuration
function validateVisualizationData(data) {
  const requiredFields = [
    "chart_type",
    "chart_title",
    "x_axis",
    "y_axis",
    "facility_id",
  ];

  for (const field of requiredFields) {
    if (
      typeof data[field] !== "string" ||
      !data[field].trim()
    ) {
      throw new Error(`${field} is required.`);
    }
  }
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

// Prepare visualization data
function prepareVisualizationData(data) {
  validateVisualizationData(data);

  return {
    chart_type: data.chart_type.trim(),
    chart_title: data.chart_title.trim(),
    x_axis: data.x_axis.trim(),
    y_axis: data.y_axis.trim(),
    facility_id: data.facility_id,
  };
}

// GET ALL VISUALIZATION CONFIGURATIONS FOR A FACILITY
export async function getVisualizationConfigs(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    visualizationRef,
    where("facility_id", "==", facilityId),
    orderBy("chart_title", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    viz_id: item.id,
    ...item.data(),
  }));
}

// GET VISUALIZATION CONFIGURATION BY ID
export async function getVisualizationConfigById(vizId) {
  if (!vizId) {
    throw new Error("Visualization ID is required.");
  }

  const visualizationDocRef = doc(
    db,
    COLLECTIONS.VISUALIZATION_CONFIGS,
    vizId
  );

  const snapshot = await getDoc(visualizationDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    viz_id: snapshot.id,
    ...snapshot.data(),
  };
}

// CREATE VISUALIZATION CONFIGURATION
// Manager and Staff
export async function createVisualizationConfig(
  data,
  currentUser
) {
  checkPermission(currentUser, "create");

  const visualizationData =
    prepareVisualizationData(data);

  await validateFacility(visualizationData.facility_id);

  const newVisualizationRef = doc(visualizationRef);

  await setDoc(newVisualizationRef, {
    ...visualizationData,
    viz_id: newVisualizationRef.id,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return newVisualizationRef.id;
}

// UPDATE VISUALIZATION CONFIGURATION
// Manager and Staff
export async function updateVisualizationConfig(
  vizId,
  data,
  currentUser
) {
  checkPermission(currentUser, "update");

  if (!vizId) {
    throw new Error("Visualization ID is required.");
  }

  const visualizationData =
    prepareVisualizationData(data);

  await validateFacility(visualizationData.facility_id);

  const visualizationDocRef = doc(
    db,
    COLLECTIONS.VISUALIZATION_CONFIGS,
    vizId
  );

  const snapshot = await getDoc(visualizationDocRef);

  if (!snapshot.exists()) {
    throw new Error(
      "Visualization configuration not found."
    );
  }

  await updateDoc(visualizationDocRef, {
    ...visualizationData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// DELETE VISUALIZATION CONFIGURATION
// Manager only
export async function deleteVisualizationConfig(
  vizId,
  currentUser
) {
  checkPermission(currentUser, "delete");

  if (!vizId) {
    throw new Error("Visualization ID is required.");
  }

  const visualizationDocRef = doc(
    db,
    COLLECTIONS.VISUALIZATION_CONFIGS,
    vizId
  );

  const snapshot = await getDoc(visualizationDocRef);

  if (!snapshot.exists()) {
    throw new Error(
      "Visualization configuration not found."
    );
  }

  await deleteDoc(visualizationDocRef);

  return true;
}
