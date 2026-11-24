
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
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";
import { ROLE_PERMISSIONS } from "../constants/roles";

const statisticsRef = collection(
  db,
  COLLECTIONS.CONSUMPTION_STATISTICS
);

// CHECK USER PERMISSIONS
function checkPermission(currentUser, permission) {
  if (!currentUser?.uid || !currentUser?.role) {
    throw new Error("Authenticated user is required.");
  }

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  if (!permissions?.[permission]) {
    throw new Error(
      `You do not have permission to ${permission} consumption statistics.`
    );
  }
}

// VALIDATE STATISTICS DATA
function validateStatisticsData(data) {
  if (
    typeof data.period !== "string" ||
    !data.period.trim()
  ) {
    throw new Error("Reporting period is required.");
  }

  const numericFields = [
    "totalEnergyKwh",
    "averageEnergyKwh",
    "eui",
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

  if (
    typeof data.facilityId !== "string" ||
    !data.facilityId.trim()
  ) {
    throw new Error("Facility ID is required.");
  }
}

// VERIFY FACILITY
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

// PREPARE STATISTICS DATA
async function prepareStatisticsData(data) {
  validateStatisticsData(data);

  const facility = await getFacility(data.facilityId);

  return {
    period: data.period.trim(),
    totalEnergyKwh: String(data.totalEnergyKwh),
    averageEnergyKwh: String(data.averageEnergyKwh),
    eui: String(data.eui),
    facilityId: data.facilityId,
    facilityName: facility.name,
  };
}

// GET ALL STATISTICS FOR A FACILITY
export async function getConsumptionStatistics(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    statisticsRef,
    where("facilityId", "==", facilityId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({
      log_id: item.id,
      ...item.data(),
    }))
    .sort((a, b) =>
      b.period.localeCompare(a.period)
    );
}

// GET STATISTICS BY ID
export async function getConsumptionStatisticsById(logId) {
  if (!logId) {
    throw new Error("Statistics ID is required.");
  }

  const statisticsDocRef = doc(
    db,
    COLLECTIONS.CONSUMPTION_STATISTICS,
    logId
  );

  const snapshot = await getDoc(statisticsDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    log_id: snapshot.id,
    ...snapshot.data(),
  };
}

// CREATE STATISTICS
// Manager and Staff
export async function createConsumptionStatistics(
  data,
  currentUser
) {
  checkPermission(currentUser, "create");

  const statisticsData =
    await prepareStatisticsData(data);

  const newStatisticsRef = doc(statisticsRef);

  await setDoc(newStatisticsRef, {
    ...statisticsData,
    log_id: newStatisticsRef.id,
  });

  return newStatisticsRef.id;
}

// UPDATE STATISTICS
// Manager and Staff
export async function updateConsumptionStatistics(
  logId,
  data,
  currentUser
) {
  checkPermission(currentUser, "update");

  if (!logId) {
    throw new Error("Statistics ID is required.");
  }

  const statisticsDocRef = doc(
    db,
    COLLECTIONS.CONSUMPTION_STATISTICS,
    logId
  );

  const snapshot = await getDoc(statisticsDocRef);

  if (!snapshot.exists()) {
    throw new Error("Consumption statistics not found.");
  }

  const statisticsData =
    await prepareStatisticsData(data);

  await updateDoc(
    statisticsDocRef,
    statisticsData
  );

  return true;
}

// DELETE STATISTICS
// Manager only
export async function deleteConsumptionStatistics(
  logId,
  currentUser
) {
  checkPermission(currentUser, "delete");

  if (!logId) {
    throw new Error("Statistics ID is required.");
  }

  const statisticsDocRef = doc(
    db,
    COLLECTIONS.CONSUMPTION_STATISTICS,
    logId
  );

  const snapshot = await getDoc(statisticsDocRef);

  if (!snapshot.exists()) {
    throw new Error("Consumption statistics not found.");
  }

  await deleteDoc(statisticsDocRef);

  return true;
}
