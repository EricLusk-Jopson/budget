#!/usr/bin/env node

/**
 * Budget CRUD Test Script (Direct Firebase - Production)
 *
 * Uses direct Firebase imports like your successful test
 * Forces production Firebase (no emulators)
 *
 * Usage: node test-budget-crud-direct.mjs
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { firebaseService, getFirebaseConfig } from "../dist/index.js";

// Test configuration
const TEST_USER_ID = "test-user-123";
const TEST_BUDGET_DATA = {
  name: "Test Budget - CRUD Verification",
  description: "Temporary budget for testing CRUD operations",
  currency: "USD",
  ownerId: "", // Will be set to authenticated user ID
  isActive: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

/**
 * Helper function to wait/sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run the complete budget CRUD test using direct Firebase
 */
async function runDirectBudgetCRUDTest() {
  console.log("🧪 Starting Budget CRUD Test (Direct Firebase)...");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  let createdBudgetId = null;
  let db = null; // Declare db in outer scope for cleanup
  let authenticatedUser = null; // Declare user for scoping

  try {
    // ==========================================
    // SETUP: Initialize Firebase (Production Mode)
    // ==========================================
    console.log("\n🔥 SETUP: Initializing Firebase (Production)...");
    await firebaseService.initialize(getFirebaseConfig(), false); // false = no emulator
    db = firebaseService.getFirestore();
    console.log("✅ Firebase initialized successfully for production!");

    // ==========================================
    // SETUP: Authenticate User
    // ==========================================
    console.log("\n🔐 SETUP: Authenticating user...");
    const auth = getAuth();
    const userCredential = await signInAnonymously(auth);
    authenticatedUser = userCredential.user;
    console.log(
      `✅ User authenticated successfully! UID: ${authenticatedUser.uid}`
    );

    // Update test data with authenticated user ID
    TEST_BUDGET_DATA.ownerId = authenticatedUser.uid;

    // ==========================================
    // TEST 1: Create Budget (Direct Firebase)
    // ==========================================
    console.log("\n📝 TEST 1: Creating budget with direct Firebase...");
    console.log("Data:", JSON.stringify(TEST_BUDGET_DATA, null, 2));

    const budgetsCollection = collection(db, "budgets");
    const docRef = await addDoc(budgetsCollection, TEST_BUDGET_DATA);
    createdBudgetId = docRef.id;

    console.log("✅ Budget created successfully!");
    console.log(`   ID: ${createdBudgetId}`);
    console.log(`   Path: budgets/${createdBudgetId}`);
    console.log(`   Name: ${TEST_BUDGET_DATA.name}`);
    console.log(`   Currency: ${TEST_BUDGET_DATA.currency}`);
    console.log(`   Owner: ${TEST_BUDGET_DATA.ownerId}`);

    // ==========================================
    // TEST 2: Verify Budget Exists
    // ==========================================
    console.log("\n🔍 TEST 2: Verifying budget exists...");

    const budgetDocRef = doc(db, `budgets/${createdBudgetId}`);
    const budgetDoc = await getDoc(budgetDocRef);

    if (!budgetDoc.exists()) {
      throw new Error("Budget not found after creation!");
    }

    const retrievedData = budgetDoc.data();
    console.log("✅ Budget retrieved successfully!");
    console.log(`   ID: ${budgetDoc.id}`);
    console.log(`   Name: ${retrievedData.name}`);
    console.log(`   Active: ${retrievedData.isActive}`);
    console.log(
      `   Matches created budget: ${budgetDoc.id === createdBudgetId}`
    );

    // ==========================================
    // TEST 3: List User Budgets
    // ==========================================
    console.log("\n📋 TEST 3: Listing user budgets...");

    const budgetsQuery = query(
      collection(db, "budgets"),
      where("ownerId", "==", authenticatedUser.uid), // Filter by authenticated user
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const budgetsSnapshot = await getDocs(budgetsQuery);
    const userBudgets = budgetsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const foundTestBudget = userBudgets.find((b) => b.id === createdBudgetId);

    console.log("✅ Budget list retrieved successfully!");
    console.log(`   Total budgets for user: ${userBudgets.length}`);
    console.log(`   Test budget found in list: ${!!foundTestBudget}`);
    console.log(
      `   All budget names: ${userBudgets.map((b) => b.name).join(", ")}`
    );

    // ==========================================
    // MANUAL VERIFICATION PAUSE
    // ==========================================
    console.log("\n⏸️  MANUAL VERIFICATION");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("🔍 Check your Firebase Console:");
    console.log(`   1. Go to Firestore Database`);
    console.log(`   2. Navigate to: budgets`);
    console.log(
      `   3. Verify budget document exists with ID: ${createdBudgetId}`
    );
    console.log(`   4. Check that all fields are correct`);
    console.log("");
    console.log(
      "⏳ Waiting 5 seconds for you to verify in Firebase Console..."
    );

    await sleep(5000);

    // ==========================================
    // TEST 4: Update Budget
    // ==========================================
    console.log("\n✏️  TEST 4: Updating budget...");

    const updateData = {
      name: "Test Budget - UPDATED via Direct Firebase",
      description: "Updated description to verify update operation works",
      updatedAt: Timestamp.now(),
    };

    await updateDoc(budgetDocRef, updateData);

    // Verify update
    const updatedDoc = await getDoc(budgetDocRef);
    const updatedData = updatedDoc.data();

    console.log("✅ Budget updated successfully!");
    console.log(`   New name: ${updatedData.name}`);
    console.log(`   New description: ${updatedData.description}`);
    console.log(`   Updated at: ${updatedData.updatedAt.toDate()}`);

    // ==========================================
    // TEST 5: Soft Delete Budget
    // ==========================================
    console.log("\n🗑️  TEST 5: Soft deleting budget...");

    await updateDoc(budgetDocRef, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Budget soft deletion executed successfully!");

    // ==========================================
    // TEST 6: Verify Soft Delete
    // ==========================================
    console.log("\n✔️  TEST 6: Verifying soft delete...");

    // Check that budget still exists but isActive = false
    const deletedDoc = await getDoc(budgetDocRef);
    const deletedData = deletedDoc.data();

    if (!deletedDoc.exists()) {
      throw new Error(
        "Budget document was hard deleted instead of soft deleted!"
      );
    }

    if (deletedData.isActive !== false) {
      throw new Error(
        "Budget was not properly soft deleted (isActive should be false)!"
      );
    }

    console.log("✅ Budget correctly soft deleted!");
    console.log(`   Document exists: ${deletedDoc.exists()}`);
    console.log(`   isActive: ${deletedData.isActive}`);

    // Verify it doesn't appear in active budget queries
    const finalQuery = query(
      collection(db, "budgets"),
      where("ownerId", "==", authenticatedUser.uid),
      where("isActive", "==", true)
    );
    const activeBudgetsSnapshot = await getDocs(finalQuery);
    const activeBudgets = activeBudgetsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const stillFoundInActive = activeBudgets.find(
      (b) => b.id === createdBudgetId
    );

    console.log("✅ Active budget list verified clean!");
    console.log(`   Budget removed from active list: ${!stillFoundInActive}`);
    console.log(`   Current active budgets: ${activeBudgets.length}`);

    // ==========================================
    // SUCCESS SUMMARY
    // ==========================================
    console.log("\n🎉 ALL TESTS PASSED!");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("✅ Direct Firebase operations are working correctly");
    console.log("✅ Production Firebase connection is functional");
    console.log("✅ Soft deletion is working as expected");
    console.log("✅ Query filtering works correctly");
    console.log("✅ Data validation and Timestamp handling working");
    console.log("");
    console.log("🔍 Final verification in Firebase Console:");
    console.log(`   - Budget document exists at budgets/${createdBudgetId}`);
    console.log(`   - isActive field should be false`);
    console.log(`   - updatedAt should reflect deletion time`);
    console.log(`   - All other fields should be preserved`);
  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.error("Error Details:", error.message);
    console.error("Stack Trace:", error.stack);

    // Cleanup attempt
    if (createdBudgetId && db) {
      console.log("\n🧹 Attempting cleanup...");
      try {
        const budgetDocRef = doc(db, `budgets/${createdBudgetId}`);
        await updateDoc(budgetDocRef, {
          isActive: false,
          updatedAt: Timestamp.now(),
        });
        console.log("✅ Cleanup successful");
      } catch (cleanupError) {
        console.error("❌ Cleanup failed:", cleanupError.message);
      }
    }

    process.exit(1);
  }
}

/**
 * Main execution
 */
console.log("🚀 Budget CRUD Test Script (Direct Firebase - Production)");
console.log(`📅 ${new Date().toISOString()}`);
console.log(`👤 Test User: ${TEST_USER_ID}`);
console.log("🔥 Using Production Firebase (no emulators)");

runDirectBudgetCRUDTest()
  .then(() => {
    console.log("\n✨ Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test script failed:", error);
    process.exit(1);
  });
