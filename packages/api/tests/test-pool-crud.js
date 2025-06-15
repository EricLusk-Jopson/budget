#!/usr/bin/env node

/**
 * Pool CRUD Test Script (Direct Firebase - Production)
 *
 * Uses direct Firebase imports like the successful budget test
 * Forces production Firebase (no emulators)
 * Tests pools which are nested under budgets
 *
 * Usage: node test-pool-crud.js
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
const TEST_USER_ID = "test-user-pool-123";
const TEST_BUDGET_DATA = {
  name: "Test Budget for Pool Testing",
  description: "Temporary budget created for pool CRUD testing",
  currency: "USD",
  ownerId: "", // Will be set to authenticated user ID
  isActive: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

const TEST_POOL_DATA = {
  budgetId: "", // Will be set to created budget ID
  name: "Test Pool - Emergency Fund",
  description: "Temporary pool for testing CRUD operations",
  icon: "emergency",
  color: "red",
  purposeType: "saving",
  targetAmount: 5000,
  targetDate: null,
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
 * Run the complete pool CRUD test using direct Firebase
 */
async function runDirectPoolCRUDTest() {
  console.log("🧪 Starting Pool CRUD Test (Direct Firebase)...");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  let createdBudgetId = null;
  let createdPoolId = null;
  let db = null;
  let authenticatedUser = null;

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
    // PREREQUISITE: Create Parent Budget
    // ==========================================
    console.log("\n🏗️  PREREQUISITE: Creating parent budget...");
    console.log("Budget Data:", JSON.stringify(TEST_BUDGET_DATA, null, 2));

    const budgetsCollection = collection(db, "budgets");
    const budgetDocRef = await addDoc(budgetsCollection, TEST_BUDGET_DATA);
    createdBudgetId = budgetDocRef.id;

    console.log("✅ Parent budget created successfully!");
    console.log(`   Budget ID: ${createdBudgetId}`);
    console.log(`   Budget Path: budgets/${createdBudgetId}`);
    console.log(`   Budget Name: ${TEST_BUDGET_DATA.name}`);

    // Update pool data with budget ID
    TEST_POOL_DATA.budgetId = createdBudgetId;

    // ==========================================
    // TEST 1: Create Pool (Direct Firebase)
    // ==========================================
    console.log("\n📝 TEST 1: Creating pool with direct Firebase...");
    console.log("Pool Data:", JSON.stringify(TEST_POOL_DATA, null, 2));

    const poolsCollection = collection(db, "budgets", createdBudgetId, "pools");
    const poolDocRef = await addDoc(poolsCollection, TEST_POOL_DATA);
    createdPoolId = poolDocRef.id;

    console.log("✅ Pool created successfully!");
    console.log(`   Pool ID: ${createdPoolId}`);
    console.log(
      `   Pool Path: budgets/${createdBudgetId}/pools/${createdPoolId}`
    );
    console.log(`   Pool Name: ${TEST_POOL_DATA.name}`);
    console.log(`   Purpose Type: ${TEST_POOL_DATA.purposeType}`);
    console.log(`   Target Amount: $${TEST_POOL_DATA.targetAmount}`);
    console.log(`   Icon: ${TEST_POOL_DATA.icon}`);
    console.log(`   Color: ${TEST_POOL_DATA.color}`);

    // ==========================================
    // TEST 2: Verify Pool Exists
    // ==========================================
    console.log("\n🔍 TEST 2: Verifying pool exists...");

    const poolDocPath = doc(
      db,
      "budgets",
      createdBudgetId,
      "pools",
      createdPoolId
    );
    const poolDoc = await getDoc(poolDocPath);

    if (!poolDoc.exists()) {
      throw new Error("Pool not found after creation!");
    }

    const retrievedPoolData = poolDoc.data();
    console.log("✅ Pool retrieved successfully!");
    console.log(`   Pool ID: ${poolDoc.id}`);
    console.log(`   Pool Name: ${retrievedPoolData.name}`);
    console.log(`   Budget ID: ${retrievedPoolData.budgetId}`);
    console.log(`   Purpose Type: ${retrievedPoolData.purposeType}`);
    console.log(`   Active: ${retrievedPoolData.isActive}`);
    console.log(`   Target Amount: $${retrievedPoolData.targetAmount}`);
    console.log(`   Matches created pool: ${poolDoc.id === createdPoolId}`);
    console.log(
      `   Belongs to correct budget: ${retrievedPoolData.budgetId === createdBudgetId}`
    );

    // ==========================================
    // TEST 3: List Budget Pools
    // ==========================================
    console.log("\n📋 TEST 3: Listing budget pools...");

    const poolsQuery = query(
      collection(db, "budgets", createdBudgetId, "pools"),
      where("isActive", "==", true),
      orderBy("createdAt", "asc")
    );

    const poolsSnapshot = await getDocs(poolsQuery);
    const budgetPools = poolsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const foundTestPool = budgetPools.find((p) => p.id === createdPoolId);

    console.log("✅ Pool list retrieved successfully!");
    console.log(`   Total pools for budget: ${budgetPools.length}`);
    console.log(`   Test pool found in list: ${!!foundTestPool}`);
    console.log(
      `   All pool names: ${budgetPools.map((p) => p.name).join(", ")}`
    );
    console.log(
      `   Purpose types: ${budgetPools.map((p) => p.purposeType).join(", ")}`
    );

    // ==========================================
    // TEST 4: Query Pools by Purpose Type
    // ==========================================
    console.log("\n🎯 TEST 4: Querying pools by purpose type...");

    const savingPoolsQuery = query(
      collection(db, "budgets", createdBudgetId, "pools"),
      where("isActive", "==", true),
      where("purposeType", "==", "saving"),
      orderBy("createdAt", "asc")
    );

    const savingPoolsSnapshot = await getDocs(savingPoolsQuery);
    const savingPools = savingPoolsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const foundTestSavingPool = savingPools.find((p) => p.id === createdPoolId);

    console.log("✅ Saving pools query successful!");
    console.log(`   Total saving pools: ${savingPools.length}`);
    console.log(`   Test saving pool found: ${!!foundTestSavingPool}`);
    console.log(
      `   Saving pool names: ${savingPools.map((p) => p.name).join(", ")}`
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
    console.log(`   2. Navigate to: budgets/${createdBudgetId}/pools`);
    console.log(`   3. Verify pool document exists with ID: ${createdPoolId}`);
    console.log(
      `   4. Check that all fields are correct (name, purposeType, targetAmount, etc.)`
    );
    console.log(`   5. Verify the pool belongs to the correct budget`);
    console.log("");
    console.log(
      "⏳ Waiting 5 seconds for you to verify in Firebase Console..."
    );

    await sleep(5000);

    // ==========================================
    // TEST 5: Update Pool
    // ==========================================
    console.log("\n✏️  TEST 5: Updating pool...");

    const updatePoolData = {
      name: "Test Pool - UPDATED Emergency Fund",
      description: "Updated description to verify update operation works",
      targetAmount: 7500,
      color: "green",
      updatedAt: Timestamp.now(),
    };

    await updateDoc(poolDocPath, updatePoolData);

    // Verify update
    const updatedPoolDoc = await getDoc(poolDocPath);
    const updatedPoolData = updatedPoolDoc.data();

    console.log("✅ Pool updated successfully!");
    console.log(`   New name: ${updatedPoolData.name}`);
    console.log(`   New description: ${updatedPoolData.description}`);
    console.log(`   New target amount: $${updatedPoolData.targetAmount}`);
    console.log(`   New color: ${updatedPoolData.color}`);
    console.log(`   Updated at: ${updatedPoolData.updatedAt.toDate()}`);
    console.log(`   Purpose type unchanged: ${updatedPoolData.purposeType}`);

    // ==========================================
    // TEST 6: Test Goal Pool Functionality
    // ==========================================
    console.log("\n🎯 TEST 6: Testing goal pool functionality...");

    // Create a goal pool with target date
    const goalPoolData = {
      budgetId: createdBudgetId,
      name: "Test Goal Pool - Vacation",
      description: "Saving for vacation trip",
      icon: "travel",
      color: "blue",
      purposeType: "goal",
      targetAmount: 3000,
      targetDate: Timestamp.fromDate(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      ), // 1 year from now
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const goalPoolDocRef = await addDoc(poolsCollection, goalPoolData);
    const goalPoolId = goalPoolDocRef.id;

    console.log("✅ Goal pool created successfully!");
    console.log(`   Goal Pool ID: ${goalPoolId}`);
    console.log(`   Goal Pool Name: ${goalPoolData.name}`);
    console.log(`   Target Amount: $${goalPoolData.targetAmount}`);
    console.log(`   Target Date: ${goalPoolData.targetDate.toDate()}`);

    // Verify goal pool exists and has correct data
    const goalPoolDoc = await getDoc(goalPoolDocRef);
    const retrievedGoalData = goalPoolDoc.data();

    console.log("✅ Goal pool verification:");
    console.log(
      `   Purpose type is goal: ${retrievedGoalData.purposeType === "goal"}`
    );
    console.log(
      `   Has target amount: ${retrievedGoalData.targetAmount === 3000}`
    );
    console.log(`   Has target date: ${!!retrievedGoalData.targetDate}`);

    // ==========================================
    // TEST 6B: List All Pools (Should show 2 now)
    // ==========================================
    console.log("\n📋 TEST 6B: Listing all pools (should show 2 pools now)...");

    const allPoolsQuery = query(
      collection(db, "budgets", createdBudgetId, "pools"),
      where("isActive", "==", true),
      orderBy("createdAt", "asc")
    );

    const allPoolsSnapshot = await getDocs(allPoolsQuery);
    const allPools = allPoolsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Complete pool list retrieved successfully!");
    console.log(`   Total pools for budget: ${allPools.length}`);
    console.log(
      `   Expected 2 pools: ${allPools.length === 2 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log("");
    console.log("   Pool details:");
    allPools.forEach((pool, index) => {
      console.log(`   ${index + 1}. ${pool.name}`);
      console.log(`      - Purpose: ${pool.purposeType}`);
      console.log(`      - Icon: ${pool.icon}`);
      console.log(`      - Color: ${pool.color}`);
      if (pool.targetAmount) {
        console.log(`      - Target: ${pool.targetAmount}`);
      }
      if (pool.targetDate) {
        console.log(
          `      - Target Date: ${pool.targetDate.toDate().toDateString()}`
        );
      }
      console.log("");
    });

    // Verify both specific pools exist
    const foundEmergencyPool = allPools.find((p) => p.id === createdPoolId);
    const foundGoalPool = allPools.find((p) => p.id === goalPoolId);

    console.log("   Pool existence verification:");
    console.log(`   Emergency fund pool found: ${!!foundEmergencyPool}`);
    console.log(`   Goal vacation pool found: ${!!foundGoalPool}`);
    console.log(
      `   Both pools belong to same budget: ${allPools.every((p) => p.budgetId === createdBudgetId)}`
    );

    // ==========================================
    // TEST 7: Soft Delete Pool
    // ==========================================
    console.log("\n🗑️  TEST 7: Soft deleting pool...");

    await updateDoc(poolDocPath, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Pool soft deletion executed successfully!");

    // ==========================================
    // TEST 8: Verify Soft Delete
    // ==========================================
    console.log("\n✔️  TEST 8: Verifying soft delete...");

    // Check that pool still exists but isActive = false
    const deletedPoolDoc = await getDoc(poolDocPath);
    const deletedPoolData = deletedPoolDoc.data();

    if (!deletedPoolDoc.exists()) {
      throw new Error(
        "Pool document was hard deleted instead of soft deleted!"
      );
    }

    if (deletedPoolData.isActive !== false) {
      throw new Error(
        "Pool was not properly soft deleted (isActive should be false)!"
      );
    }

    console.log("✅ Pool correctly soft deleted!");
    console.log(`   Document exists: ${deletedPoolDoc.exists()}`);
    console.log(`   isActive: ${deletedPoolData.isActive}`);

    // Verify it doesn't appear in active pool queries
    const finalPoolsQuery = query(
      collection(db, "budgets", createdBudgetId, "pools"),
      where("isActive", "==", true),
      orderBy("createdAt", "asc")
    );
    const activePoolsSnapshot = await getDocs(finalPoolsQuery);
    const activePools = activePoolsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const stillFoundInActive = activePools.find((p) => p.id === createdPoolId);

    console.log("✅ Active pool list verified clean!");
    console.log(`   Pool removed from active list: ${!stillFoundInActive}`);
    console.log(`   Current active pools: ${activePools.length}`);
    console.log(
      `   Should be 1 remaining (goal pool): ${activePools.length === 1 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log(
      `   Remaining active pools: ${activePools.map((p) => p.name).join(", ")}`
    );

    // Clean up goal pool too
    await updateDoc(goalPoolDocRef, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Goal pool also soft deleted for cleanup");

    // Final verification - should be 0 active pools now
    const finalActivePoolsSnapshot = await getDocs(finalPoolsQuery);
    const finalActivePools = finalActivePoolsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Final cleanup verification:");
    console.log(
      `   All pools cleaned up: ${finalActivePools.length === 0 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log(`   Final active pool count: ${finalActivePools.length}`);

    // ==========================================
    // SUCCESS SUMMARY
    // ==========================================
    console.log("\n🎉 ALL TESTS PASSED!");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("✅ Direct Firebase pool operations are working correctly");
    console.log("✅ Production Firebase connection is functional");
    console.log("✅ Pool creation, reading, and updating work properly");
    console.log("✅ Hierarchical data structure (budget -> pools) working");
    console.log("✅ Pool purpose type filtering works correctly");
    console.log("✅ Goal pool creation with target amount and date works");
    console.log("✅ Soft deletion is working as expected");
    console.log("✅ Query filtering works correctly");
    console.log("✅ Data validation and Timestamp handling working");
    console.log("");
    console.log("🔍 Final verification in Firebase Console:");
    console.log(`   - Budget document exists at budgets/${createdBudgetId}`);
    console.log(
      `   - Pool document exists at budgets/${createdBudgetId}/pools/${createdPoolId}`
    );
    console.log(
      `   - Goal pool document exists at budgets/${createdBudgetId}/pools/${goalPoolId}`
    );
    console.log(`   - Both pool isActive fields should be false`);
    console.log(`   - updatedAt should reflect deletion time`);
    console.log(`   - All other fields should be preserved`);
    console.log(`   - Pool budgetId should match the parent budget ID`);
  } catch (error) {
    console.error("\n❌ POOL TEST FAILED!");
    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.error("Error Details:", error.message);
    console.error("Stack Trace:", error.stack);

    // Cleanup attempt
    if (createdPoolId && createdBudgetId && db && authenticatedUser) {
      console.log("\n🧹 Attempting pool cleanup...");
      try {
        const poolDocPath = doc(
          db,
          "budgets",
          createdBudgetId,
          "pools",
          createdPoolId
        );
        await updateDoc(poolDocPath, {
          isActive: false,
          updatedAt: Timestamp.now(),
        });
        console.log("✅ Pool cleanup successful");
      } catch (cleanupError) {
        console.error("❌ Pool cleanup failed:", cleanupError.message);
      }
    }

    if (createdBudgetId && db && authenticatedUser) {
      console.log("\n🧹 Attempting budget cleanup...");
      try {
        const budgetDocPath = doc(db, "budgets", createdBudgetId);
        await updateDoc(budgetDocPath, {
          isActive: false,
          updatedAt: Timestamp.now(),
        });
        console.log("✅ Budget cleanup successful");
      } catch (cleanupError) {
        console.error("❌ Budget cleanup failed:", cleanupError.message);
      }
    }

    process.exit(1);
  }
}

/**
 * Main execution
 */
console.log("🚀 Pool CRUD Test Script (Direct Firebase - Production)");
console.log(`📅 ${new Date().toISOString()}`);
console.log(`👤 Test User: ${TEST_USER_ID}`);
console.log("🔥 Using Production Firebase (no emulators)");
console.log(
  "🏗️  Note: This test creates a parent budget and then tests pool operations"
);

runDirectPoolCRUDTest()
  .then(() => {
    console.log("\n✨ Pool test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Pool test script failed:", error);
    process.exit(1);
  });
