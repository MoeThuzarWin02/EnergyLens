
const { onCall, HttpsError } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();

const auth = getAuth();
const db = getFirestore();

const ALLOWED_ROLES = [
  "manager",
  "analyst",
  "staff",
  "stakeholder",
];

// Verify that the caller is an active Manager.
async function verifyManager(request) {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Please sign in first."
    );
  }

  const managerUid = request.auth.uid;

  const managerSnapshot = await db
    .collection("users")
    .doc(managerUid)
    .get();

  if (!managerSnapshot.exists) {
    throw new HttpsError(
      "permission-denied",
      "Manager profile not found."
    );
  }

  const manager = managerSnapshot.data();

  if (
    manager.active !== true ||
    manager.role !== "manager"
  ) {
    throw new HttpsError(
      "permission-denied",
      "Only active Managers can perform this operation."
    );
  }

  return managerUid;
}

// CREATE USER ACCOUNT
exports.createManagedUser = onCall(
  {
    region: "asia-southeast1",
  },
  async (request) => {
    const managerUid = await verifyManager(request);

    const {
      name,
      email,
      role,
    } = request.data || {};

    const normalizedName =
      typeof name === "string" ? name.trim() : "";

    const normalizedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    const normalizedRole =
      typeof role === "string"
        ? role.trim().toLowerCase()
        : "";

    if (!normalizedName) {
      throw new HttpsError(
        "invalid-argument",
        "Full name is required."
      );
    }

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid email address is required."
      );
    }

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid user role."
      );
    }

    let createdUser = null;

    try {
      // Create Firebase Authentication account.
      createdUser = await auth.createUser({
        email: normalizedEmail,
        displayName: normalizedName,
        emailVerified: false,
        disabled: false,
      });

      // Create Firestore profile.
      await db.collection("users").doc(createdUser.uid).set({
        uid: createdUser.uid,
        displayName: normalizedName,
        email: normalizedEmail,
        role: normalizedRole,
        active: true,
        facilityIds: [],
        createdBy: managerUid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        uid: createdUser.uid,
        email: normalizedEmail,
        displayName: normalizedName,
        role: normalizedRole,
      };

    } catch (error) {
      console.error("User creation failed:", error);

      // Roll back Authentication account if profile creation fails.
      if (createdUser) {
        try {
          await auth.deleteUser(createdUser.uid);
        } catch (rollbackError) {
          console.error(
            "Authentication rollback failed:",
            rollbackError
          );
        }
      }

      if (error.code === "auth/email-already-exists") {
        throw new HttpsError(
          "already-exists",
          "This email address already has an account."
        );
      }

      throw new HttpsError(
        "internal",
        "Unable to create user account."
      );
    }
  }
);

// ACTIVATE OR DEACTIVATE USER
exports.setManagedUserStatus = onCall(
  {
    region: "asia-southeast1",
  },
  async (request) => {
    const managerUid = await verifyManager(request);

    const { uid, active } = request.data || {};

    if (
      typeof uid !== "string" ||
      !uid.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Valid user UID is required."
      );
    }

    if (typeof active !== "boolean") {
      throw new HttpsError(
        "invalid-argument",
        "Active status must be true or false."
      );
    }

    if (uid === managerUid && !active) {
      throw new HttpsError(
        "failed-precondition",
        "You cannot deactivate your own Manager account."
      );
    }

    const userRef = db.collection("users").doc(uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      throw new HttpsError(
        "not-found",
        "User profile not found."
      );
    }

    let previousAuthStatus;

    try {
      const authUser = await auth.getUser(uid);
      previousAuthStatus = !authUser.disabled;

      // Synchronize Firebase Authentication first.
      await auth.updateUser(uid, {
        disabled: !active,
      });

      try {
        // Update Firestore profile.
        await userRef.update({
          active,
          updatedAt: FieldValue.serverTimestamp(),
          statusUpdatedBy: managerUid,
        });
      } catch (firestoreError) {
        // Restore previous Authentication status.
        await auth.updateUser(uid, {
          disabled: !previousAuthStatus,
        });

        throw firestoreError;
      }

      return {
        success: true,
        uid,
        active,
        message: active
          ? "User account activated successfully."
          : "User account deactivated successfully.",
      };

    } catch (error) {
      console.error("User status update failed:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      if (error.code === "auth/user-not-found") {
        throw new HttpsError(
          "not-found",
          "Firebase Authentication account not found."
        );
      }

      throw new HttpsError(
        "internal",
        "Unable to update user account status."
      );
    }
  }
);
