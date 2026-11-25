
import { httpsCallable } from "firebase/functions";
import { sendPasswordResetEmail } from "firebase/auth";

import { functions } from "../firebase/functions";
import { auth } from "../firebase/auth";

const createUserFunction = httpsCallable(
  functions,
  "createManagedUser"
);

const updateUserStatusFunction = httpsCallable(
  functions,
  "setManagedUserStatus"
);

// Create user and send password-reset email.
export async function createManagedUser(userData) {
  const email = userData.email.trim().toLowerCase();

  const result = await createUserFunction({
    name: userData.name.trim(),
    email,
    role: userData.role.toLowerCase(),
  });

  try {
    await sendPasswordResetEmail(auth, email);

    return {
      ...result.data,
      emailSent: true,
    };
  } catch (error) {
    console.error("Password-reset email failed:", error);

    return {
      ...result.data,
      emailSent: false,
      emailError: error.message,
    };
  }
}

// Activate or deactivate user.
export async function setManagedUserStatus(uid, active) {
  const result = await updateUserStatusFunction({
    uid,
    active,
  });

  return result.data;
}
