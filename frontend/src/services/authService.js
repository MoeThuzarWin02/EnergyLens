
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "../firebase/auth";
import { getCurrentUserProfile } from "./userService";

export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  try {
    const profile = await getCurrentUserProfile(
      credential.user.uid
    );

    if (!profile || profile.active !== true) {
      await signOut(auth);

      throw new Error(
        "Your account is inactive or has no EnergyLens profile. Contact your Manager."
      );
    }

    return {
      authUser: credential.user,
      profile,
    };
  } catch (error) {
    if (auth.currentUser?.uid === credential.user.uid) {
      await signOut(auth);
    }

    throw error;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

export async function resetUserPassword(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
