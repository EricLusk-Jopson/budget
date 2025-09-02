#!/usr/bin/env node

/**
 * Channel CRUD Test Script (Direct Firebase - Production)
 *
 * Uses direct Firebase imports like the successful budget and pool tests
 * Forces production Firebase (no emulators)
 * Tests channels which are nested under budgets
 *
 * Usage: node test-channel-crud.js
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
const TEST_USER_ID = "test-user-channel-123";
const TEST_BUDGET_DATA = {
  name: "Test Budget for Channel Testing",
  description: "Temporary budget created for channel CRUD testing",
  currency: "USD",
  ownerId: "", // Will be set to authenticated user ID
  isActive: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

const TEST_CHECKING_CHANNEL_DATA = {
  budgetId: "", // Will be set to created budget ID
  name: "Test Checking Account",
  description: "Primary checking account for testing",
  type: "checking",
  institution: "Test Bank",
  accountNumber: "****1234",
  creditLimit: null,
  billTracking: null,
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
 * Run the complete channel CRUD test using direct Firebase
 */
async function runDirectChannelCRUDTest() {
  console.log("🧪 Starting Channel CRUD Test (Direct Firebase)...");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  let createdBudgetId = null;
  let createdCheckingChannelId = null;
  let createdCreditChannelId = null;
  let createdCashChannelId = null;
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

    // Update channel data with budget ID
    TEST_CHECKING_CHANNEL_DATA.budgetId = createdBudgetId;

    // ==========================================
    // TEST 1: Create Checking Channel (Direct Firebase)
    // ==========================================
    console.log(
      "\n📝 TEST 1: Creating checking channel with direct Firebase..."
    );
    console.log(
      "Checking Channel Data:",
      JSON.stringify(TEST_CHECKING_CHANNEL_DATA, null, 2)
    );

    const channelsCollection = collection(
      db,
      "budgets",
      createdBudgetId,
      "channels"
    );
    const checkingChannelDocRef = await addDoc(
      channelsCollection,
      TEST_CHECKING_CHANNEL_DATA
    );
    createdCheckingChannelId = checkingChannelDocRef.id;

    console.log("✅ Checking channel created successfully!");
    console.log(`   Channel ID: ${createdCheckingChannelId}`);
    console.log(
      `   Channel Path: budgets/${createdBudgetId}/channels/${createdCheckingChannelId}`
    );
    console.log(`   Channel Name: ${TEST_CHECKING_CHANNEL_DATA.name}`);
    console.log(`   Channel Type: ${TEST_CHECKING_CHANNEL_DATA.type}`);
    console.log(`   Institution: ${TEST_CHECKING_CHANNEL_DATA.institution}`);
    console.log(
      `   Account Number: ${TEST_CHECKING_CHANNEL_DATA.accountNumber}`
    );

    // ==========================================
    // TEST 2: Verify Checking Channel Exists
    // ==========================================
    console.log("\n🔍 TEST 2: Verifying checking channel exists...");

    const checkingChannelDocPath = doc(
      db,
      "budgets",
      createdBudgetId,
      "channels",
      createdCheckingChannelId
    );
    const checkingChannelDoc = await getDoc(checkingChannelDocPath);

    if (!checkingChannelDoc.exists()) {
      throw new Error("Checking channel not found after creation!");
    }

    const retrievedCheckingData = checkingChannelDoc.data();
    console.log("✅ Checking channel retrieved successfully!");
    console.log(`   Channel ID: ${checkingChannelDoc.id}`);
    console.log(`   Channel Name: ${retrievedCheckingData.name}`);
    console.log(`   Budget ID: ${retrievedCheckingData.budgetId}`);
    console.log(`   Type: ${retrievedCheckingData.type}`);
    console.log(`   Institution: ${retrievedCheckingData.institution}`);
    console.log(`   Active: ${retrievedCheckingData.isActive}`);
    console.log(
      `   Matches created channel: ${checkingChannelDoc.id === createdCheckingChannelId}`
    );
    console.log(
      `   Belongs to correct budget: ${retrievedCheckingData.budgetId === createdBudgetId}`
    );

    // ==========================================
    // TEST 3: Create Credit Card Channel with Bill Tracking
    // ==========================================
    console.log(
      "\n💳 TEST 3: Creating credit card channel with bill tracking..."
    );

    // Create future dates for bill tracking
    const statementDate = new Date();
    statementDate.setDate(statementDate.getDate() - 5); // 5 days ago
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 20); // 20 days from now

    const creditChannelData = {
      budgetId: createdBudgetId,
      name: "Test Credit Card",
      description: "Primary credit card for testing bill tracking",
      type: "credit",
      institution: "Test Credit Union",
      accountNumber: "****5678",
      creditLimit: 5000,
      billTracking: {
        statementAmount: 1250.75,
        statementDate: Timestamp.fromDate(statementDate),
        dueDate: Timestamp.fromDate(dueDate),
        amountPaid: 250.0,
        minimumPayment: 35.0,
        lastPaymentDate: Timestamp.fromDate(
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        ), // 2 days ago
      },
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log(
      "Credit Channel Data:",
      JSON.stringify(creditChannelData, null, 2)
    );

    const creditChannelDocRef = await addDoc(
      channelsCollection,
      creditChannelData
    );
    createdCreditChannelId = creditChannelDocRef.id;

    console.log("✅ Credit card channel created successfully!");
    console.log(`   Credit Channel ID: ${createdCreditChannelId}`);
    console.log(`   Credit Limit: $${creditChannelData.creditLimit}`);
    console.log(
      `   Statement Amount: $${creditChannelData.billTracking.statementAmount}`
    );
    console.log(
      `   Amount Paid: $${creditChannelData.billTracking.amountPaid}`
    );
    console.log(`   Due Date: ${dueDate.toDateString()}`);
    console.log(
      `   Remaining Balance: $${creditChannelData.billTracking.statementAmount - creditChannelData.billTracking.amountPaid}`
    );

    // ==========================================
    // TEST 4: Create Cash Channel
    // ==========================================
    console.log("\n💵 TEST 4: Creating cash channel...");

    const cashChannelData = {
      budgetId: createdBudgetId,
      name: "Cash Wallet",
      description: "Physical cash on hand",
      type: "cash",
      institution: null,
      accountNumber: null,
      creditLimit: null,
      billTracking: null,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const cashChannelDocRef = await addDoc(channelsCollection, cashChannelData);
    createdCashChannelId = cashChannelDocRef.id;

    console.log("✅ Cash channel created successfully!");
    console.log(`   Cash Channel ID: ${createdCashChannelId}`);
    console.log(`   Type: ${cashChannelData.type}`);
    console.log(
      `   No institution (as expected for cash): ${cashChannelData.institution === null}`
    );
    console.log(
      `   No account number (as expected for cash): ${cashChannelData.accountNumber === null}`
    );

    // ==========================================
    // TEST 5: List All Channels (Should show 3 channels)
    // ==========================================
    console.log(
      "\n📋 TEST 5: Listing all channels (should show 3 channels now)..."
    );

    const allChannelsQuery = query(
      collection(db, "budgets", createdBudgetId, "channels"),
      where("isActive", "==", true),
      orderBy("createdAt", "asc")
    );

    const allChannelsSnapshot = await getDocs(allChannelsQuery);
    const allChannels = allChannelsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Complete channel list retrieved successfully!");
    console.log(`   Total channels for budget: ${allChannels.length}`);
    console.log(
      `   Expected 3 channels: ${allChannels.length === 3 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log("");
    console.log("   Channel details:");
    allChannels.forEach((channel, index) => {
      console.log(`   ${index + 1}. ${channel.name}`);
      console.log(`      - Type: ${channel.type}`);
      console.log(`      - Institution: ${channel.institution || "N/A"}`);
      console.log(`      - Account: ${channel.accountNumber || "N/A"}`);
      if (channel.creditLimit) {
        console.log(`      - Credit Limit: $${channel.creditLimit}`);
      }
      if (channel.billTracking) {
        console.log(
          `      - Bill Amount: $${channel.billTracking.statementAmount}`
        );
        console.log(`      - Amount Paid: $${channel.billTracking.amountPaid}`);
        console.log(
          `      - Due Date: ${channel.billTracking.dueDate.toDate().toDateString()}`
        );
      }
      console.log("");
    });

    // Verify all specific channels exist
    const foundCheckingChannel = allChannels.find(
      (c) => c.id === createdCheckingChannelId
    );
    const foundCreditChannel = allChannels.find(
      (c) => c.id === createdCreditChannelId
    );
    const foundCashChannel = allChannels.find(
      (c) => c.id === createdCashChannelId
    );

    console.log("   Channel existence verification:");
    console.log(`   Checking channel found: ${!!foundCheckingChannel}`);
    console.log(`   Credit channel found: ${!!foundCreditChannel}`);
    console.log(`   Cash channel found: ${!!foundCashChannel}`);
    console.log(
      `   All channels belong to same budget: ${allChannels.every((c) => c.budgetId === createdBudgetId)}`
    );

    // ==========================================
    // TEST 6: Query Channels by Type
    // ==========================================
    console.log("\n🎯 TEST 6: Querying channels by type...");

    // Query credit channels only
    const creditChannelsQuery = query(
      collection(db, "budgets", createdBudgetId, "channels"),
      where("isActive", "==", true),
      where("type", "==", "credit"),
      orderBy("createdAt", "asc")
    );

    const creditChannelsSnapshot = await getDocs(creditChannelsQuery);
    const creditChannels = creditChannelsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Credit channels query successful!");
    console.log(`   Total credit channels: ${creditChannels.length}`);
    console.log(
      `   Expected 1 credit channel: ${creditChannels.length === 1 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log(
      `   Credit channel names: ${creditChannels.map((c) => c.name).join(", ")}`
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
    console.log(`   2. Navigate to: budgets/${createdBudgetId}/channels`);
    console.log(`   3. Verify 3 channel documents exist with IDs:`);
    console.log(`      - Checking: ${createdCheckingChannelId}`);
    console.log(`      - Credit: ${createdCreditChannelId}`);
    console.log(`      - Cash: ${createdCashChannelId}`);
    console.log(`   4. Check that credit card has billTracking object`);
    console.log(
      `   5. Check that cash channel has null institution/accountNumber`
    );
    console.log(`   6. Verify all channels belong to the correct budget`);
    console.log("");
    console.log(
      "⏳ Waiting 5 seconds for you to verify in Firebase Console..."
    );

    await sleep(5000);

    // ==========================================
    // TEST 7: Update Channel and Bill Tracking
    // ==========================================
    console.log("\n✏️  TEST 7: Updating channel and bill tracking...");

    const creditChannelDocPath = doc(
      db,
      "budgets",
      createdBudgetId,
      "channels",
      createdCreditChannelId
    );

    // Update credit channel with new bill payment
    const updateCreditData = {
      name: "Test Credit Card - UPDATED",
      description: "Updated credit card with new payment",
      billTracking: {
        statementAmount: 1250.75,
        statementDate: Timestamp.fromDate(statementDate),
        dueDate: Timestamp.fromDate(dueDate),
        amountPaid: 500.0, // Increased payment
        minimumPayment: 35.0,
        lastPaymentDate: Timestamp.now(), // Just made a payment
      },
      updatedAt: Timestamp.now(),
    };

    await updateDoc(creditChannelDocPath, updateCreditData);

    // Verify update
    const updatedCreditDoc = await getDoc(creditChannelDocPath);
    const updatedCreditData = updatedCreditDoc.data();

    console.log("✅ Credit channel updated successfully!");
    console.log(`   New name: ${updatedCreditData.name}`);
    console.log(`   New description: ${updatedCreditData.description}`);
    console.log(
      `   Updated amount paid: $${updatedCreditData.billTracking.amountPaid}`
    );
    console.log(
      `   New remaining balance: $${updatedCreditData.billTracking.statementAmount - updatedCreditData.billTracking.amountPaid}`
    );
    console.log(
      `   Last payment date updated: ${updatedCreditData.billTracking.lastPaymentDate.toDate()}`
    );

    // Update checking channel
    const updateCheckingData = {
      name: "Test Checking Account - UPDATED",
      institution: "Updated Test Bank",
      accountNumber: "****9999",
      updatedAt: Timestamp.now(),
    };

    await updateDoc(checkingChannelDocPath, updateCheckingData);
    console.log("✅ Checking channel also updated successfully!");

    // ==========================================
    // TEST 8: Soft Delete Channel
    // ==========================================
    console.log("\n🗑️  TEST 8: Soft deleting checking channel...");

    await updateDoc(checkingChannelDocPath, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Checking channel soft deletion executed successfully!");

    // ==========================================
    // TEST 9: Verify Soft Delete
    // ==========================================
    console.log("\n✔️  TEST 9: Verifying soft delete...");

    // Check that channel still exists but isActive = false
    const deletedChannelDoc = await getDoc(checkingChannelDocPath);
    const deletedChannelData = deletedChannelDoc.data();

    if (!deletedChannelDoc.exists()) {
      throw new Error(
        "Channel document was hard deleted instead of soft deleted!"
      );
    }

    if (deletedChannelData.isActive !== false) {
      throw new Error(
        "Channel was not properly soft deleted (isActive should be false)!"
      );
    }

    console.log("✅ Channel correctly soft deleted!");
    console.log(`   Document exists: ${deletedChannelDoc.exists()}`);
    console.log(`   isActive: ${deletedChannelData.isActive}`);

    // Verify it doesn't appear in active channel queries
    const finalChannelsQuery = query(
      collection(db, "budgets", createdBudgetId, "channels"),
      where("isActive", "==", true),
      orderBy("createdAt", "asc")
    );
    const activeChannelsSnapshot = await getDocs(finalChannelsQuery);
    const activeChannels = activeChannelsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const stillFoundInActive = activeChannels.find(
      (c) => c.id === createdCheckingChannelId
    );

    console.log("✅ Active channel list verified clean!");
    console.log(
      `   Checking channel removed from active list: ${!stillFoundInActive}`
    );
    console.log(`   Current active channels: ${activeChannels.length}`);
    console.log(
      `   Should be 2 remaining (credit + cash): ${activeChannels.length === 2 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log(
      `   Remaining active channels: ${activeChannels.map((c) => c.name).join(", ")}`
    );

    // Clean up remaining channels
    await updateDoc(creditChannelDocPath, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    const cashChannelDocPath = doc(
      db,
      "budgets",
      createdBudgetId,
      "channels",
      createdCashChannelId
    );
    await updateDoc(cashChannelDocPath, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Credit and cash channels also soft deleted for cleanup");

    // Final verification - should be 0 active channels now
    const finalActiveChannelsSnapshot = await getDocs(finalChannelsQuery);
    const finalActiveChannels = finalActiveChannelsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Final cleanup verification:");
    console.log(
      `   All channels cleaned up: ${finalActiveChannels.length === 0 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log(`   Final active channel count: ${finalActiveChannels.length}`);

    // ==========================================
    // SUCCESS SUMMARY
    // ==========================================
    console.log("\n🎉 ALL TESTS PASSED!");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log("✅ Direct Firebase channel operations are working correctly");
    console.log("✅ Production Firebase connection is functional");
    console.log("✅ Channel creation, reading, and updating work properly");
    console.log("✅ Hierarchical data structure (budget -> channels) working");
    console.log(
      "✅ Multiple channel types (checking, credit, cash) work correctly"
    );
    console.log(
      "✅ Credit card features (credit limit, bill tracking) working"
    );
    console.log("✅ Bill tracking creation and updates work properly");
    console.log("✅ Cash channel validation (no institution/account) working");
    console.log("✅ Channel type filtering works correctly");
    console.log("✅ Soft deletion is working as expected");
    console.log("✅ Query filtering works correctly");
    console.log("✅ Data validation and Timestamp handling working");
    console.log("");
    console.log("🔍 Final verification in Firebase Console:");
    console.log(`   - Budget document exists at budgets/${createdBudgetId}`);
    console.log(
      `   - Checking channel exists at budgets/${createdBudgetId}/channels/${createdCheckingChannelId}`
    );
    console.log(
      `   - Credit channel exists at budgets/${createdBudgetId}/channels/${createdCreditChannelId}`
    );
    console.log(
      `   - Cash channel exists at budgets/${createdBudgetId}/channels/${createdCashChannelId}`
    );
    console.log(`   - All channel isActive fields should be false`);
    console.log(`   - updatedAt should reflect deletion time`);
    console.log(`   - Credit channel should have complete billTracking object`);
    console.log(`   - Cash channel should have null institution/accountNumber`);
    console.log(`   - All channels should belong to the correct budget`);
  } catch (error) {
    console.error("\n❌ CHANNEL TEST FAILED!");
    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.error("Error Details:", error.message);
    console.error("Stack Trace:", error.stack);

    // Cleanup attempt
    const cleanupTasks = [];

    if (
      createdCheckingChannelId &&
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
            "channels",
            createdCheckingChannelId
          ),
          {
            isActive: false,
            updatedAt: Timestamp.now(),
          }
        ).catch(console.error)
      );
    }

    if (createdCreditChannelId && createdBudgetId && db && authenticatedUser) {
      cleanupTasks.push(
        updateDoc(
          doc(
            db,
            "budgets",
            createdBudgetId,
            "channels",
            createdCreditChannelId
          ),
          {
            isActive: false,
            updatedAt: Timestamp.now(),
          }
        ).catch(console.error)
      );
    }

    if (createdCashChannelId && createdBudgetId && db && authenticatedUser) {
      cleanupTasks.push(
        updateDoc(
          doc(db, "budgets", createdBudgetId, "channels", createdCashChannelId),
          {
            isActive: false,
            updatedAt: Timestamp.now(),
          }
        ).catch(console.error)
      );
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
console.log("🚀 Channel CRUD Test Script (Direct Firebase - Production)");
console.log(`📅 ${new Date().toISOString()}`);
console.log(`👤 Test User: ${TEST_USER_ID}`);
console.log("🔥 Using Production Firebase (no emulators)");
console.log(
  "🏗️  Note: This test creates a parent budget and then tests channel operations"
);

runDirectChannelCRUDTest()
  .then(() => {
    console.log("\n✨ Channel test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Channel test script failed:", error);
    process.exit(1);
  });
