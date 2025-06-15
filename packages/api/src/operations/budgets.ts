import { firestoreHelpers, userDataHelpers, Timestamp } from "../firebase";
import type { Budget, CreateBudget, UpdateBudget } from "@budget/core";

export const budgetOperations = {
  /**
   * Create a new budget for a user
   */
  async createBudget(userId: string, data: CreateBudget): Promise<Budget> {
    try {
      const budgetData = {
        name: data.name,
        description: data.description || "",
        currency: data.currency || "USD",
        ownerId: data.ownerId,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await firestoreHelpers.addDoc(
        userDataHelpers.getUserBudgetsPath(userId),
        budgetData
      );

      return {
        id: docRef.id,
        ...budgetData,
      } as Budget;
    } catch (error) {
      console.error("Error creating budget:", error);
      throw new Error("Failed to create budget");
    }
  },

  /**
   * Get a specific budget by ID
   */
  async getBudget(userId: string, budgetId: string): Promise<Budget | null> {
    try {
      const doc = await firestoreHelpers.getDoc(
        userDataHelpers.getUserBudgetPath(userId, budgetId)
      );

      if (!doc.exists()) {
        return null;
      }

      const data = doc.data();
      if (!data?.isActive) {
        return null; // Treat inactive budgets as not found
      }

      return {
        id: doc.id,
        ...data,
      } as Budget;
    } catch (error) {
      console.error("Error getting budget:", error);
      throw new Error("Failed to get budget");
    }
  },

  /**
   * Get all active budgets for a user
   */
  async getUserBudgets(userId: string): Promise<Budget[]> {
    try {
      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getUserBudgetsPath(userId),
        [
          firestoreHelpers.where("isActive", "==", true),
          firestoreHelpers.orderBy("createdAt", "desc"),
        ]
      );

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Budget[];
    } catch (error) {
      console.error("Error getting user budgets:", error);
      throw new Error("Failed to get user budgets");
    }
  },

  /**
   * Update budget metadata
   */
  async updateBudget(
    userId: string,
    budgetId: string,
    updates: UpdateBudget
  ): Promise<Budget> {
    try {
      const budgetPath = userDataHelpers.getUserBudgetPath(userId, budgetId);

      // First verify the budget exists and is active
      const existingBudget = await this.getBudget(userId, budgetId);
      if (!existingBudget) {
        throw new Error("Budget not found");
      }

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await firestoreHelpers.updateDoc(budgetPath, updateData);

      return {
        ...existingBudget,
        ...updateData,
      } as Budget;
    } catch (error) {
      console.error("Error updating budget:", error);
      throw new Error("Failed to update budget");
    }
  },

  /**
   * Soft delete a budget (set isActive to false)
   */
  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    try {
      const budgetPath = userDataHelpers.getUserBudgetPath(userId, budgetId);

      await firestoreHelpers.updateDoc(budgetPath, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error deleting budget:", error);
      throw new Error("Failed to delete budget");
    }
  },

  /**
   * Subscribe to budget changes in real-time
   */
  onBudgetChange(
    userId: string,
    budgetId: string,
    callback: (budget: Budget | null) => void
  ) {
    const budgetPath = userDataHelpers.getUserBudgetPath(userId, budgetId);

    return firestoreHelpers.onDocSnapshot(budgetPath, (doc) => {
      if (!doc.exists()) {
        callback(null);
        return;
      }

      const data = doc.data();
      if (!data?.isActive) {
        callback(null);
        return;
      }

      callback({
        id: doc.id,
        ...data,
      } as Budget);
    });
  },

  /**
   * Subscribe to user's budgets list in real-time
   */
  onUserBudgetsChange(userId: string, callback: (budgets: Budget[]) => void) {
    const budgetsPath = userDataHelpers.getUserBudgetsPath(userId);

    return firestoreHelpers.onCollectionSnapshot(
      budgetsPath,
      (docs) => {
        const budgets = docs
          .filter((doc) => doc.isActive)
          .map((doc) => ({
            id: doc.id,
            ...doc,
          })) as Budget[];

        callback(budgets);
      },
      [
        firestoreHelpers.where("isActive", "==", true),
        firestoreHelpers.orderBy("createdAt", "desc"),
      ]
    );
  },
};
