
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { firebaseConfig, auth } from "../firebase/config";
import { db } from "../firebase/firestore";

// Separate Firebase Authentication instance.
// Creating another user will not sign out the Manager.
const secondaryAppName = "EnergyLensAccountCreation";

const secondaryApp =
  getApps().find((app) => app.name === secondaryAppName) ||
  initializeApp(firebaseConfig, secondaryAppName);

const secondaryAuth = getAuth(secondaryApp);

// Generate a random temporary password.
// The user will replace it through the password-reset email.
function generateTemporaryPassword() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Create a managed user account.
export async function createManagedUser(userData) {
  const manager = auth.currentUser;

  if (!manager) {
    throw new Error("Please sign in as a Manager first.");
  }

  const name =
    typeof userData.name === "string"
      ? userData.name.trim()
      : "";

  const email =
    typeof userData.email === "string"
      ? userData.email.trim().toLowerCase()
      : "";

  const role =
    typeof userData.role === "string"
      ? userData.role.trim().toLowerCase()
      : "";

  const allowedRoles = [
    "manager",
    "analyst",
    "staff",
    "stakeholder",
  ];

  if (!name) {
    throw new Error("Full name is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid user role.");
  }

  const temporaryPassword = generateTemporaryPassword();

  let createdUser = null;

  try {
    // Create the account using secondary Authentication.
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      temporaryPassword
    );

    createdUser = credential.user;

    await updateProfile(createdUser, {
      displayName: name,
    });

    // Save the profile using the Manager's authenticated session.
    await setDoc(doc(db, "users", createdUser.uid), {
      uid: createdUser.uid,
      displayName: name,
      email,
      role,
      active: true,
      facilityIds: [],
      createdBy: manager.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

  } catch (error) {
    console.error("Unable to create managed user:", error);

    // Roll back the Authentication account if profile creation fails.
    if (createdUser) {
      try {
        await deleteUser(createdUser);
      } catch (rollbackError) {
        console.error(
          "Unable to roll back new account:",
          rollbackError
        );
      }
    }

    if (error.code === "auth/email-already-in-use") {
      throw new Error(
        "This email address already has an account.",
        { cause: error }
      );
    }

    throw new Error(
      error.message || "Unable to create the user account.",
      { cause: error }
    );

  } finally {
    // Sign out only the secondary Authentication instance.
    if (secondaryAuth.currentUser) {
      await signOut(secondaryAuth).catch((error) => {
        console.error("Secondary sign-out failed:", error);
      });
    }
  }

  // Send password-reset email after successful profile creation.
  try {
    await sendPasswordResetEmail(auth, email);

    return {
      uid: createdUser.uid,
      displayName: name,
      email,
      role,
      emailSent: true,
    };

  } catch (error) {
    console.error("Password-reset email failed:", error);

    return {
      uid: createdUser.uid,
      displayName: name,
      email,
      role,
      emailSent: false,
      emailError: error.message,
    };
  }
}

// Activate or deactivate user.
// Existing implementation retained for now.

export async function setManagedUserStatus(uid, active) {
  const manager = auth.currentUser;

  if (!manager) {
    throw new Error("Please sign in first.");
  }

  if (!uid) {
    throw new Error("User ID is required.");
  }

  if (typeof active !== "boolean") {
    throw new Error("Invalid account status.");
  }

  try {
    await updateDoc(doc(db, "users", uid), {
      active,
      updatedAt: serverTimestamp(),
    });

    return { success: true, active };

  } catch (error) {
    console.error("Unable to update user status:", error);

    throw new Error(
      error.message || "Unable to update user status.",
      { cause: error }
    );
  }
}


// Assign one or multiple facilities to a Staff member or Analyst.
export async function assignUserFacilities(uid, facilityIds) {
  const manager = auth.currentUser;

  if (!manager) {
    throw new Error("Please sign in first.");
  }

  if (!uid || !Array.isArray(facilityIds)) {
    throw new Error("Invalid facility assignment.");
  }

  const uniqueIds = [...new Set(facilityIds)];

  try {
    // Verify the target user exists.
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      throw new Error("User profile not found.");
    }

    const targetUser = userSnapshot.data();

    if (!["staff", "analyst"].includes(targetUser.role)) {
      throw new Error(
        "Facilities can only be assigned to Staff and Analysts."
      );
    }

    // Verify every selected facility exists and is active.
    const facilitySnapshots = await Promise.all(
      uniqueIds.map((facilityId) =>
        getDoc(doc(db, "facilities", facilityId))
      )
    );

    const invalidFacility = facilitySnapshots.some(
      (snapshot) =>
        !snapshot.exists() || snapshot.data().active === false
    );

    if (invalidFacility) {
      throw new Error(
        "One or more selected facilities are unavailable."
      );
    }

    // Save the assignments.
    await updateDoc(userRef, {
      facilityIds: uniqueIds,
      updatedAt: serverTimestamp(),
    });

    return uniqueIds;

  } catch (error) {
    console.error("Unable to assign facilities:", error);

    throw new Error(
      error.message || "Unable to save facility assignments.",
      { cause: error }
    );
  }
}