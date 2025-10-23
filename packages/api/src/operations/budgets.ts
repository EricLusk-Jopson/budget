import { firestoreHelpers, userDataHelpers, Timestamp } from "../firebase.js";
import type { Budget, CreateBudget, UpdateBudget } from "@budget/core";

const { getBudgetsPath, getBudgetPath } = userDataHelpers;

export const budgetOperations = {
  /**
   * Create a new budget for a user
   */
  async createBudget(userId: string, data: CreateBudget): Promise<Budget> {
    try {
      const budgetData = {
        name: data.name,
        description: data.description || "",
        currency: data.currency || "CAD",
        ownerId: data.ownerId,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await firestoreHelpers.addDoc(
        getBudgetsPath(),
        budgetData
      );

      return {
        id: docRef.id,
        name: budgetData.name,
        description: budgetData.description,
        currency: budgetData.currency,
        ownerId: budgetData.ownerId,
        isActive: budgetData.isActive,
        createdAt: budgetData.createdAt.toDate(),
        updatedAt: budgetData.updatedAt.toDate(),
      } as Budget;
    } catch (error) {
      console.error("Error creating budget:", error);
      throw new Error("Failed to create budget");
    }
  },

  /**
   * Get a specific budget by ID
   */
  async getBudget(budgetId: string): Promise<Budget | null> {
    try {
      const doc = await firestoreHelpers.getDoc(getBudgetPath(budgetId));

      if (!doc.exists()) {
        return null;
      }

      const data = doc.data();
      if (!data?.isActive) {
        return null; // Treat inactive budgets as not found
      }

      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        currency: data.currency,
        ownerId: data.ownerId,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
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
      const snapshot = await firestoreHelpers.getDocs("budgets", [
        firestoreHelpers.where("isActive", "==", true),
        firestoreHelpers.orderBy("createdAt", "desc"),
      ]);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          currency: data.currency,
          ownerId: data.ownerId,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as Budget[];
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
      // First verify the budget exists and is active
      const existingBudget = await this.getBudget(budgetId);
      if (!existingBudget) {
        throw new Error("Budget not found");
      }

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await firestoreHelpers.updateDoc(getBudgetPath(budgetId), updateData);

      return {
        id: existingBudget.id,
        name: updateData.name || existingBudget.name,
        description:
          updateData.description !== undefined
            ? updateData.description
            : existingBudget.description,
        currency: updateData.currency || existingBudget.currency,
        ownerId: existingBudget.ownerId,
        isActive: existingBudget.isActive,
        createdAt: existingBudget.createdAt,
        updatedAt: updateData.updatedAt.toDate(),
      } as Budget;
    } catch (error) {
      console.error("Error updating budget:", error);
      throw new Error("Failed to update budget");
    }
  },

  /**
   * Soft delete a budget (set isActive to false)
   */
  async deleteBudget(budgetId: string): Promise<void> {
    try {
      await firestoreHelpers.updateDoc(getBudgetPath(budgetId), {
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
  onBudgetChange(budgetId: string, callback: (budget: Budget | null) => void) {
    return firestoreHelpers.onDocSnapshot(getBudgetPath(budgetId), (doc) => {
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
        name: data.name,
        description: data.description,
        currency: data.currency,
        ownerId: data.ownerId,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Budget);
    });
  },

  /**
   * Subscribe to user's budgets list in real-time
   */
  onUserBudgetsChange(callback: (budgets: Budget[]) => void) {
    return firestoreHelpers.onCollectionSnapshot(
      getBudgetsPath(),
      (docs) => {
        const budgets = docs
          .filter((doc) => doc.isActive)
          .map((doc) => ({
            id: doc.id,
            name: doc.name,
            description: doc.description,
            currency: doc.currency,
            ownerId: doc.ownerId,
            isActive: doc.isActive,
            createdAt: doc.createdAt?.toDate(),
            updatedAt: doc.updatedAt?.toDate(),
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
