
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

const predictionRef = collection(
  db,
  COLLECTIONS.ENERGY_PREDICTIONS
);

// Manager has full control.
// Analyst, Staff and Stakeholder have read access only.
const isManager = (user) =>
  user?.role === "manager";

function validatePredictionData(data) {
  if (!data.facility_id) {
    throw new Error("Facility ID is required.");
  }

  if (!data.prediction_date) {
    throw new Error("Prediction date is required.");
  }

  const predicted = Number(data.predicted_energy_kwh);

  if (!Number.isFinite(predicted) || predicted < 0) {
    throw new Error(
      "Predicted energy must be a non-negative number."
    );
  }

  if (
    data.actual_energy_kwh !== null &&
    data.actual_energy_kwh !== undefined &&
    data.actual_energy_kwh !== ""
  ) {
    const actual = Number(data.actual_energy_kwh);

    if (!Number.isFinite(actual) || actual < 0) {
      throw new Error(
        "Actual energy must be a non-negative number."
      );
    }
  }

  if (
    data.prediction_error !== null &&
    data.prediction_error !== undefined &&
    data.prediction_error !== "" &&
    !Number.isFinite(Number(data.prediction_error))
  ) {
    throw new Error("Prediction error must be a valid number.");
  }
}

function convertTimestamp(value) {
  if (value instanceof Timestamp) {
    return value;
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid prediction date.");
  }

  return Timestamp.fromDate(date);
}

async function validateFacility(facilityId) {
  const facilityRef = doc(
    db,
    COLLECTIONS.FACILITIES,
    facilityId
  );

  const snapshot = await getDoc(facilityRef);

  if (!snapshot.exists()) {
    throw new Error("Facility does not exist.");
  }
}

function preparePredictionData(data) {
  validatePredictionData(data);

  return {
    prediction_date: convertTimestamp(
      data.prediction_date
    ),
    predicted_energy_kwh: Number(
      data.predicted_energy_kwh
    ),
    actual_energy_kwh:
      data.actual_energy_kwh === null ||
      data.actual_energy_kwh === undefined ||
      data.actual_energy_kwh === ""
        ? null
        : Number(data.actual_energy_kwh),
    prediction_error:
      data.prediction_error === null ||
      data.prediction_error === undefined ||
      data.prediction_error === ""
        ? null
        : Number(data.prediction_error),
    facility_id: data.facility_id,
  };
}

// Get predictions for a facility
export async function getPredictions(facilityId) {
  if (!facilityId) {
    throw new Error("Facility ID is required.");
  }

  const q = query(
    predictionRef,
    where("facility_id", "==", facilityId),
    orderBy("prediction_date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    prediction_id: item.id,
    ...item.data(),
  }));
}

// Get one prediction
export async function getPredictionById(predictionId) {
  if (!predictionId) {
    throw new Error("Prediction ID is required.");
  }

  const predictionDocRef = doc(
    db,
    COLLECTIONS.ENERGY_PREDICTIONS,
    predictionId
  );

  const snapshot = await getDoc(predictionDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    prediction_id: snapshot.id,
    ...snapshot.data(),
  };
}

// Create prediction
// Manager only
export async function createPrediction(data, currentUser) {
  if (!isManager(currentUser)) {
    throw new Error(
      "Only Managers can create prediction records."
    );
  }

  const predictionData = preparePredictionData(data);

  await validateFacility(predictionData.facility_id);

  const result = await addDoc(predictionRef, {
    ...predictionData,
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return result.id;
}

// Update prediction
// Manager only
export async function updatePrediction(
  predictionId,
  data,
  currentUser
) {
  if (!isManager(currentUser)) {
    throw new Error(
      "Only Managers can update prediction records."
    );
  }

  if (!predictionId) {
    throw new Error("Prediction ID is required.");
  }

  const predictionData = preparePredictionData(data);

  await validateFacility(predictionData.facility_id);

  const predictionDocRef = doc(
    db,
    COLLECTIONS.ENERGY_PREDICTIONS,
    predictionId
  );

  await updateDoc(predictionDocRef, {
    ...predictionData,
    updated_by: currentUser.uid,
    updated_at: serverTimestamp(),
  });

  return true;
}

// Delete prediction
// Manager only
export async function deletePrediction(
  predictionId,
  currentUser
) {
  if (!isManager(currentUser)) {
    throw new Error(
      "Only Managers can delete prediction records."
    );
  }

  if (!predictionId) {
    throw new Error("Prediction ID is required.");
  }

  const predictionDocRef = doc(
    db,
    COLLECTIONS.ENERGY_PREDICTIONS,
    predictionId
  );

  await deleteDoc(predictionDocRef);

  return true;
}
