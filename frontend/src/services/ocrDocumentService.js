
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import { COLLECTIONS } from "../constants/collections";
import { OCR_PERMISSIONS } from "../constants/ocrPermissions";
import { createAuditLog } from "./auditLogService";

const ocrCollection = collection(
  db,
  COLLECTIONS.OCR_DOCUMENTS
);

// CHECK OCR PERMISSIONS
function checkPermission(role, action) {
  const allowed = OCR_PERMISSIONS[role]?.[action];

  if (allowed !== true) {
    throw new Error(
      `Permission denied: ${role} cannot ${action} OCR documents.`
    );
  }
}

// CREATE OCR DOCUMENT
export async function createOCRDocument(data, user) {
  if (!user?.uid || !user?.role) {
    throw new Error("Authenticated user is required.");
  }

  checkPermission(user.role, "upload");

  if (!data?.facilityId || !data?.fileName) {
    throw new Error("Facility ID and file name are required.");
  }

  const documentData = {
    facilityId: data.facilityId,
    facilityName: data.facilityName || "",

    fileName: data.fileName,
    contentType: data.contentType || null,

    // Original file storage is deferred.
    storagePath: null,
    fileStatus: "not_stored",

    uploadedBy: user.uid,

    extractedData: data.extractedData || {},
    correctedData: {},

    extractionMethod: data.extractionMethod || null,
    missingFields: data.missingFields || [],

    reviewRequired: true,
    reviewNotes: "",

    status: "review_required",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const result = await addDoc(
  ocrCollection,
  documentData
);

await createAuditLog({
  userId: user.uid,
  userRole: user.role,
  action: "OCR_UPLOAD",
  entityType: "ocrDocument",
  entityId: result.id,
  details: {
    fileName: data.fileName,
    facilityId: data.facilityId,
  },
});

return result.id;

}

// GET ONE OCR DOCUMENT
export async function getOCRDocument(documentId, role) {
  checkPermission(role, "view");

  const documentRef = doc(
    db,
    COLLECTIONS.OCR_DOCUMENTS,
    documentId
  );

  const snapshot = await getDoc(documentRef);

  if (!snapshot.exists()) {
    throw new Error("OCR document not found.");
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

// GET ALL OCR DOCUMENTS
export async function getOCRDocuments(role) {
  checkPermission(role, "view");

  const documentQuery = query(
    ocrCollection,
    orderBy("createdAt", "desc"),
    limit(100)
  );

  const snapshot = await getDocs(documentQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

// GET DOCUMENTS BY FACILITY
export async function getOCRDocumentsByFacility(
  facilityId,
  role
) {
  checkPermission(role, "view");

  const documentQuery = query(
    ocrCollection,
    where("facilityId", "==", facilityId),
    orderBy("createdAt", "desc"),
    limit(100)
  );

  const snapshot = await getDocs(documentQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

// MARK DOCUMENT AS REVIEWED
// Analysts can review but cannot modify extracted values.
export async function markOCRDocumentReviewed(
  documentId,
  role,
  userId
) {
  checkPermission(role, "review");

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const documentRef = doc(
    db,
    COLLECTIONS.OCR_DOCUMENTS,
    documentId
  );

  const snapshot = await getDoc(documentRef);

  if (!snapshot.exists()) {
    throw new Error("OCR document not found.");
  }

  await updateDoc(documentRef, {
    reviewedBy: userId,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createAuditLog({
  userId,
  userRole: role,
  action: "OCR_REVIEW",
  entityType: "ocrDocument",
  entityId: documentId,
  details: {
    action: "Document reviewed",
  },
  });

  return true;
}

// SAVE OCR CORRECTIONS
// Only Manager and Staff can correct extracted information.
export async function saveOCRCorrections(
  documentId,
  correctedData,
  role,
  userId
) {
  checkPermission(role, "correct");

  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (
    !correctedData ||
    typeof correctedData !== "object" ||
    Array.isArray(correctedData)
  ) {
    throw new Error("Valid corrected data is required.");
  }

  const documentRef = doc(
    db,
    COLLECTIONS.OCR_DOCUMENTS,
    documentId
  );

  const snapshot = await getDoc(documentRef);

  if (!snapshot.exists()) {
    throw new Error("OCR document not found.");
  }

  await updateDoc(documentRef, {
    correctedData,
    correctedBy: userId,
    correctedAt: serverTimestamp(),
    status: "corrected",
    reviewRequired: true,
    updatedAt: serverTimestamp(),
  });

  await createAuditLog({
    userId,
    userRole: role,
    action: "OCR_CORRECTION",
    entityType: "ocrDocument",
    entityId: documentId,
    details: {
        action: "Extracted information corrected",
    },
  });

  return true;
}

// APPROVE OCR DOCUMENT
export async function approveOCRDocument(
  documentId,
  role,
  userId
) {
  checkPermission(role, "approve");

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const documentRef = doc(
    db,
    COLLECTIONS.OCR_DOCUMENTS,
    documentId
  );

  const snapshot = await getDoc(documentRef);

  if (!snapshot.exists()) {
    throw new Error("OCR document not found.");
  }

  const documentData = snapshot.data();

  if (
    !["review_required", "corrected"].includes(
      documentData.status
    )
  ) {
    throw new Error(
      "Document cannot be approved in its current status."
    );
  }

  await updateDoc(documentRef, {
    status: "approved",
    reviewRequired: false,
    approvedBy: userId,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createAuditLog({
    userId,
    userRole: role,
    action: "OCR_APPROVAL",
    entityType: "ocrDocument",
    entityId: documentId,
    details: {
        action: "Document approved",
    },
  });

  return true;
}

// REJECT OCR DOCUMENT
export async function rejectOCRDocument(
  documentId,
  role,
  userId,
  reason
) {
  checkPermission(role, "reject");

  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!reason?.trim()) {
    throw new Error("A rejection reason is required.");
  }

  const documentRef = doc(
    db,
    COLLECTIONS.OCR_DOCUMENTS,
    documentId
  );

  const snapshot = await getDoc(documentRef);

  if (!snapshot.exists()) {
    throw new Error("OCR document not found.");
  }

  await updateDoc(documentRef, {
    status: "rejected",
    reviewRequired: false,
    rejectedBy: userId,
    rejectionReason: reason,
    rejectedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createAuditLog({
    userId,
    userRole: role,
    action: "OCR_REJECTION",
    entityType: "ocrDocument",
    entityId: documentId,
    details: {
        reason,
    },
  });

  return true;
}


// DELETE OCR DOCUMENT METADATA
export async function deleteOCRDocument(
  documentId,
  role,
  userId
) {
  checkPermission(role, "delete");

  if (!userId) {
    throw new Error("User ID is required.");
  }

  const documentRef = doc(
    db,
    COLLECTIONS.OCR_DOCUMENTS,
    documentId
  );

  const snapshot = await getDoc(documentRef);

  if (!snapshot.exists()) {
    throw new Error("OCR document not found.");
  }

  const documentData = snapshot.data();

  await deleteDoc(documentRef);

  await createAuditLog({
    userId,
    userRole: role,
    action: "OCR_DELETION",
    entityType: "ocrDocument",
    entityId: documentId,
    details: {
      fileName: documentData.fileName,
      facilityId: documentData.facilityId,
    },
  });

  return true;
}
