export { default as firebaseService } from "./firebase.js";
export {
  authHelpers,
  firestoreHelpers,
  userDataHelpers,
  Timestamp,
} from "./firebase.js";

export { getConfig, getFirebaseConfig, isEmulatorMode } from "./config.js";

export type { FirebaseConfig, AppConfig } from "./config.js";

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

export { budgetOperations } from "./operations/budgets.js";
export { poolOperations } from "./operations/pools.js";
export { channelOperations } from "./operations/channels.js";
export { allocationOperations } from "./operations/allocations.js";
export { transactionOperations } from "./operations/transactions.js";

export async function initializeFirebase(): Promise<void> {
  const { getFirebaseConfig, isEmulatorMode } = await import("./config.js");
  const { default: firebaseService } = await import("./firebase.js");

  const config = getFirebaseConfig();
  const useEmulator = isEmulatorMode();

  firebaseService.initialize(config, useEmulator);
}
