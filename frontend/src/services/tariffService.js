
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

const tariffRef = collection(
  db,
  COLLECTIONS.TARIFFS
);

// EnergyLens permission policy
const canCreate = (role) =>
  ["manager", "staff"].includes(role);

const canEdit = (role) =>
  ["manager", "staff"].includes(role);

// Validate tariff data
function validateTariffData(data) {
  if (!data.facility_id) {
    throw new Error("Facility ID is required.");
  }

  if (!data.effective_date) {
    throw new Error("Effective date is required.");
  }

  if (!data.tariff_type?.trim()) {
    throw new Error("Tariff type is required.");
  }

  if (typeof data.description !== "string") {
    throw new Error("Description must be text.");
  }

  const numericFields = [
    "rate_per_kwh",
    "peak_rate",
    "off_peak_rate",
    "demand_charge",
  ];

  for (const field of numericFields) {
    const value = Number(data[field]);

    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === "" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new Error(
        `${field} must be a valid non-negative number.`
      );
    }
  }
}

// Convert date to Firestore Timestamp
function convertEffectiveDate(value) {
  if (value instanceof Timestamp) {
    return value;
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid tariff effective date.");
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

// Prepare tariff data
function prepareTariffData(data) {
  validateTariffData(data);

  return {
    effective_date: convertEffectiveDate(
      data.effective_date
    ),
    tariff_type: data.tariff_type.trim(),
    rate_per_kwh: Number(data.rate_per_kwh),
    peak_rate: Number(data.peak_rate),
    off_peak_rate: Number(data.off_peak_rate),
    demand_charge: Number(data.demand_charge),
    description: data.description.trim(),
    facility_id: data.facility_id,
  };
}

// Get all tariffs for a facility
export async function getTariffs(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    tariffRef,
    where("facility_id", "==", facilityId),
    orderBy("effective_date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    tariff_id: item.id,
    ...item.data(),
  }));
}

// Get one tariff
export async function getTariffById(tariffId) {
  if (!tariffId) {
    throw new Error("Tariff ID is required.");
  }

  const tariffDocRef = doc(
    db,
    COLLECTIONS.TARIFFS,
    tariffId
  );

  const snapshot = await getDoc(tariffDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    tariff_id: snapshot.id,
    ...snapshot.data(),
  };
}

// Create tariff
// Manager and Staff only
export async function createTariff(data, currentUser) {
  if (!canCreate(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can create tariffs."
    );
  }

  const tariffData = prepareTariffData(data);

  await validateFacility(tariffData.facility_id);

  const result = await addDoc(tariffRef, {
    ...tariffData,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return result.id;
}

// Update tariff
// Manager and Staff only
export async function updateTariff(
  tariffId,
  data,
  currentUser
) {
  if (!canEdit(currentUser?.role)) {
    throw new Error(
      "Only Managers and Staff can edit tariffs."
    );
  }

  if (!tariffId) {
    throw new Error("Tariff ID is required.");
  }

  const tariffData = prepareTariffData(data);

  await validateFacility(tariffData.facility_id);

  const tariffDocRef = doc(
    db,
    COLLECTIONS.TARIFFS,
    tariffId
  );

  await updateDoc(tariffDocRef, {
    ...tariffData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// Delete tariff
// Manager only
export async function deleteTariff(
  tariffId,
  currentUser
) {
  if (currentUser?.role !== "manager") {
    throw new Error(
      "Only Managers can delete tariffs."
    );
  }

  if (!tariffId) {
    throw new Error("Tariff ID is required.");
  }

  const tariffDocRef = doc(
    db,
    COLLECTIONS.TARIFFS,
    tariffId
  );

  await deleteDoc(tariffDocRef);

  return true;
}
