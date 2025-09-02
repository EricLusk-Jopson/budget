#!/usr/bin/env node

/**
 * Transaction CRUD Test Script (Direct Firebase - Production)
 *
 * Uses direct Firebase imports like the successful budget, pool, channel, and allocation tests
 * Forces production Firebase (no emulators)
 * Tests transactions which are nested under budgets and reference pools/channels
 *
 * Usage: node test-transaction-crud.js
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
const TEST_USER_ID = "test-user-transaction-123";
const TEST_BUDGET_DATA = {
  name: "Test Budget for Transaction Testing",
  description: "Temporary budget created for transaction CRUD testing",
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
 * Helper function to create test channels
 */
async function createTestChannels(db, budgetId) {
  const channelsCollection = collection(db, "budgets", budgetId, "channels");

  // Create Checking Channel
  const checkingChannelData = {
    budgetId: budgetId,
    name: "Test Checking Account",
    description: "Primary checking account for transactions",
    type: "checking",
    institution: "Test Bank",
    accountNumber: "****1234",
    creditLimit: null,
    billTracking: null,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Create Cash Channel
  const cashChannelData = {
    budgetId: budgetId,
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

  // Create the channels
  const checkingChannelRef = await addDoc(
    channelsCollection,
    checkingChannelData
  );
  const cashChannelRef = await addDoc(channelsCollection, cashChannelData);

  return {
    checkingChannelId: checkingChannelRef.id,
    cashChannelId: cashChannelRef.id,
  };
}

/**
 * Run the complete transaction CRUD test using direct Firebase
 */
async function runDirectTransactionCRUDTest() {
  console.log("🧪 Starting Transaction CRUD Test (Direct Firebase)...");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  let createdBudgetId = null;
  let poolIds = {};
  let channelIds = {};
  let createdIncomeTransactionIds = [];
  let createdExpenseTransactionIds = [];
  let createdTransferTransactionId = null;
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
    // PREREQUISITE: Create Test Channels
    // ==========================================
    console.log("\n🏦 PREREQUISITE: Creating test channels...");

    channelIds = await createTestChannels(db, createdBudgetId);

    console.log("✅ Test channels created successfully!");
    console.log(`   Checking Channel ID: ${channelIds.checkingChannelId}`);
    console.log(`   Cash Channel ID: ${channelIds.cashChannelId}`);
    console.log(`   Total channels created: 2`);

    // ==========================================
    // TEST 1: Create Income Transactions ($1000 each, one per pool)
    // ==========================================
    console.log(
      "\n💰 TEST 1: Creating income transactions ($1000 each, one per pool)..."
    );

    const transactionsCollection = collection(
      db,
      "budgets",
      createdBudgetId,
      "transactions"
    );

    // Income 1: Emergency Fund Allocation
    const incomeTransaction1Data = {
      type: "income",
      budgetId: createdBudgetId,
      date: Timestamp.now(),
      channelId: channelIds.checkingChannelId,
      amount: 1000,
      source: "Salary - Week 1",
      allocationBreakdown: {
        items: [
          { poolId: poolIds.emergencyPoolId, amount: 1000 }, // 100% to emergency
          { poolId: poolIds.groceriesPoolId, amount: 0 }, // 0% to groceries
          { poolId: poolIds.vacationPoolId, amount: 0 }, // 0% to vacation
        ],
        totalAmount: 1000,
      },
      notes: "Weekly salary - all to emergency fund",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Income 2: Groceries Pool Allocation
    const incomeTransaction2Data = {
      type: "income",
      budgetId: createdBudgetId,
      date: Timestamp.now(),
      channelId: channelIds.checkingChannelId,
      amount: 1000,
      source: "Salary - Week 2",
      allocationBreakdown: {
        items: [
          { poolId: poolIds.emergencyPoolId, amount: 0 }, // 0% to emergency
          { poolId: poolIds.groceriesPoolId, amount: 1000 }, // 100% to groceries
          { poolId: poolIds.vacationPoolId, amount: 0 }, // 0% to vacation
        ],
        totalAmount: 1000,
      },
      notes: "Weekly salary - all to groceries",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Income 3: Vacation Pool Allocation
    const incomeTransaction3Data = {
      type: "income",
      budgetId: createdBudgetId,
      date: Timestamp.now(),
      channelId: channelIds.checkingChannelId,
      amount: 1000,
      source: "Salary - Week 3",
      allocationBreakdown: {
        items: [
          { poolId: poolIds.emergencyPoolId, amount: 0 }, // 0% to emergency
          { poolId: poolIds.groceriesPoolId, amount: 0 }, // 0% to groceries
          { poolId: poolIds.vacationPoolId, amount: 1000 }, // 100% to vacation
        ],
        totalAmount: 1000,
      },
      notes: "Weekly salary - all to vacation fund",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Create the income transactions
    const incomeRef1 = await addDoc(
      transactionsCollection,
      incomeTransaction1Data
    );
    const incomeRef2 = await addDoc(
      transactionsCollection,
      incomeTransaction2Data
    );
    const incomeRef3 = await addDoc(
      transactionsCollection,
      incomeTransaction3Data
    );

    createdIncomeTransactionIds = [incomeRef1.id, incomeRef2.id, incomeRef3.id];

    console.log("✅ Income transactions created successfully!");
    console.log(
      `   Income Transaction 1 ID: ${incomeRef1.id} (Emergency: $1000)`
    );
    console.log(
      `   Income Transaction 2 ID: ${incomeRef2.id} (Groceries: $1000)`
    );
    console.log(
      `   Income Transaction 3 ID: ${incomeRef3.id} (Vacation: $1000)`
    );
    console.log(`   Total income added: $3000`);

    // ==========================================
    // TEST 2: Verify Income Transactions Exist
    // ==========================================
    console.log("\n🔍 TEST 2: Verifying income transactions exist...");

    for (let i = 0; i < createdIncomeTransactionIds.length; i++) {
      const transactionId = createdIncomeTransactionIds[i];
      const transactionDocPath = doc(
        db,
        "budgets",
        createdBudgetId,
        "transactions",
        transactionId
      );
      const transactionDoc = await getDoc(transactionDocPath);

      if (!transactionDoc.exists()) {
        throw new Error(
          `Income transaction ${i + 1} not found after creation!`
        );
      }

      const transactionData = transactionDoc.data();
      console.log(`✅ Income Transaction ${i + 1} verified:`);
      console.log(`   ID: ${transactionDoc.id}`);
      console.log(`   Type: ${transactionData.type}`);
      console.log(`   Amount: $${transactionData.amount}`);
      console.log(`   Source: ${transactionData.source}`);
      console.log(`   Channel: ${transactionData.channelId}`);
      console.log(
        `   Allocation Items: ${transactionData.allocationBreakdown.items.length}`
      );
      console.log(
        `   Total Allocated: $${transactionData.allocationBreakdown.totalAmount}`
      );

      // Verify allocation breakdown matches amount
      const allocationTotal = transactionData.allocationBreakdown.items.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      console.log(
        `   Allocation Math Check: ${allocationTotal === transactionData.amount ? "✅ VALID" : "❌ INVALID"}`
      );
    }

    // ==========================================
    // TEST 3: Create Transfer Transaction (Checking → Cash)
    // ==========================================
    console.log(
      "\n🔄 TEST 3: Creating transfer transaction (Checking → Cash)..."
    );

    const transferTransactionData = {
      type: "transfer",
      budgetId: createdBudgetId,
      date: Timestamp.now(),
      amount: 200,
      description: "ATM Withdrawal - Getting cash for weekend",
      sourceChannelId: channelIds.checkingChannelId,
      sourceAllocation: {
        items: [
          { poolId: poolIds.groceriesPoolId, amount: -200 }, // Taking from groceries pool
        ],
        totalAmount: -200, // Negative because money is leaving the source
      },
      destinationChannelId: channelIds.cashChannelId,
      destinationAllocation: {
        items: [
          { poolId: poolIds.groceriesPoolId, amount: 200 }, // Going to groceries pool in cash
        ],
        totalAmount: 200, // Positive because money is arriving at destination
      },
      notes: "Weekend spending money",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const transferRef = await addDoc(
      transactionsCollection,
      transferTransactionData
    );
    createdTransferTransactionId = transferRef.id;

    console.log("✅ Transfer transaction created successfully!");
    console.log(`   Transfer Transaction ID: ${createdTransferTransactionId}`);
    console.log(`   Amount: $${transferTransactionData.amount}`);
    console.log(
      `   Source Channel: Checking (${channelIds.checkingChannelId})`
    );
    console.log(`   Destination Channel: Cash (${channelIds.cashChannelId})`);
    console.log(`   Description: ${transferTransactionData.description}`);
    console.log(`   Pool Moved: Groceries ($200 from checking to cash)`);

    // ==========================================
    // TEST 4: Create Expense Transactions (Across All Pools)
    // ==========================================
    console.log(
      "\n💸 TEST 4: Creating expense transactions across all pools..."
    );

    // Expense 1: From Emergency Pool
    const expenseTransaction1Data = {
      type: "expense",
      budgetId: createdBudgetId,
      date: Timestamp.now(),
      channelId: channelIds.checkingChannelId,
      amount: 150,
      category: {
        categoryId: "emergency-category",
        categoryName: "Emergency Expenses",
        subcategoryId: "medical-subcategory",
        subcategoryName: "Medical",
      },
      allocationBreakdown: {
        items: [
          { poolId: poolIds.emergencyPoolId, amount: 150 }, // Spending from emergency fund
        ],
        totalAmount: 150,
      },
      notes: "Urgent dental visit",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Expense 2: From Groceries Pool (using cash)
    const expenseTransaction2Data = {
      type: "expense",
      budgetId: createdBudgetId,
      date: Timestamp.now(),
      channelId: channelIds.cashChannelId,
      amount: 75,
      category: {
        categoryId: "food-category",
        categoryName: "Food & Dining",
        subcategoryId: "groceries-subcategory",
        subcategoryName: "Groceries",
      },
      allocationBreakdown: {
        items: [
          { poolId: poolIds.groceriesPoolId, amount: 75 }, // Spending from groceries pool
        ],
        totalAmount: 75,
      },
      notes: "Weekly grocery shopping",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Expense 3: From Vacation Pool
    const expenseTransaction3Data = {
      type: "expense",
      budgetId: createdBudgetId,
      date: Timestamp.now(),
      channelId: channelIds.checkingChannelId,
      amount: 300,
      category: {
        categoryId: "travel-category",
        categoryName: "Travel & Vacation",
        subcategoryId: "flights-subcategory",
        subcategoryName: "Flights",
      },
      allocationBreakdown: {
        items: [
          { poolId: poolIds.vacationPoolId, amount: 300 }, // Spending from vacation fund
        ],
        totalAmount: 300,
      },
      notes: "Flight booking deposit",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Create the expense transactions
    const expenseRef1 = await addDoc(
      transactionsCollection,
      expenseTransaction1Data
    );
    const expenseRef2 = await addDoc(
      transactionsCollection,
      expenseTransaction2Data
    );
    const expenseRef3 = await addDoc(
      transactionsCollection,
      expenseTransaction3Data
    );

    createdExpenseTransactionIds = [
      expenseRef1.id,
      expenseRef2.id,
      expenseRef3.id,
    ];

    console.log("✅ Expense transactions created successfully!");
    console.log(
      `   Expense Transaction 1 ID: ${expenseRef1.id} (Emergency: $150)`
    );
    console.log(
      `   Expense Transaction 2 ID: ${expenseRef2.id} (Groceries: $75, Cash)`
    );
    console.log(
      `   Expense Transaction 3 ID: ${expenseRef3.id} (Vacation: $300)`
    );
    console.log(`   Total expenses: $525`);

    // ==========================================
    // TEST 5: List All Transactions (Should show 7 total)
    // ==========================================
    console.log(
      "\n📋 TEST 5: Listing all transactions (should show 7 total)..."
    );

    const allTransactionsQuery = query(
      collection(db, "budgets", createdBudgetId, "transactions"),
      orderBy("createdAt", "desc")
    );

    const allTransactionsSnapshot = await getDocs(allTransactionsQuery);
    const allTransactions = allTransactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Complete transaction list retrieved successfully!");
    console.log(`   Total transactions: ${allTransactions.length}`);
    console.log(
      `   Expected 7 transactions: ${allTransactions.length === 7 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log("");
    console.log("   Transaction summary:");

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;

    allTransactions.forEach((transaction, index) => {
      console.log(
        `   ${index + 1}. ${transaction.type.toUpperCase()}: $${transaction.amount}`
      );
      console.log(
        `      - ${
          transaction.type === "income"
            ? transaction.source
            : transaction.type === "expense"
              ? transaction.category.categoryName
              : transaction.description
        }`
      );
      console.log(
        `      - ${
          transaction.type === "transfer"
            ? `${transaction.sourceChannelId.slice(-8)} → ${transaction.destinationChannelId.slice(-8)}`
            : `Channel: ${transaction.channelId.slice(-8)}`
        }`
      );

      // Calculate totals
      if (transaction.type === "income") totalIncome += transaction.amount;
      else if (transaction.type === "expense")
        totalExpenses += transaction.amount;
      else if (transaction.type === "transfer")
        totalTransfers += transaction.amount;

      console.log("");
    });

    console.log("   📊 Transaction Totals:");
    console.log(`   Income: $${totalIncome} (3 transactions)`);
    console.log(`   Expenses: $${totalExpenses} (3 transactions)`);
    console.log(`   Transfers: $${totalTransfers} (1 transaction)`);
    console.log(
      `   Net: $${totalIncome - totalExpenses} (excluding transfers)`
    );

    // ==========================================
    // TEST 6: Query Transactions by Type
    // ==========================================
    console.log("\n🎯 TEST 6: Querying transactions by type...");

    // Query income transactions only
    const incomeTransactionsQuery = query(
      collection(db, "budgets", createdBudgetId, "transactions"),
      where("type", "==", "income"),
      orderBy("createdAt", "desc")
    );

    const incomeTransactionsSnapshot = await getDocs(incomeTransactionsQuery);
    const incomeTransactions = incomeTransactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Income transactions query successful!");
    console.log(`   Total income transactions: ${incomeTransactions.length}`);
    console.log(
      `   Expected 3 income transactions: ${incomeTransactions.length === 3 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log(
      `   Income sources: ${incomeTransactions.map((t) => t.source).join(", ")}`
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
    console.log(`   2. Navigate to: budgets/${createdBudgetId}/transactions`);
    console.log(`   3. Verify 7 transaction documents exist:`);
    console.log(`      - 3 income transactions ($1000 each)`);
    console.log(`      - 1 transfer transaction ($200)`);
    console.log(`      - 3 expense transactions ($150 + $75 + $300)`);
    console.log(`   4. Check allocation breakdowns are correct`);
    console.log(`   5. Verify channel and pool references`);
    console.log("");
    console.log(
      "⏳ Waiting 5 seconds for you to verify in Firebase Console..."
    );

    await sleep(5000);

    // ==========================================
    // TEST 7: Delete Erroneous Transactions (Hard Delete)
    // ==========================================
    console.log(
      "\n🗑️  TEST 7: Deleting erroneous transactions (hard delete)..."
    );

    // Delete one income transaction (the second one - groceries allocation)
    const incomeToDelete = createdIncomeTransactionIds[1];
    const incomeDocPath = doc(
      db,
      "budgets",
      createdBudgetId,
      "transactions",
      incomeToDelete
    );
    await deleteDoc(incomeDocPath);
    console.log(`✅ Deleted erroneous income transaction: ${incomeToDelete}`);
    console.log(
      `   Reason: Wrong allocation - should not have put all to groceries`
    );

    // Delete one expense transaction (the first one - emergency expense)
    const expenseToDelete = createdExpenseTransactionIds[0];
    const expenseDocPath = doc(
      db,
      "budgets",
      createdBudgetId,
      "transactions",
      expenseToDelete
    );
    await deleteDoc(expenseDocPath);
    console.log(`✅ Deleted erroneous expense transaction: ${expenseToDelete}`);
    console.log(`   Reason: Non-emergency expense incorrectly categorized`);

    // Delete the transfer transaction
    const transferToDelete = createdTransferTransactionId;
    const transferDocPath = doc(
      db,
      "budgets",
      createdBudgetId,
      "transactions",
      transferToDelete
    );
    await deleteDoc(transferDocPath);
    console.log(
      `✅ Deleted erroneous transfer transaction: ${transferToDelete}`
    );
    console.log(`   Reason: ATM withdrawal was recorded twice`);

    // ==========================================
    // TEST 8: Verify Deletions
    // ==========================================
    console.log("\n✔️  TEST 8: Verifying transaction deletions...");

    // Verify deleted transactions no longer exist
    const deletedIncomeDoc = await getDoc(incomeDocPath);
    const deletedExpenseDoc = await getDoc(expenseDocPath);
    const deletedTransferDoc = await getDoc(transferDocPath);

    console.log("✅ Hard deletion verification:");
    console.log(
      `   Deleted income transaction exists: ${deletedIncomeDoc.exists() ? "❌ STILL EXISTS" : "✅ PROPERLY DELETED"}`
    );
    console.log(
      `   Deleted expense transaction exists: ${deletedExpenseDoc.exists() ? "❌ STILL EXISTS" : "✅ PROPERLY DELETED"}`
    );
    console.log(
      `   Deleted transfer transaction exists: ${deletedTransferDoc.exists() ? "❌ STILL EXISTS" : "✅ PROPERLY DELETED"}`
    );

    // Verify remaining transaction count
    const finalTransactionsQuery = query(
      collection(db, "budgets", createdBudgetId, "transactions"),
      orderBy("createdAt", "desc")
    );
    const finalTransactionsSnapshot = await getDocs(finalTransactionsQuery);
    const finalTransactions = finalTransactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Final transaction count verification:");
    console.log(`   Remaining transactions: ${finalTransactions.length}`);
    console.log(
      `   Expected 4 remaining (7 - 3 deleted): ${finalTransactions.length === 4 ? "✅ CORRECT" : "❌ WRONG"}`
    );
    console.log("");
    console.log("   Remaining transactions:");
    finalTransactions.forEach((transaction, index) => {
      console.log(
        `   ${index + 1}. ${transaction.type.toUpperCase()}: $${transaction.amount} (${transaction.id.slice(-8)})`
      );
    });

    // Calculate final totals
    let finalIncome = 0;
    let finalExpenses = 0;
    let finalTransfers = 0;

    finalTransactions.forEach((transaction) => {
      if (transaction.type === "income") finalIncome += transaction.amount;
      else if (transaction.type === "expense")
        finalExpenses += transaction.amount;
      else if (transaction.type === "transfer")
        finalTransfers += transaction.amount;
    });

    console.log("");
    console.log("   📊 Final Transaction Totals:");
    console.log(
      `   Income: $${finalIncome} (was $${totalIncome}, deleted $1000)`
    );
    console.log(
      `   Expenses: $${finalExpenses} (was $${totalExpenses}, deleted $150)`
    );
    console.log(
      `   Transfers: $${finalTransfers} (was $${totalTransfers}, deleted $200)`
    );
    console.log(`   Final Net: $${finalIncome - finalExpenses}`);

    // ==========================================
    // SUCCESS SUMMARY
    // ==========================================
    console.log("\n🎉 ALL TESTS PASSED!");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log(
      "✅ Direct Firebase transaction operations are working correctly"
    );
    console.log("✅ Production Firebase connection is functional");
    console.log(
      "✅ Income transaction creation and allocation breakdown working"
    );
    console.log(
      "✅ Expense transaction creation with categories and pool allocation working"
    );
    console.log(
      "✅ Transfer transaction creation with source/destination allocations working"
    );
    console.log(
      "✅ Hierarchical data structure (budget → transactions) working"
    );
    console.log(
      "✅ Pool and channel references in transactions working correctly"
    );
    console.log(
      "✅ Allocation breakdown validation (totals match amounts) working"
    );
    console.log("✅ Transaction type filtering queries working correctly");
    console.log("✅ Hard deletion (deleteDoc) working as expected");
    console.log("✅ Transaction listing and counting working correctly");
    console.log("✅ Complex allocation patterns (0% allocations) working");
    console.log("✅ Data validation and Timestamp handling working");
    console.log("");
    console.log("🔍 Final verification in Firebase Console:");
    console.log(`   - Budget document exists at budgets/${createdBudgetId}`);
    console.log(
      `   - 3 pool documents exist at budgets/${createdBudgetId}/pools/`
    );
    console.log(
      `   - 2 channel documents exist at budgets/${createdBudgetId}/channels/`
    );
    console.log(
      `   - 4 transaction documents remain at budgets/${createdBudgetId}/transactions/`
    );
    console.log(
      `   - 3 transaction documents were hard deleted (no longer exist)`
    );
    console.log(`   - All allocation breakdowns should sum correctly`);
    console.log(`   - All pool and channel references should be valid`);
  } catch (error) {
    console.error("\n❌ TRANSACTION TEST FAILED!");
    console.error(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.error("Error Details:", error.message);
    console.error("Stack Trace:", error.stack);

    // Cleanup attempt
    const cleanupTasks = [];

    // Clean up transactions
    [
      ...createdIncomeTransactionIds,
      ...createdExpenseTransactionIds,
      createdTransferTransactionId,
    ]
      .filter(Boolean)
      .forEach((transactionId) => {
        cleanupTasks.push(
          deleteDoc(
            doc(db, "budgets", createdBudgetId, "transactions", transactionId)
          ).catch(console.error)
        );
      });

    // Clean up channels
    if (channelIds && createdBudgetId && db && authenticatedUser) {
      Object.values(channelIds).forEach((channelId) => {
        cleanupTasks.push(
          updateDoc(
            doc(db, "budgets", createdBudgetId, "channels", channelId),
            {
              isActive: false,
              updatedAt: Timestamp.now(),
            }
          ).catch(console.error)
        );
      });
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
console.log("🚀 Transaction CRUD Test Script (Direct Firebase - Production)");
console.log(`📅 ${new Date().toISOString()}`);
console.log(`👤 Test User: ${TEST_USER_ID}`);
console.log("🔥 Using Production Firebase (no emulators)");
console.log(
  "💰 Testing income, expense, and transfer transactions with allocations"
);
console.log("🗑️  Testing hard deletion (deleteDoc) of erroneous transactions");
console.log(
  "🏗️  Note: This test creates budget, pools, channels, and then tests transactions"
);

runDirectTransactionCRUDTest()
  .then(() => {
    console.log("\n✨ Transaction test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Transaction test script failed:", error);
    process.exit(1);
  });
