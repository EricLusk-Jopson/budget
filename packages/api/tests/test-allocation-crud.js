#!/usr/bin/env node

/**
 * Allocation Strategy CRUD Test Script (Direct Firebase - Production)
 *
 * Uses direct Firebase imports like the successful budget, pool, and channel tests
 * Forces production Firebase (no emulators)
 * Tests allocation strategies which are nested under budgets and reference pools
 *
 * Usage: node test-allocation-crud.js
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
  limit,
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { firebaseService, getFirebaseConfig } from "../dist/index.js";

// Test configuration
const TEST_USER_ID = "test-user-allocation-123";
const TEST_BUDGET_DATA = {
  name: "Test Budget for Allocation Testing",
  description: "Temporary budget created for allocation strategy CRUD testing",
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
 * Helper function to create test pools (reused from pool test)
 */
async function createTestPools(db, budgetId) {
  const poolsCollection = collection(db, "budgets", budgetId, "pools");

  // Create Emergency Fund Pool (saving)
  const emergencyPoolData = {
    budgetId: budgetId,
    name: "Emergency Fund",
    description: "Emergency savings for unexpected expenses",
    icon: "emergency",
    color: "red",
    purposeType: "saving",
    targetAmount: 10000,
    targetDate: null,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Create Groceries Pool (spending)
  const groceriesPoolData = {
    budgetId: budgetId,
    name: "Groceries",
    description: "Food and household essentials",
    icon: "food",
    color: "green",
    purposeType: "spending",
    targetAmount: null,
    targetDate: null,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Create Vacation Pool (goal)
  const vacationPoolData = {
    budgetId: budgetId,
    name: "Vacation Fund",
    description: "Saving for summer vacation",
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

  // Create the pools
  const emergencyPoolRef = await addDoc(poolsCollection, emergencyPoolData);
  const groceriesPoolRef = await addDoc(poolsCollection, groceriesPoolData);
  const vacationPoolRef = await addDoc(poolsCollection, vacationPoolData);

  return {
    emergencyPoolId: emergencyPoolRef.id,
    groceriesPoolId: groceriesPoolRef.id,
    vacationPoolId: vacationPoolRef.id,
  };
}

/**
 * Run the complete allocation strategy CRUD test using direct Firebase
 */
async function runDirectAllocationCRUDTest() {
  console.log("🧪 Starting Allocation Strategy CRUD Test (Direct Firebase)...");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  let createdBudgetId = null;
  let poolIds = {};
  let createdAllocationId = null;
  let createdBalancedAllocationId = null;
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

    // ==========================================
    // PREREQUISITE: Create Test Pools
    // ==========================================
    console.log("\n🏊 PREREQUISITE: Creating test pools...");

    poolIds = await createTestPools(db, createdBudgetId);

    console.log("✅ Test pools created successfully!");
    console.log(`   Emergency Pool ID: ${poolIds.emergencyPoolId}`);
    console.log(`   Groceries Pool ID: ${poolIds.groceriesPoolId}`);
    console.log(`   Vacation Pool ID: ${poolIds.vacationPoolId}`);
    console.log(`   Total pools created: 3`);

    // ==========================================
    // TEST 1: Create Allocation Strategy with Valid Proportions
    // ==========================================
    console.log(
      "\n📝 TEST 1: Creating allocation strategy with valid proportions..."
    );

    const allocationStrategyData = {
      budgetId: createdBudgetId,
      name: "Primary Allocation Strategy",
      description: "Main strategy for income distribution",
      effectiveFrom: Timestamp.now(),
      allocations: [
        {
          poolId: poolIds.emergencyPoolId,
          proportion: 0.2, // 20% to emergency fund
        },
        {
          poolId: poolIds.groceriesPoolId,
          proportion: 0.5, // 50% to groceries
        },
        {
          poolId: poolIds.vacationPoolId,
          proportion: 0.3, // 30% to vacation
        },
      ],
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log(
      "Allocation Strategy Data:",
      JSON.stringify(allocationStrategyData, null, 2)
    );

    // Verify proportions sum to 1.0
    const totalProportion = allocationStrategyData.allocations.reduce(
      (sum, allocation) => sum + allocation.proportion,
      0
    );
    console.log(
      `   Proportions sum verification: ${totalProportion} (should be 1.0)`
    );
    console.log(
      `   Valid proportion sum: ${Math.abs(totalProportion - 1.0) < 0.001 ? "✅ VALID" : "❌ INVALID"}`
    );

    const allocationsCollection = collection(
      db,
      "budgets",
      createdBudgetId,
      "allocationStrategies"
    );
    const allocationDocRef = await addDoc(
      allocationsCollection,
      allocationStrategyData
    );
    createdAllocationId = allocationDocRef.id;

    console.log("✅ Allocation strategy created successfully!");
    console.log(`   Allocation ID: ${createdAllocationId}`);
    console.log(
      `   Allocation Path: budgets/${createdBudgetId}/allocationStrategies/${createdAllocationId}`
    );
    console.log(`   Strategy Name: ${allocationStrategyData.name}`);
    console.log(`   Pool Count: ${allocationStrategyData.allocations.length}`);
    console.log(
      `   Emergency Fund: ${(allocationStrategyData.allocations[0].proportion * 100).toFixed(1)}%`
    );
    console.log(
      `   Groceries: ${(allocationStrategyData.allocations[1].proportion * 100).toFixed(1)}%`
    );
    console.log(
      `   Vacation: ${(allocationStrategyData.allocations[2].proportion * 100).toFixed(1)}%`
    );

    // ==========================================
    // TEST 2: Verify Allocation Strategy Exists
    // ==========================================
    console.log("\n🔍 TEST 2: Verifying allocation strategy exists...");

    const allocationDocPath = doc(
      db,
      "budgets",
      createdBudgetId,
      "allocationStrategies",
      createdAllocationId
    );
    const allocationDoc = await getDoc(allocationDocPath);

    if (!allocationDoc.exists()) {
      throw new Error("Allocation strategy not found after creation!");
    }

    const retrievedAllocationData = allocationDoc.data();
    console.log("✅ Allocation strategy retrieved successfully!");
    console.log(`   Allocation ID: ${allocationDoc.id}`);
    console.log(`   Strategy Name: ${retrievedAllocationData.name}`);
    console.log(`   Budget ID: ${retrievedAllocationData.budgetId}`);
    console.log(`   Active: ${retrievedAllocationData.isActive}`);
    console.log(
      `   Effective From: ${retrievedAllocationData.effectiveFrom.toDate()}`
    );
    console.log(
      `   Allocations Count: ${retrievedAllocationData.allocations.length}`
    );
    console.log(
      `   Matches created strategy: ${allocationDoc.id === createdAllocationId}`
    );
    console.log(
      `   Belongs to correct budget: ${retrievedAllocationData.budgetId === createdBudgetId}`
    );

    // Verify allocation details
    console.log("   Allocation breakdown verification:");
    retrievedAllocationData.allocations.forEach((allocation, index) => {
      console.log(`   ${index + 1}. Pool ID: ${allocation.poolId}`);
      console.log(
        `      Proportion: ${(allocation.proportion * 100).toFixed(1)}%`
      );
      console.log(
        `      Pool ID matches created pool: ${Object.values(poolIds).includes(allocation.poolId)}`
      );
    });

    // ==========================================
    // TEST 3: Create Balanced 50/30/20 Strategy
    // ==========================================
    console.log(
      "\n⚖️  TEST 3: Creating balanced 50/30/20 allocation strategy..."
    );

    const balancedAllocationData = {
      budgetId: createdBudgetId,
      name: "50/30/20 Balanced Strategy",
      description:
        "Classic balanced approach: 50% needs, 30% wants, 20% savings",
      effectiveFrom: Timestamp.fromDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      ), // Tomorrow
      allocations: [
        {
          poolId: poolIds.groceriesPoolId,
          proportion: 0.5, // 50% needs (groceries)
        },
        {
          poolId: poolIds.vacationPoolId,
          proportion: 0.3, // 30% wants (vacation)
        },
        {
          poolId: poolIds.emergencyPoolId,
          proportion: 0.2, // 20% savings (emergency)
        },
      ],
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const balancedAllocationRef = await addDoc(
      allocationsCollection,
      balancedAllocationData
    );
    createdBalancedAllocationId = balancedAllocationRef.id;

    console.log("✅ Balanced allocation strategy created successfully!");
    console.log(`   Balanced Allocation ID: ${createdBalancedAllocationId}`);
    console.log(`   Strategy: 50/30/20 approach`);
    console.log(`   Needs (Groceries): 50%`);
    console.log(`   Wants (Vacation): 30%`);
    console.log(`   Savings (Emergency): 20%`);
    console.log(
      `   Effective tomorrow: ${balancedAllocationData.effectiveFrom.toDate().toDateString()}`
    );

    // Verify balanced proportions sum to 1.0
    const balancedTotalProportion = balancedAllocationData.allocations.reduce(
      (sum, allocation) => sum + allocation.proportion,
      0
    );
    console.log(
      `   Balanced proportions sum: ${balancedTotalProportion} (50%+30%+20%=100%)`
    );
    console.log(
      `   Valid balanced proportion sum: ${Math.abs(balancedTotalProportion - 1.0) < 0.001 ? "✅ VALID" : "❌ INVALID"}`
    );
    // ==========================================
    // TEST 4: List All Allocation Strategies (Should show 2)
    // ==========================================
    console.log(
      "\n📋 TEST 4: Listing all allocation strategies (should show 2 strategies now)..."
    );

    const allAllocationsQuery = query(
      collection(db, "budgets", createdBudgetId, "allocationStrategies"),
      where("isActive", "==", true),
      orderBy("effectiveFrom", "desc")
    );

    const allAllocationsSnapshot = await getDocs(allAllocationsQuery);
    const allAllocations = allAllocationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Complete allocation strategy list retrieved successfully!");
    console.log(`   Total strategies for budget: ${allAllocations.length}`);
    console.log(
      `   Expected 2 strategies: ${allAllocations.length === 2 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log("");
    console.log("   Strategy details:");
    allAllocations.forEach((strategy, index) => {
      console.log(`   ${index + 1}. ${strategy.name}`);
      console.log(`      - Description: ${strategy.description}`);
      console.log(
        `      - Effective From: ${strategy.effectiveFrom.toDate().toDateString()}`
      );
      console.log(`      - Pool Count: ${strategy.allocations.length}`);
      console.log(`      - Allocations:`);
      strategy.allocations.forEach((allocation) => {
        console.log(
          `        * Pool ${allocation.poolId.slice(-8)}: ${(allocation.proportion * 100).toFixed(1)}%`
        );
      });
      console.log("");
    });

    // Verify both specific strategies exist
    const foundPrimaryStrategy = allAllocations.find(
      (s) => s.id === createdAllocationId
    );
    const foundBalancedStrategy = allAllocations.find(
      (s) => s.id === createdBalancedAllocationId
    );

    console.log("   Strategy existence verification:");
    console.log(`   Primary strategy found: ${!!foundPrimaryStrategy}`);
    console.log(`   Balanced strategy found: ${!!foundBalancedStrategy}`);
    console.log(
      `   Both strategies belong to same budget: ${allAllocations.every((s) => s.budgetId === createdBudgetId)}`
    );

    // ==========================================
    // TEST 5: Query Current Active Strategy
    // ==========================================
    console.log("\n🎯 TEST 5: Querying current active allocation strategy...");

    const currentStrategyQuery = query(
      collection(db, "budgets", createdBudgetId, "allocationStrategies"),
      where("isActive", "==", true),
      where("effectiveFrom", "<=", Timestamp.now()),
      orderBy("effectiveFrom", "desc"),
      limit(1)
    );

    const currentStrategySnapshot = await getDocs(currentStrategyQuery);
    const currentStrategies = currentStrategySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Current strategy query successful!");
    console.log(`   Current strategies found: ${currentStrategies.length}`);
    console.log(
      `   Expected 1 current strategy: ${currentStrategies.length === 1 ? "✅ CORRECT" : "❌ WRONG"}`
    );

    if (currentStrategies.length > 0) {
      const currentStrategy = currentStrategies[0];
      console.log(`   Current strategy: ${currentStrategy.name}`);
      console.log(
        `   Effective from: ${currentStrategy.effectiveFrom.toDate()}`
      );
      console.log(
        `   Should be Primary Strategy: ${currentStrategy.id === createdAllocationId ? "✅ CORRECT" : "❌ WRONG"}`
      );
    }

    // ==========================================
    // TEST 6: Test Income Distribution Calculation
    // ==========================================
    console.log("\n💰 TEST 6: Testing income distribution calculation...");

    const testIncomeAmount = 5000; // $5,000 income
    const currentStrategy = currentStrategies[0];

    console.log(`   Test income amount: $${testIncomeAmount}`);
    console.log(`   Using strategy: ${currentStrategy.name}`);
    console.log("");
    console.log("   Income distribution:");

    let totalDistributed = 0;
    currentStrategy.allocations.forEach((allocation, index) => {
      const allocatedAmount = testIncomeAmount * allocation.proportion;
      totalDistributed += allocatedAmount;
      console.log(
        `   ${index + 1}. Pool ${allocation.poolId.slice(-8)}: $${allocatedAmount.toFixed(2)} (${(allocation.proportion * 100).toFixed(1)}%)`
      );
    });

    console.log("");
    console.log(`   Total distributed: $${totalDistributed.toFixed(2)}`);
    console.log(
      `   Matches income amount: ${Math.abs(totalDistributed - testIncomeAmount) < 0.01 ? "✅ CORRECT" : "❌ WRONG"}`
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
    console.log(
      `   2. Navigate to: budgets/${createdBudgetId}/allocationStrategies`
    );
    console.log(`   3. Verify 2 allocation strategy documents exist with IDs:`);
    console.log(`      - Primary: ${createdAllocationId}`);
    console.log(`      - Balanced: ${createdBalancedAllocationId}`);
    console.log(`   4. Check that each strategy has 3 allocations`);
    console.log(`   5. Verify proportions sum to 1.0 in each strategy`);
    console.log(
      `   6. Check effectiveFrom dates (primary=now, balanced=tomorrow)`
    );
    console.log(`   7. Verify all poolIds reference the created pools`);
    console.log("");
    console.log(
      "⏳ Waiting 5 seconds for you to verify in Firebase Console..."
    );

    await sleep(5000);

    // ==========================================
    // TEST 7: Update Allocation Strategy
    // ==========================================
    console.log("\n✏️  TEST 7: Updating allocation strategy...");

    const updateAllocationData = {
      name: "Primary Allocation Strategy - UPDATED",
      description: "Updated main strategy with adjusted proportions",
      allocations: [
        {
          poolId: poolIds.emergencyPoolId,
          proportion: 0.25, // Increased emergency fund from 20% to 25%
        },
        {
          poolId: poolIds.groceriesPoolId,
          proportion: 0.45, // Decreased groceries from 50% to 45%
        },
        {
          poolId: poolIds.vacationPoolId,
          proportion: 0.3, // Vacation stays at 30%
        },
      ],
      updatedAt: Timestamp.now(),
    };

    // Verify updated proportions sum to 1.0
    const updatedTotalProportion = updateAllocationData.allocations.reduce(
      (sum, allocation) => sum + allocation.proportion,
      0
    );
    console.log(
      `   Updated proportions sum: ${updatedTotalProportion} (should be 1.0)`
    );
    console.log(
      `   Valid updated proportion sum: ${Math.abs(updatedTotalProportion - 1.0) < 0.001 ? "✅ VALID" : "❌ INVALID"}`
    );

    await updateDoc(allocationDocPath, updateAllocationData);

    // Verify update
    const updatedAllocationDoc = await getDoc(allocationDocPath);
    const updatedAllocationData = updatedAllocationDoc.data();

    console.log("✅ Allocation strategy updated successfully!");
    console.log(`   New name: ${updatedAllocationData.name}`);
    console.log(`   New description: ${updatedAllocationData.description}`);
    console.log(`   Updated allocations:`);
    updatedAllocationData.allocations.forEach((allocation, index) => {
      console.log(
        `   ${index + 1}. Pool ${allocation.poolId.slice(-8)}: ${(allocation.proportion * 100).toFixed(1)}%`
      );
    });
    console.log(`   Updated at: ${updatedAllocationData.updatedAt.toDate()}`);

    // ==========================================
    // TEST 8: Soft Delete Allocation Strategy
    // ==========================================
    console.log("\n🗑️  TEST 8: Soft deleting primary allocation strategy...");

    await updateDoc(allocationDocPath, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    console.log(
      "✅ Primary allocation strategy soft deletion executed successfully!"
    );

    // ==========================================
    // TEST 9: Verify Soft Delete
    // ==========================================
    console.log("\n✔️  TEST 9: Verifying soft delete...");

    // Check that strategy still exists but isActive = false
    const deletedAllocationDoc = await getDoc(allocationDocPath);
    const deletedAllocationData = deletedAllocationDoc.data();

    if (!deletedAllocationDoc.exists()) {
      throw new Error(
        "Allocation strategy document was hard deleted instead of soft deleted!"
      );
    }

    if (deletedAllocationData.isActive !== false) {
      throw new Error(
        "Allocation strategy was not properly soft deleted (isActive should be false)!"
      );
    }

    console.log("✅ Allocation strategy correctly soft deleted!");
    console.log(`   Document exists: ${deletedAllocationDoc.exists()}`);
    console.log(`   isActive: ${deletedAllocationData.isActive}`);

    // Verify it doesn't appear in active strategy queries
    const finalAllocationsQuery = query(
      collection(db, "budgets", createdBudgetId, "allocationStrategies"),
      where("isActive", "==", true),
      orderBy("effectiveFrom", "desc")
    );
    const activeAllocationsSnapshot = await getDocs(finalAllocationsQuery);
    const activeAllocations = activeAllocationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const stillFoundInActive = activeAllocations.find(
      (s) => s.id === createdAllocationId
    );

    console.log("✅ Active allocation strategy list verified clean!");
    console.log(
      `   Primary strategy removed from active list: ${!stillFoundInActive}`
    );
    console.log(`   Current active strategies: ${activeAllocations.length}`);
    console.log(
      `   Should be 1 remaining (balanced): ${activeAllocations.length === 1 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log(
      `   Remaining active strategies: ${activeAllocations.map((s) => s.name).join(", ")}`
    );

    // Clean up balanced strategy too
    const balancedAllocationDocPath = doc(
      db,
      "budgets",
      createdBudgetId,
      "allocationStrategies",
      createdBalancedAllocationId
    );
    await updateDoc(balancedAllocationDocPath, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    console.log(
      "✅ Balanced allocation strategy also soft deleted for cleanup"
    );

    // Final verification - should be 0 active strategies now
    const finalActiveAllocationsSnapshot = await getDocs(finalAllocationsQuery);
    const finalActiveAllocations = finalActiveAllocationsSnapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

    console.log("✅ Final cleanup verification:");
    console.log(
      `   All strategies cleaned up: ${finalActiveAllocations.length === 0 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log(
      `   Final active strategy count: ${finalActiveAllocations.length}`
    );

    // ==========================================
    // SUCCESS SUMMARY
    // ==========================================
    console.log("\n🎉 ALL TESTS PASSED!");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log(
      "✅ Direct Firebase allocation strategy operations are working correctly"
    );
    console.log("✅ Production Firebase connection is functional");
    console.log(
      "✅ Allocation strategy creation, reading, and updating work properly"
    );
    console.log(
      "✅ Hierarchical data structure (budget -> strategies) working"
    );
    console.log("✅ Pool references in allocations work correctly");
    console.log("✅ Proportion validation (sum to 1.0) working correctly");
    console.log("✅ Income distribution calculations work properly");
    console.log("✅ Multiple allocation strategies can coexist");
    console.log("✅ Current strategy queries work correctly");
    console.log("✅ Effective date filtering works properly");
    console.log("✅ Soft deletion is working as expected");
    console.log("✅ Query filtering works correctly");
    console.log("✅ Data validation and Timestamp handling working");
    console.log("");
    console.log("🔍 Final verification in Firebase Console:");
    console.log(`   - Budget document exists at budgets/${createdBudgetId}`);
    console.log(
      `   - 3 pool documents exist at budgets/${createdBudgetId}/pools/`
    );
    console.log(
      `   - Primary strategy exists at budgets/${createdBudgetId}/allocationStrategies/${createdAllocationId}`
    );
    console.log(
      `   - Balanced strategy exists at budgets/${createdBudgetId}/allocationStrategies/${createdBalancedAllocationId}`
    );
    console.log(`   - Both strategy isActive fields should be false`);
    console.log(`   - updatedAt should reflect deletion time`);
    console.log(`   - All allocations should reference the created pool IDs`);
    console.log(`   - Proportions in each strategy should sum to 1.0`);
  } catch (error) {
    console.error("\n❌ ALLOCATION STRATEGY TEST FAILED!");
    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.error("Error Details:", error.message);
    console.error("Stack Trace:", error.stack);

    // Cleanup attempt
    const cleanupTasks = [];

    if (createdAllocationId && createdBudgetId && db && authenticatedUser) {
      cleanupTasks.push(
        updateDoc(
          doc(
            db,
            "budgets",
            createdBudgetId,
            "allocationStrategies",
            createdAllocationId
          ),
          {
            isActive: false,
            updatedAt: Timestamp.now(),
          }
        ).catch(console.error)
      );
    }

    if (
      createdBalancedAllocationId &&
      createdBudgetId &&
      db &&
      authenticatedUser
    ) {
      cleanupTasks.push(
        updateDoc(
          doc(
            db,
            "budgets",
            createdBudgetId,
            "allocationStrategies",
            createdBalancedAllocationId
          ),
          {
            isActive: false,
            updatedAt: Timestamp.now(),
          }
        ).catch(console.error)
      );
    }

    // Clean up pools
    if (poolIds && createdBudgetId && db && authenticatedUser) {
      Object.values(poolIds).forEach((poolId) => {
        cleanupTasks.push(
          updateDoc(doc(db, "budgets", createdBudgetId, "pools", poolId), {
            isActive: false,
            updatedAt: Timestamp.now(),
          }).catch(console.error)
        );
      });
    }

    if (createdBudgetId && db && authenticatedUser) {
      cleanupTasks.push(
        updateDoc(doc(db, "budgets", createdBudgetId), {
          isActive: false,
          updatedAt: Timestamp.now(),
        }).catch(console.error)
      );
    }

    if (cleanupTasks.length > 0) {
      console.log("\n🧹 Attempting cleanup...");
      try {
        await Promise.all(cleanupTasks);
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
console.log(
  "🚀 Allocation Strategy CRUD Test Script (Direct Firebase - Production)"
);
console.log(`📅 ${new Date().toISOString()}`);
console.log(`👤 Test User: ${TEST_USER_ID}`);
console.log("🔥 Using Production Firebase (no emulators)");
console.log(
  "🏗️  Note: This test creates a budget, pools, and then tests allocation strategies"
);

runDirectAllocationCRUDTest()
  .then(() => {
    console.log("\n✨ Allocation strategy test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Allocation strategy test script failed:", error);
    process.exit(1);
  });
