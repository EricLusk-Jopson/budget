import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../src/firebase.js";

async function testBalanceCalculation() {
  try {
    console.log("🧪 Testing automatic balance calculation...");

    // Add a new test transaction
    const newTransaction = {
      type: "expense",
      date: Timestamp.now(),
      channelId: "channel-credit-003",
      amount: 50.0,
      category: {
        categoryId: "cat-food-001",
        categoryName: "Food",
        subcategoryId: "subcat-groceries-001",
        subcategoryName: "Groceries",
      },
      allocationBreakdown: {
        items: [{ poolId: "pool-groceries-002", amount: 50.0 }],
        totalAmount: 50.0,
      },
      notes: "Test transaction - should trigger Cloud Function",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log("📝 Adding test transaction...");
    const docRef = await addDoc(
      collection(db, "budgets/test-budget-456/transactions"),
      newTransaction
    );

    console.log("✅ Test transaction created with ID:", docRef.id);
    console.log("⏱️  Cloud Function should trigger automatically...");
    console.log("📊 Check Firebase Console → Functions tab for execution logs");
    console.log(
      "📊 Check Firestore → balances collection for new/updated snapshot"
    );
  } catch (error) {
    console.error("❌ Error creating test transaction:", error);
  }
}

testBalanceCalculation();
