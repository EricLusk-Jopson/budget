import { firestoreHelpers, userDataHelpers, Timestamp } from "../firebase.js";
import type {
  Transaction,
  IncomeTransaction,
  ExpenseTransaction,
  TransferTransaction,
  CreateIncomeTransaction,
  CreateExpenseTransaction,
  CreateTransferTransaction,
  UpdateIncomeTransaction,
  UpdateExpenseTransaction,
  UpdateTransferTransaction,
} from "@budget/core";

/**
 * Helper function to convert transaction data to Firestore format
 */
const convertTransactionToFirestore = (transactionData: any) => {
  return {
    ...transactionData,
    date: Timestamp.fromDate(transactionData.date),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
};

/**
 * Helper function to convert Firestore data back to transaction format
 */
const convertTransactionFromFirestore = (doc: any) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    date: data.date?.toDate(),
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  };
};

export const transactionOperations = {
  /**
   * Create a new income transaction
   */
  async createIncomeTransaction(
    userId: string,
    budgetId: string,
    data: CreateIncomeTransaction
  ): Promise<IncomeTransaction> {
    try {
      const transactionData = convertTransactionToFirestore({
        type: "income",
        budgetId: data.budgetId,
        date: data.date,
        channelId: data.channelId,
        amount: data.amount,
        source: data.source,
        allocationBreakdown: data.allocationBreakdown,
        notes: data.notes || "",
      });

      const docRef = await firestoreHelpers.addDoc(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "transactions"
        ),
        transactionData
      );

      return {
        id: docRef.id,
        type: "income",
        budgetId: transactionData.budgetId,
        date: transactionData.date.toDate(),
        channelId: transactionData.channelId,
        amount: transactionData.amount,
        source: transactionData.source,
        allocationBreakdown: transactionData.allocationBreakdown,
        notes: transactionData.notes,
        createdAt: transactionData.createdAt.toDate(),
        updatedAt: transactionData.updatedAt.toDate(),
      } as IncomeTransaction;
    } catch (error) {
      console.error("Error creating income transaction:", error);
      throw new Error("Failed to create income transaction");
    }
  },

  /**
   * Create a new expense transaction
   */
  async createExpenseTransaction(
    userId: string,
    budgetId: string,
    data: CreateExpenseTransaction
  ): Promise<ExpenseTransaction> {
    try {
      const transactionData = convertTransactionToFirestore({
        type: "expense",
        budgetId: data.budgetId,
        date: data.date,
        channelId: data.channelId,
        amount: data.amount,
        category: data.category,
        allocationBreakdown: data.allocationBreakdown,
        notes: data.notes || "",
      });

      const docRef = await firestoreHelpers.addDoc(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "transactions"
        ),
        transactionData
      );

      return {
        id: docRef.id,
        type: "expense",
        budgetId: transactionData.budgetId,
        date: transactionData.date.toDate(),
        channelId: transactionData.channelId,
        amount: transactionData.amount,
        category: transactionData.category,
        allocationBreakdown: transactionData.allocationBreakdown,
        notes: transactionData.notes,
        createdAt: transactionData.createdAt.toDate(),
        updatedAt: transactionData.updatedAt.toDate(),
      } as ExpenseTransaction;
    } catch (error) {
      console.error("Error creating expense transaction:", error);
      throw new Error("Failed to create expense transaction");
    }
  },

  /**
   * Create a new transfer transaction
   */
  async createTransferTransaction(
    userId: string,
    budgetId: string,
    data: CreateTransferTransaction
  ): Promise<TransferTransaction> {
    try {
      const transactionData = convertTransactionToFirestore({
        type: "transfer",
        budgetId: data.budgetId,
        date: data.date,
        amount: data.amount,
        description: data.description,
        sourceChannelId: data.sourceChannelId,
        sourceAllocation: data.sourceAllocation,
        destinationChannelId: data.destinationChannelId,
        destinationAllocation: data.destinationAllocation,
        notes: data.notes || "",
      });

      const docRef = await firestoreHelpers.addDoc(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "transactions"
        ),
        transactionData
      );

      return {
        id: docRef.id,
        type: "transfer",
        budgetId: transactionData.budgetId,
        date: transactionData.date.toDate(),
        amount: transactionData.amount,
        description: transactionData.description,
        sourceChannelId: transactionData.sourceChannelId,
        sourceAllocation: transactionData.sourceAllocation,
        destinationChannelId: transactionData.destinationChannelId,
        destinationAllocation: transactionData.destinationAllocation,
        notes: transactionData.notes,
        createdAt: transactionData.createdAt.toDate(),
        updatedAt: transactionData.updatedAt.toDate(),
      } as TransferTransaction;
    } catch (error) {
      console.error("Error creating transfer transaction:", error);
      throw new Error("Failed to create transfer transaction");
    }
  },

  /**
   * Get a specific transaction by ID
   */
  async getTransaction(
    userId: string,
    budgetId: string,
    transactionId: string
  ): Promise<Transaction | null> {
    try {
      const transactionPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "transactions")}/${transactionId}`;
      const doc = await firestoreHelpers.getDoc(transactionPath);

      if (!doc.exists()) {
        return null;
      }

      return convertTransactionFromFirestore(doc) as Transaction;
    } catch (error) {
      console.error("Error getting transaction:", error);
      throw new Error("Failed to get transaction");
    }
  },

  /**
   * Get all transactions for a budget
   */
  async getAllTransactions(
    userId: string,
    budgetId: string,
    limit?: number
  ): Promise<Transaction[]> {
    try {
      const constraints = limit
        ? [
            firestoreHelpers.orderBy("date", "desc"),
            firestoreHelpers.orderBy("createdAt", "desc"),
            firestoreHelpers.limit(limit),
          ]
        : [
            firestoreHelpers.orderBy("date", "desc"),
            firestoreHelpers.orderBy("createdAt", "desc"),
          ];

      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "transactions"
        ),
        constraints
      );

      return snapshot.docs.map((doc) =>
        convertTransactionFromFirestore(doc)
      ) as Transaction[];
    } catch (error) {
      console.error("Error getting transactions:", error);
      throw new Error("Failed to get transactions");
    }
  },

  /**
   * Get transactions by type
   */
  async getTransactionsByType(
    userId: string,
    budgetId: string,
    transactionType: "income" | "expense" | "transfer",
    limit?: number
  ): Promise<Transaction[]> {
    try {
      const constraints = limit
        ? [
            firestoreHelpers.where("type", "==", transactionType),
            firestoreHelpers.orderBy("date", "desc"),
            firestoreHelpers.orderBy("createdAt", "desc"),
            firestoreHelpers.limit(limit),
          ]
        : [
            firestoreHelpers.where("type", "==", transactionType),
            firestoreHelpers.orderBy("date", "desc"),
            firestoreHelpers.orderBy("createdAt", "desc"),
          ];

      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "transactions"
        ),
        constraints
      );

      return snapshot.docs.map((doc) =>
        convertTransactionFromFirestore(doc)
      ) as Transaction[];
    } catch (error) {
      console.error("Error getting transactions by type:", error);
      throw new Error("Failed to get transactions by type");
    }
  },

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(
    userId: string,
    budgetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    try {
      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "transactions"
        ),
        [
          firestoreHelpers.where("date", ">=", Timestamp.fromDate(startDate)),
          firestoreHelpers.where("date", "<=", Timestamp.fromDate(endDate)),
          firestoreHelpers.orderBy("date", "desc"),
          firestoreHelpers.orderBy("createdAt", "desc"),
        ]
      );

      return snapshot.docs.map((doc) =>
        convertTransactionFromFirestore(doc)
      ) as Transaction[];
    } catch (error) {
      console.error("Error getting transactions by date range:", error);
      throw new Error("Failed to get transactions by date range");
    }
  },

  /**
   * Get transactions by channel
   */
  async getTransactionsByChannel(
    userId: string,
    budgetId: string,
    channelId: string
  ): Promise<Transaction[]> {
    try {
      // Query for transactions where channelId matches (income/expense)
      const directSnapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "transactions"
        ),
        [
          firestoreHelpers.where("channelId", "==", channelId),
          firestoreHelpers.orderBy("date", "desc"),
        ]
      );

      // Query for transfers where source channel matches
      const sourceSnapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "transactions"
        ),
        [
          firestoreHelpers.where("sourceChannelId", "==", channelId),
          firestoreHelpers.orderBy("date", "desc"),
        ]
      );

      // Query for transfers where destination channel matches
      const destSnapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "transactions"
        ),
        [
          firestoreHelpers.where("destinationChannelId", "==", channelId),
          firestoreHelpers.orderBy("date", "desc"),
        ]
      );

      // Combine and deduplicate results
      const allDocs = [
        ...directSnapshot.docs,
        ...sourceSnapshot.docs,
        ...destSnapshot.docs,
      ];

      const uniqueDocs = allDocs.filter(
        (doc, index, arr) => arr.findIndex((d) => d.id === doc.id) === index
      );

      return uniqueDocs
        .map((doc) => convertTransactionFromFirestore(doc))
        .sort((a, b) => b.date.getTime() - a.date.getTime()) as Transaction[];
    } catch (error) {
      console.error("Error getting transactions by channel:", error);
      throw new Error("Failed to get transactions by channel");
    }
  },

  /**
   * Get transactions involving a specific pool (in allocation breakdown)
   */
  async getTransactionsByPool(
    userId: string,
    budgetId: string,
    poolId: string
  ): Promise<Transaction[]> {
    try {
      // This requires client-side filtering since Firestore can't query nested arrays efficiently
      const allTransactions = await this.getAllTransactions(userId, budgetId);

      return allTransactions.filter((transaction) => {
        // Check allocationBreakdown for income/expense
        if (transaction.type === "income" || transaction.type === "expense") {
          return transaction.allocationBreakdown.items.some(
            (item) => item.poolId === poolId
          );
        }

        // Check both source and destination allocations for transfers
        if (transaction.type === "transfer") {
          return (
            transaction.sourceAllocation.items.some(
              (item) => item.poolId === poolId
            ) ||
            transaction.destinationAllocation.items.some(
              (item) => item.poolId === poolId
            )
          );
        }

        return false;
      });
    } catch (error) {
      console.error("Error getting transactions by pool:", error);
      throw new Error("Failed to get transactions by pool");
    }
  },

  /**
   * Update an income transaction
   */
  async updateIncomeTransaction(
    userId: string,
    budgetId: string,
    transactionId: string,
    updates: UpdateIncomeTransaction
  ): Promise<IncomeTransaction> {
    try {
      const transactionPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "transactions")}/${transactionId}`;

      // Verify transaction exists and is income type
      const existingTransaction = await this.getTransaction(
        userId,
        budgetId,
        transactionId
      );
      if (!existingTransaction || existingTransaction.type !== "income") {
        throw new Error("Income transaction not found");
      }

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Convert date to Timestamp if provided
      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }

      await firestoreHelpers.updateDoc(transactionPath, updateData);

      // Return updated transaction
      const updatedTransaction = await this.getTransaction(
        userId,
        budgetId,
        transactionId
      );
      return updatedTransaction as IncomeTransaction;
    } catch (error) {
      console.error("Error updating income transaction:", error);
      throw new Error("Failed to update income transaction");
    }
  },

  /**
   * Update an expense transaction
   */
  async updateExpenseTransaction(
    userId: string,
    budgetId: string,
    transactionId: string,
    updates: UpdateExpenseTransaction
  ): Promise<ExpenseTransaction> {
    try {
      const transactionPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "transactions")}/${transactionId}`;

      // Verify transaction exists and is expense type
      const existingTransaction = await this.getTransaction(
        userId,
        budgetId,
        transactionId
      );
      if (!existingTransaction || existingTransaction.type !== "expense") {
        throw new Error("Expense transaction not found");
      }

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Convert date to Timestamp if provided
      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }

      await firestoreHelpers.updateDoc(transactionPath, updateData);

      // Return updated transaction
      const updatedTransaction = await this.getTransaction(
        userId,
        budgetId,
        transactionId
      );
      return updatedTransaction as ExpenseTransaction;
    } catch (error) {
      console.error("Error updating expense transaction:", error);
      throw new Error("Failed to update expense transaction");
    }
  },

  /**
   * Update a transfer transaction
   */
  async updateTransferTransaction(
    userId: string,
    budgetId: string,
    transactionId: string,
    updates: UpdateTransferTransaction
  ): Promise<TransferTransaction> {
    try {
      const transactionPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "transactions")}/${transactionId}`;

      // Verify transaction exists and is transfer type
      const existingTransaction = await this.getTransaction(
        userId,
        budgetId,
        transactionId
      );
      if (!existingTransaction || existingTransaction.type !== "transfer") {
        throw new Error("Transfer transaction not found");
      }

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Convert date to Timestamp if provided
      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }

      await firestoreHelpers.updateDoc(transactionPath, updateData);

      // Return updated transaction
      const updatedTransaction = await this.getTransaction(
        userId,
        budgetId,
        transactionId
      );
      return updatedTransaction as TransferTransaction;
    } catch (error) {
      console.error("Error updating transfer transaction:", error);
      throw new Error("Failed to update transfer transaction");
    }
  },

  /**
   * Delete a transaction
   */
  async deleteTransaction(
    userId: string,
    budgetId: string,
    transactionId: string
  ): Promise<void> {
    try {
      const transactionPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "transactions")}/${transactionId}`;
      await firestoreHelpers.deleteDoc(transactionPath);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw new Error("Failed to delete transaction");
    }
  },

  /**
   * Get transaction summary for a date range
   */
  async getTransactionSummary(
    userId: string,
    budgetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    totalTransfers: number;
    netChange: number;
    transactionCount: number;
  }> {
    try {
      const transactions = await this.getTransactionsByDateRange(
        userId,
        budgetId,
        startDate,
        endDate
      );

      let totalIncome = 0;
      let totalExpenses = 0;
      let totalTransfers = 0;

      transactions.forEach((transaction) => {
        switch (transaction.type) {
          case "income":
            totalIncome += transaction.amount;
            break;
          case "expense":
            totalExpenses += transaction.amount;
            break;
          case "transfer":
            totalTransfers += transaction.amount;
            break;
        }
      });

      return {
        totalIncome,
        totalExpenses,
        totalTransfers,
        netChange: totalIncome - totalExpenses,
        transactionCount: transactions.length,
      };
    } catch (error) {
      console.error("Error getting transaction summary:", error);
      throw new Error("Failed to get transaction summary");
    }
  },

  /**
   * Subscribe to transaction changes in real-time
   */
  onTransactionChange(
    userId: string,
    budgetId: string,
    transactionId: string,
    callback: (transaction: Transaction | null) => void
  ) {
    const transactionPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "transactions")}/${transactionId}`;

    return firestoreHelpers.onDocSnapshot(transactionPath, (doc) => {
      if (!doc.exists()) {
        callback(null);
        return;
      }

      callback(convertTransactionFromFirestore(doc) as Transaction);
    });
  },

  /**
   * Subscribe to budget's transactions list in real-time
   */
  onTransactionsChange(
    userId: string,
    budgetId: string,
    callback: (transactions: Transaction[]) => void,
    limit?: number
  ) {
    const transactionsPath = userDataHelpers.getBudgetSubcollectionPath(
      userId,
      budgetId,
      "transactions"
    );

    const constraints = limit
      ? [
          firestoreHelpers.orderBy("date", "desc"),
          firestoreHelpers.orderBy("createdAt", "desc"),
          firestoreHelpers.limit(limit),
        ]
      : [
          firestoreHelpers.orderBy("date", "desc"),
          firestoreHelpers.orderBy("createdAt", "desc"),
        ];

    return firestoreHelpers.onCollectionSnapshot(
      transactionsPath,
      (docs) => {
        const transactions = docs.map((doc) =>
          convertTransactionFromFirestore(doc)
        ) as Transaction[];
        callback(transactions);
      },
      constraints
    );
  },

  /**
   * Subscribe to transactions by type in real-time
   */
  onTransactionsByTypeChange(
    userId: string,
    budgetId: string,
    transactionType: "income" | "expense" | "transfer",
    callback: (transactions: Transaction[]) => void,
    limit?: number
  ) {
    const transactionsPath = userDataHelpers.getBudgetSubcollectionPath(
      userId,
      budgetId,
      "transactions"
    );

    const constraints = limit
      ? [
          firestoreHelpers.where("type", "==", transactionType),
          firestoreHelpers.orderBy("date", "desc"),
          firestoreHelpers.orderBy("createdAt", "desc"),
          firestoreHelpers.limit(limit),
        ]
      : [
          firestoreHelpers.where("type", "==", transactionType),
          firestoreHelpers.orderBy("date", "desc"),
          firestoreHelpers.orderBy("createdAt", "desc"),
        ];

    return firestoreHelpers.onCollectionSnapshot(
      transactionsPath,
      (docs) => {
        const transactions = docs.map((doc) =>
          convertTransactionFromFirestore(doc)
        ) as Transaction[];
        callback(transactions);
      },
      constraints
    );
  },
};
