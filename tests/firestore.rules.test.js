
import { readFileSync } from "node:fs";
import {
  before,
  after,
  beforeEach,
  test,
} from "node:test";


import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";

// Firebase Rules Unit Testing v2 uses
// the Firebase Compat Firestore API.

function doc(db, collectionName, documentId) {
  return db.collection(collectionName).doc(documentId);
}

async function getDoc(reference) {
  return reference.get();
}

async function setDoc(reference, data) {
  return reference.set(data);
}

async function updateDoc(reference, data) {
  return reference.update(data);
}

async function deleteDoc(reference) {
  return reference.delete();
}

const PROJECT_ID = "energylens-20087";

const rules = readFileSync(
  new URL("../firestore.rules", import.meta.url),
  "utf8"
);

let testEnv;

const users = [
  { uid: "manager-1", role: "manager", active: true },
  { uid: "analyst-1", role: "analyst", active: true },
  { uid: "staff-1", role: "staff", active: true },
  { uid: "stakeholder-1", role: "stakeholder", active: true },
  { uid: "inactive-1", role: "staff", active: false },
];

const sampleDocument = {
  facilityId: "facility-001",
  facilityName: "Test Facility",
  fileName: "electricity-bill.pdf",
  contentType: "application/pdf",
  storagePath: null,
  fileStatus: "not_stored",
  uploadedBy: "staff-1",
  extractedData: { consumptionKwh: 1200 },
  correctedData: {},
  extractionMethod: "rule-based-text-extraction",
  missingFields: [],
  reviewRequired: true,
  reviewNotes: "",
  status: "review_required",
};

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    for (const user of users) {
      await setDoc(doc(db, "users", user.uid), {
        displayName: user.role,
        email: `${user.uid}@example.com`,
        role: user.role,
        active: user.active,
      });
    }

    await setDoc(
      doc(db, "ocrDocuments", "test-document"),
      sampleDocument
    );
  });
});

function getUserDb(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

// ========================================
// MANAGER TESTS
// ========================================

test("Manager can view OCR documents", async () => {
  const db = getUserDb("manager-1");

  await assertSucceeds(
    getDoc(doc(db, "ocrDocuments", "test-document"))
  );
});

test("Manager can upload OCR documents", async () => {
  const db = getUserDb("manager-1");

  await assertSucceeds(
    setDoc(doc(db, "ocrDocuments", "manager-document"), {
      ...sampleDocument,
      uploadedBy: "manager-1",
    })
  );
});

test("Manager can delete OCR documents", async () => {
  const db = getUserDb("manager-1");

  await assertSucceeds(
    deleteDoc(doc(db, "ocrDocuments", "test-document"))
  );
});

// ========================================
// ANALYST TESTS
// ========================================

test("Analyst can view OCR documents", async () => {
  const db = getUserDb("analyst-1");

  await assertSucceeds(
    getDoc(doc(db, "ocrDocuments", "test-document"))
  );
});

test("Analyst can mark a document as reviewed", async () => {
  const db = getUserDb("analyst-1");

  await assertSucceeds(
    updateDoc(doc(db, "ocrDocuments", "test-document"), {
      reviewedBy: "analyst-1",
      reviewedAt: "test-time",
      updatedAt: "test-time",
    })
  );
});

test("Analyst cannot correct OCR data", async () => {
  const db = getUserDb("analyst-1");

  await assertFails(
    updateDoc(doc(db, "ocrDocuments", "test-document"), {
      correctedData: { consumptionKwh: 1500 },
      correctedBy: "analyst-1",
      correctedAt: "test-time",
      status: "corrected",
      reviewRequired: true,
      updatedAt: "test-time",
    })
  );
});

test("Analyst cannot approve OCR documents", async () => {
  const db = getUserDb("analyst-1");

  await assertFails(
    updateDoc(doc(db, "ocrDocuments", "test-document"), {
      status: "approved",
      reviewRequired: false,
      approvedBy: "analyst-1",
      approvedAt: "test-time",
      updatedAt: "test-time",
    })
  );
});

test("Analyst cannot upload OCR documents", async () => {
  const db = getUserDb("analyst-1");

  await assertFails(
    setDoc(doc(db, "ocrDocuments", "analyst-document"), {
      ...sampleDocument,
      uploadedBy: "analyst-1",
    })
  );
});

test("Staff can mark an OCR document as reviewed", async () => {
  const db = getUserDb("staff-1");

  await assertSucceeds(
    updateDoc(doc(db, "ocrDocuments", "test-document"), {
      reviewedBy: "staff-1",
      reviewedAt: "test-time",
      updatedAt: "test-time",
    })
  );
});

// ========================================
// STAFF TESTS
// ========================================

test("Staff can view OCR documents", async () => {
  const db = getUserDb("staff-1");

  await assertSucceeds(
    getDoc(doc(db, "ocrDocuments", "test-document"))
  );
});

test("Staff can upload OCR documents", async () => {
  const db = getUserDb("staff-1");

  await assertSucceeds(
    setDoc(doc(db, "ocrDocuments", "staff-document"), {
      ...sampleDocument,
      uploadedBy: "staff-1",
    })
  );
});

test("Staff can correct OCR data", async () => {
  const db = getUserDb("staff-1");

  await assertSucceeds(
    updateDoc(doc(db, "ocrDocuments", "test-document"), {
      correctedData: { consumptionKwh: 1500 },
      correctedBy: "staff-1",
      correctedAt: "test-time",
      status: "corrected",
      reviewRequired: true,
      updatedAt: "test-time",
    })
  );
});

test("Staff can approve OCR documents", async () => {
  const db = getUserDb("staff-1");

  await assertSucceeds(
    updateDoc(doc(db, "ocrDocuments", "test-document"), {
      status: "approved",
      reviewRequired: false,
      approvedBy: "staff-1",
      approvedAt: "test-time",
      updatedAt: "test-time",
    })
  );
});

test("Staff cannot delete OCR documents", async () => {
  const db = getUserDb("staff-1");

  await assertFails(
    deleteDoc(doc(db, "ocrDocuments", "test-document"))
  );
});

// ========================================
// STAKEHOLDER TESTS
// ========================================

test("Stakeholder cannot view OCR documents", async () => {
  const db = getUserDb("stakeholder-1");

  await assertFails(
    getDoc(doc(db, "ocrDocuments", "test-document"))
  );
});

test("Stakeholder cannot upload OCR documents", async () => {
  const db = getUserDb("stakeholder-1");

  await assertFails(
    setDoc(doc(db, "ocrDocuments", "stakeholder-document"), {
      ...sampleDocument,
      uploadedBy: "stakeholder-1",
    })
  );
});

// ========================================
// AUTHENTICATION TESTS
// ========================================

test("Unauthenticated users cannot view OCR documents", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertFails(
    getDoc(doc(db, "ocrDocuments", "test-document"))
  );
});

test("Inactive users cannot view OCR documents", async () => {
  const db = getUserDb("inactive-1");

  await assertFails(
    getDoc(doc(db, "ocrDocuments", "test-document"))
  );
});

test("Inactive users can read their own profile", async () => {
  const db = getUserDb("inactive-1");

  await assertSucceeds(
    getDoc(doc(db, "users", "inactive-1"))
  );
});

// ========================================
// AUDIT LOG TESTS
// ========================================

test("Active Staff can create their own audit log", async () => {
  const db = getUserDb("staff-1");

  await assertSucceeds(
    setDoc(doc(db, "auditLogs", "staff-log"), {
      userId: "staff-1",
      userRole: "staff",
      action: "OCR_UPLOAD",
      entityType: "ocrDocument",
      entityId: "test-document",
    })
  );
});

test("Users cannot modify existing audit logs", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "auditLogs", "existing-log"),
      {
        userId: "staff-1",
        userRole: "staff",
        action: "OCR_UPLOAD",
        entityType: "ocrDocument",
      }
    );
  });

  const db = getUserDb("manager-1");

  await assertFails(
    updateDoc(doc(db, "auditLogs", "existing-log"), {
      action: "MODIFIED",
    })
  );
});
