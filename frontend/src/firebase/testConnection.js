
import { db, auth, storage } from "./config";
import { collection, getDocs } from "firebase/firestore";

export async function testFirebaseConnection() {
  console.log("Firebase project:", db.app.options.projectId);
  console.log("Authentication initialized:", !!auth);
  console.log("Firestore initialized:", !!db);
  console.log("Storage initialized:", !!storage);

  try {
    await getDocs(collection(db, "facilities"));
    console.log("Firestore connection successful!");
    return true;
  } catch (error) {
    console.error("Firestore test failed:", error.message);
    return false;
  }
}
