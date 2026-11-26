
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

const scenarioRef = collection(
  db,
  COLLECTIONS.SCENARIO_ANALYSES
);

// Centralized permission checking
function checkPermission(currentUser, permission) {
  if (!currentUser?.uid || !currentUser?.role) {
    throw new Error("Authenticated user is required.");
  }

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  if (!permissions?.[permission]) {
    throw new Error(
      `You do not have permission to ${permission} scenario analyses.`
    );
  }
}

// Validate scenario data
function validateScenarioData(data) {
  if (!data.scenario_name?.trim()) {
    throw new Error("Scenario name is required.");
  }

  if (!data.parameter_changed?.trim()) {
    throw new Error("Changed parameter is required.");
  }

  const parameterValue = data.parameter_value;

  if (
    parameterValue === undefined ||
    parameterValue === null ||
    parameterValue === "" ||
    !(
      typeof parameterValue === "string" ||
      (typeof parameterValue === "number" &&
        Number.isFinite(parameterValue))
    )
  ) {
    throw new Error("Parameter value must be valid text or a number.");
  }

  if (!data.facility_id) {
    throw new Error("Facility ID is required.");
  }

  if (!data.created_date) {
    throw new Error("Scenario creation date is required.");
  }

  const numericFields = [
    "estimated_energy",
    "estimated_cost",
    "estimated_epi",
  ];

  for (const field of numericFields) {
    const value = Number(data[field]);

    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === "" ||
      !Number.isFinite(value)
    ) {
      throw new Error(`${field} must be a valid number.`);
    }
  }

  if (
    Number(data.estimated_energy) < 0 ||
    Number(data.estimated_cost) < 0
  ) {
    throw new Error(
      "Estimated energy and cost cannot be negative."
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
    throw new Error("Invalid scenario creation date.");
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

// Prepare scenario data
function prepareScenarioData(data) {
  validateScenarioData(data);

  return {
    scenario_name: data.scenario_name.trim(),
    parameter_changed: data.parameter_changed.trim(),
    parameter_value: data.parameter_value,
    estimated_energy: Number(data.estimated_energy),
    estimated_cost: Number(data.estimated_cost),
    estimated_epi: Number(data.estimated_epi),
    created_date: convertTimestamp(data.created_date),
    facility_id: data.facility_id,
  };
}

// GET ALL SCENARIOS FOR A FACILITY
export async function getScenarioAnalyses(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    scenarioRef,
    where("facility_id", "==", facilityId),
    orderBy("created_date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    scenario_id: item.id,
    ...item.data(),
  }));
}

// GET SCENARIO BY ID
export async function getScenarioById(scenarioId) {
  if (!scenarioId) {
    throw new Error("Scenario ID is required.");
  }

  const scenarioDocRef = doc(
    db,
    COLLECTIONS.SCENARIO_ANALYSES,
    scenarioId
  );

  const snapshot = await getDoc(scenarioDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    scenario_id: snapshot.id,
    ...snapshot.data(),
  };
}

// CREATE SCENARIO
// Manager and Staff
export async function createScenario(data, currentUser) {
  checkPermission(currentUser, "create");

  const scenarioData = prepareScenarioData(data);

  await validateFacility(scenarioData.facility_id);

  const newScenarioRef = doc(scenarioRef);

  await setDoc(newScenarioRef, {
    ...scenarioData,
    scenario_id: newScenarioRef.id,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return newScenarioRef.id;
}

// UPDATE SCENARIO
// Manager and Staff
export async function updateScenario(
  scenarioId,
  data,
  currentUser
) {
  checkPermission(currentUser, "update");

  if (!scenarioId) {
    throw new Error("Scenario ID is required.");
  }

  const scenarioData = prepareScenarioData(data);

  await validateFacility(scenarioData.facility_id);

  const scenarioDocRef = doc(
    db,
    COLLECTIONS.SCENARIO_ANALYSES,
    scenarioId
  );

  const snapshot = await getDoc(scenarioDocRef);

  if (!snapshot.exists()) {
    throw new Error("Scenario record not found.");
  }

  await updateDoc(scenarioDocRef, {
    ...scenarioData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// DELETE SCENARIO
// Manager only
export async function deleteScenario(
  scenarioId,
  currentUser
) {
  checkPermission(currentUser, "delete");

  if (!scenarioId) {
    throw new Error("Scenario ID is required.");
  }

  const scenarioDocRef = doc(
    db,
    COLLECTIONS.SCENARIO_ANALYSES,
    scenarioId
  );

  const snapshot = await getDoc(scenarioDocRef);

  if (!snapshot.exists()) {
    throw new Error("Scenario record not found.");
  }

  await deleteDoc(scenarioDocRef);

  return true;
}
