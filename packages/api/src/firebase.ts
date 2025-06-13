import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Firebase service class for centralized configuration
class FirebaseService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private firestore: Firestore | null = null;
  private isEmulatorMode: boolean = false;

  /**
   * Initialize Firebase with configuration
   */
  initialize(config: FirebaseConfig, useEmulator: boolean = false): void {
    try {
      // Initialize Firebase app
      this.app = initializeApp(config);
      this.isEmulatorMode = useEmulator;

      // Initialize Auth
      this.auth = getAuth(this.app);
      if (useEmulator && !this.auth.emulatorConfig) {
        connectAuthEmulator(this.auth, "http://localhost:9099");
      }

      // Initialize Firestore
      this.firestore = getFirestore(this.app);
      if (useEmulator) {
        try {
          connectFirestoreEmulator(this.firestore, "localhost", 8080);
        } catch (error) {
          // Emulator already connected, ignore error
          console.log("Firestore emulator already connected");
        }
      }

      console.log(
        `Firebase initialized ${useEmulator ? "with emulator" : "for production"}`
      );
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      throw error;
    }
  }

  /**
   * Get Auth instance
   */
  getAuth(): Auth {
    if (!this.auth) {
      throw new Error(
        "Firebase Auth not initialized. Call initialize() first."
      );
    }
    return this.auth;
  }

  /**
   * Get Firestore instance
   */
  getFirestore(): Firestore {
    if (!this.firestore) {
      throw new Error(
        "Firebase Firestore not initialized. Call initialize() first."
      );
    }
    return this.firestore;
  }

  /**
   * Check if running in emulator mode
   */
  isEmulator(): boolean {
    return this.isEmulatorMode;
  }

  /**
   * Manually enable/disable network for offline testing
   */
  async setNetworkEnabled(enabled: boolean): Promise<void> {
    if (!this.firestore) return;

    try {
      if (enabled) {
        await enableNetwork(this.firestore);
        console.log("Firestore network enabled");
      } else {
        await disableNetwork(this.firestore);
        console.log("Firestore network disabled");
      }
    } catch (error) {
      console.error("Failed to change network state:", error);
    }
  }
}

// Create singleton instance
export const firebaseService = new FirebaseService();

// Authentication helper functions
export const authHelpers = {
  /**
   * Create user with email and password
   */
  async createUser(email: string, password: string) {
    const auth = firebaseService.getAuth();
    return createUserWithEmailAndPassword(auth, email, password);
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const auth = firebaseService.getAuth();
    return signInWithEmailAndPassword(auth, email, password);
  },

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    const auth = firebaseService.getAuth();
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const auth = firebaseService.getAuth();
    return signOut(auth);
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    const auth = firebaseService.getAuth();
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const auth = firebaseService.getAuth();
    return auth.currentUser;
  },
};

// Firestore helper functions with offline-first approach
export const firestoreHelpers = {
  /**
   * Get document reference
   */
  doc(path: string) {
    const db = firebaseService.getFirestore();
    return doc(db, path);
  },

  /**
   * Get collection reference
   */
  collection(path: string) {
    const db = firebaseService.getFirestore();
    return collection(db, path);
  },

  /**
   * Add document to collection
   */
  async addDoc(collectionPath: string, data: any) {
    const db = firebaseService.getFirestore();
    const collectionRef = collection(db, collectionPath);
    return addDoc(collectionRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Update document
   */
  async updateDoc(documentPath: string, data: any) {
    const db = firebaseService.getFirestore();
    const docRef = doc(db, documentPath);
    return updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Delete document (soft delete by setting isActive: false)
   */
  async softDeleteDoc(documentPath: string) {
    const db = firebaseService.getFirestore();
    const docRef = doc(db, documentPath);
    return updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Hard delete document
   */
  async deleteDoc(documentPath: string) {
    const db = firebaseService.getFirestore();
    const docRef = doc(db, documentPath);
    return deleteDoc(docRef);
  },

  /**
   * Get single document
   */
  async getDoc(documentPath: string) {
    const db = firebaseService.getFirestore();
    const docRef = doc(db, documentPath);
    return getDoc(docRef);
  },

  /**
   * Get collection with query
   */
  async getDocs(collectionPath: string, constraints: any[] = []) {
    const db = firebaseService.getFirestore();
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, ...constraints);
    return getDocs(q);
  },

  /**
   * Subscribe to document changes
   */
  onDocSnapshot(documentPath: string, callback: (doc: any) => void) {
    const db = firebaseService.getFirestore();
    const docRef = doc(db, documentPath);
    return onSnapshot(docRef, callback);
  },

  /**
   * Subscribe to collection changes
   */
  onCollectionSnapshot(
    collectionPath: string,
    callback: (docs: any[]) => void,
    constraints: any[] = []
  ) {
    const db = firebaseService.getFirestore();
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, ...constraints);
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  },

  /**
   * Query constraints helpers
   */
  where,
  orderBy,
  limit,
  Timestamp,
};

// User-specific data access helpers
export const userDataHelpers = {
  /**
   * Get user's budget path
   */
  getUserBudgetPath(userId: string, budgetId: string): string {
    return `users/${userId}/budgets/${budgetId}`;
  },

  /**
   * Get user's budget collection path
   */
  getUserBudgetsPath(userId: string): string {
    return `users/${userId}/budgets`;
  },

  /**
   * Get budget's subcollection path
   */
  getBudgetSubcollectionPath(
    userId: string,
    budgetId: string,
    subcollection: string
  ): string {
    return `users/${userId}/budgets/${budgetId}/${subcollection}`;
  },

  /**
   * Create user profile on first sign up
   */
  async createUserProfile(userId: string, profileData: any) {
    return firestoreHelpers.updateDoc(`users/${userId}/profile`, profileData);
  },

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    return firestoreHelpers.getDoc(`users/${userId}/profile`);
  },

  /**
   * Subscribe to user profile changes
   */
  onUserProfileChange(userId: string, callback: (profile: any) => void) {
    return firestoreHelpers.onDocSnapshot(`users/${userId}/profile`, callback);
  },
};

// Export main service and utilities
export default firebaseService;
export { Timestamp } from "firebase/firestore";
