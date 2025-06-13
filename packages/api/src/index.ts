export { default as firebaseService } from "./firebase";
export {
  authHelpers,
  firestoreHelpers,
  userDataHelpers,
  Timestamp,
} from "./firebase";

export { getConfig, getFirebaseConfig, isEmulatorMode } from "./config";

export type { FirebaseConfig, AppConfig } from "./config";

export type { User, UserCredential, Auth } from "firebase/auth";

export type {
  Firestore,
  DocumentData,
  DocumentReference,
  CollectionReference,
  QuerySnapshot,
  DocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";

export async function initializeFirebase(): Promise<void> {
  const { getFirebaseConfig, isEmulatorMode } = await import("./config");
  const { default: firebaseService } = await import("./firebase");

  const config = getFirebaseConfig();
  const useEmulator = isEmulatorMode();

  firebaseService.initialize(config, useEmulator);
}
