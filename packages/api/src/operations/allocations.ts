import { firestoreHelpers, userDataHelpers, Timestamp } from "../firebase";
import type {
  AllocationStrategy,
  CreateAllocationStrategy,
  UpdateAllocationStrategy,
  PoolAllocation,
  AllocationDeviation,
} from "@budget/core";

export const allocationOperations = {
  /**
   * Create a new allocation strategy for a budget
   */
  async createAllocationStrategy(
    userId: string,
    budgetId: string,
    data: CreateAllocationStrategy
  ): Promise<AllocationStrategy> {
    try {
      const strategyData = {
        budgetId: data.budgetId,
        name: data.name,
        description: data.description || "",
        effectiveFrom: Timestamp.fromDate(data.effectiveFrom),
        allocations: data.allocations, // Array of {poolId, proportion}
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await firestoreHelpers.addDoc(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "allocationStrategies"
        ),
        strategyData
      );

      return {
        id: docRef.id,
        budgetId: strategyData.budgetId,
        name: strategyData.name,
        description: strategyData.description,
        effectiveFrom: strategyData.effectiveFrom.toDate(),
        allocations: strategyData.allocations,
        isActive: strategyData.isActive,
        createdAt: strategyData.createdAt.toDate(),
        updatedAt: strategyData.updatedAt.toDate(),
      } as AllocationStrategy;
    } catch (error) {
      console.error("Error creating allocation strategy:", error);
      throw new Error("Failed to create allocation strategy");
    }
  },

  /**
   * Get a specific allocation strategy by ID
   */
  async getAllocationStrategy(
    userId: string,
    budgetId: string,
    strategyId: string
  ): Promise<AllocationStrategy | null> {
    try {
      const strategyPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "allocationStrategies")}/${strategyId}`;
      const doc = await firestoreHelpers.getDoc(strategyPath);

      if (!doc.exists()) {
        return null;
      }

      const data = doc.data();
      if (!data?.isActive) {
        return null; // Treat inactive strategies as not found
      }

      return {
        id: doc.id,
        budgetId: data.budgetId,
        name: data.name,
        description: data.description,
        effectiveFrom: data.effectiveFrom?.toDate(),
        allocations: data.allocations,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as AllocationStrategy;
    } catch (error) {
      console.error("Error getting allocation strategy:", error);
      throw new Error("Failed to get allocation strategy");
    }
  },

  /**
   * Get the currently active allocation strategy for a budget
   */
  async getCurrentAllocationStrategy(
    userId: string,
    budgetId: string,
    asOfDate: Date = new Date()
  ): Promise<AllocationStrategy | null> {
    try {
      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "allocationStrategies"
        ),
        [
          firestoreHelpers.where("isActive", "==", true),
          firestoreHelpers.where(
            "effectiveFrom",
            "<=",
            Timestamp.fromDate(asOfDate)
          ),
          firestoreHelpers.orderBy("effectiveFrom", "desc"),
          firestoreHelpers.limit(1),
        ]
      );

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        budgetId: data.budgetId,
        name: data.name,
        description: data.description,
        effectiveFrom: data.effectiveFrom?.toDate(),
        allocations: data.allocations,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as AllocationStrategy;
    } catch (error) {
      console.error("Error getting current allocation strategy:", error);
      throw new Error("Failed to get current allocation strategy");
    }
  },

  /**
   * Get all allocation strategies for a budget
   */
  async getAllAllocationStrategies(
    userId: string,
    budgetId: string,
    includeInactive: boolean = false
  ): Promise<AllocationStrategy[]> {
    try {
      const constraints = includeInactive
        ? [firestoreHelpers.orderBy("effectiveFrom", "desc")]
        : [
            firestoreHelpers.where("isActive", "==", true),
            firestoreHelpers.orderBy("effectiveFrom", "desc"),
          ];

      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "allocationStrategies"
        ),
        constraints
      );

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          budgetId: data.budgetId,
          name: data.name,
          description: data.description,
          effectiveFrom: data.effectiveFrom?.toDate(),
          allocations: data.allocations,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as AllocationStrategy[];
    } catch (error) {
      console.error("Error getting allocation strategies:", error);
      throw new Error("Failed to get allocation strategies");
    }
  },

  /**
   * Get allocation strategies that were effective during a date range
   */
  async getAllocationStrategiesInDateRange(
    userId: string,
    budgetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AllocationStrategy[]> {
    try {
      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "allocationStrategies"
        ),
        [
          firestoreHelpers.where("isActive", "==", true),
          firestoreHelpers.where(
            "effectiveFrom",
            "<=",
            Timestamp.fromDate(endDate)
          ),
          firestoreHelpers.orderBy("effectiveFrom", "desc"),
        ]
      );

      // Filter client-side for strategies that were active during the range
      return snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            budgetId: data.budgetId,
            name: data.name,
            description: data.description,
            effectiveFrom: data.effectiveFrom?.toDate(),
            allocations: data.allocations,
            isActive: data.isActive,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as AllocationStrategy;
        })
        .filter((strategy) => {
          // Strategy was effective if it started before the end of our range
          return strategy.effectiveFrom <= endDate;
        });
    } catch (error) {
      console.error(
        "Error getting allocation strategies in date range:",
        error
      );
      throw new Error("Failed to get allocation strategies in date range");
    }
  },

  /**
   * Update allocation strategy data
   */
  async updateAllocationStrategy(
    userId: string,
    budgetId: string,
    strategyId: string,
    updates: UpdateAllocationStrategy
  ): Promise<AllocationStrategy> {
    try {
      const strategyPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "allocationStrategies")}/${strategyId}`;

      // First verify the strategy exists and is active
      const existingStrategy = await this.getAllocationStrategy(
        userId,
        budgetId,
        strategyId
      );
      if (!existingStrategy) {
        throw new Error("Allocation strategy not found");
      }

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Convert effectiveFrom to Timestamp if provided
      if (updates.effectiveFrom !== undefined) {
        updateData.effectiveFrom = Timestamp.fromDate(updates.effectiveFrom);
      }

      await firestoreHelpers.updateDoc(strategyPath, updateData);

      return {
        id: existingStrategy.id,
        budgetId: existingStrategy.budgetId,
        name: updateData.name || existingStrategy.name,
        description:
          updateData.description !== undefined
            ? updateData.description
            : existingStrategy.description,
        effectiveFrom: updateData.effectiveFrom
          ? updateData.effectiveFrom.toDate()
          : existingStrategy.effectiveFrom,
        allocations: updateData.allocations || existingStrategy.allocations,
        isActive:
          updateData.isActive !== undefined
            ? updateData.isActive
            : existingStrategy.isActive,
        createdAt: existingStrategy.createdAt,
        updatedAt: updateData.updatedAt.toDate(),
      } as AllocationStrategy;
    } catch (error) {
      console.error("Error updating allocation strategy:", error);
      throw new Error("Failed to update allocation strategy");
    }
  },

  /**
   * Activate an allocation strategy (set as current active strategy)
   */
  async activateAllocationStrategy(
    userId: string,
    budgetId: string,
    strategyId: string,
    effectiveDate: Date = new Date()
  ): Promise<AllocationStrategy> {
    try {
      const strategyPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "allocationStrategies")}/${strategyId}`;

      // Update the strategy to be active with new effective date
      const updateData = {
        isActive: true,
        effectiveFrom: Timestamp.fromDate(effectiveDate),
        updatedAt: Timestamp.now(),
      };

      await firestoreHelpers.updateDoc(strategyPath, updateData);

      // Return updated strategy
      const updatedStrategy = await this.getAllocationStrategy(
        userId,
        budgetId,
        strategyId
      );
      if (!updatedStrategy) {
        throw new Error("Strategy not found after activation");
      }

      return updatedStrategy;
    } catch (error) {
      console.error("Error activating allocation strategy:", error);
      throw new Error("Failed to activate allocation strategy");
    }
  },

  /**
   * Soft delete an allocation strategy (set isActive to false)
   */
  async deleteAllocationStrategy(
    userId: string,
    budgetId: string,
    strategyId: string
  ): Promise<void> {
    try {
      const strategyPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "allocationStrategies")}/${strategyId}`;

      await firestoreHelpers.updateDoc(strategyPath, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error deleting allocation strategy:", error);
      throw new Error("Failed to delete allocation strategy");
    }
  },

  /**
   * Reactivate a soft-deleted allocation strategy
   */
  async reactivateAllocationStrategy(
    userId: string,
    budgetId: string,
    strategyId: string
  ): Promise<AllocationStrategy> {
    try {
      const strategyPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "allocationStrategies")}/${strategyId}`;

      // Get the strategy including inactive ones
      const doc = await firestoreHelpers.getDoc(strategyPath);
      if (!doc.exists()) {
        throw new Error("Allocation strategy not found");
      }

      await firestoreHelpers.updateDoc(strategyPath, {
        isActive: true,
        updatedAt: Timestamp.now(),
      });

      const data = doc.data();
      return {
        id: doc.id,
        budgetId: data.budgetId,
        name: data.name,
        description: data.description,
        effectiveFrom: data.effectiveFrom?.toDate(),
        allocations: data.allocations,
        isActive: true,
        createdAt: data.createdAt?.toDate(),
        updatedAt: Timestamp.now().toDate(),
      } as AllocationStrategy;
    } catch (error) {
      console.error("Error reactivating allocation strategy:", error);
      throw new Error("Failed to reactivate allocation strategy");
    }
  },

  /**
   * Calculate income distribution based on current strategy
   */
  async calculateIncomeDistribution(
    userId: string,
    budgetId: string,
    incomeAmount: number,
    asOfDate: Date = new Date()
  ): Promise<{
    distribution: Record<string, number>;
    strategy: AllocationStrategy | null;
  }> {
    try {
      const strategy = await this.getCurrentAllocationStrategy(
        userId,
        budgetId,
        asOfDate
      );

      if (!strategy) {
        return { distribution: {}, strategy: null };
      }

      const distribution: Record<string, number> = {};
      strategy.allocations.forEach((allocation) => {
        distribution[allocation.poolId] =
          Math.round(incomeAmount * allocation.proportion * 100) / 100;
      });

      return { distribution, strategy };
    } catch (error) {
      console.error("Error calculating income distribution:", error);
      throw new Error("Failed to calculate income distribution");
    }
  },

  /**
   * Validate that allocations sum to 1.0
   */
  validateAllocationsSum(allocations: PoolAllocation[]): {
    isValid: boolean;
    total: number;
  } {
    const total = allocations.reduce(
      (sum, allocation) => sum + allocation.proportion,
      0
    );
    const isValid = Math.abs(total - 1.0) < 0.001;
    return { isValid, total };
  },

  /**
   * Subscribe to allocation strategy changes in real-time
   */
  onAllocationStrategyChange(
    userId: string,
    budgetId: string,
    strategyId: string,
    callback: (strategy: AllocationStrategy | null) => void
  ) {
    const strategyPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "allocationStrategies")}/${strategyId}`;

    return firestoreHelpers.onDocSnapshot(strategyPath, (doc) => {
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
        budgetId: data.budgetId,
        name: data.name,
        description: data.description,
        effectiveFrom: data.effectiveFrom?.toDate(),
        allocations: data.allocations,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as AllocationStrategy);
    });
  },

  /**
   * Subscribe to current allocation strategy changes in real-time
   */
  onCurrentAllocationStrategyChange(
    userId: string,
    budgetId: string,
    callback: (strategy: AllocationStrategy | null) => void
  ) {
    const strategiesPath = userDataHelpers.getBudgetSubcollectionPath(
      userId,
      budgetId,
      "allocationStrategies"
    );

    return firestoreHelpers.onCollectionSnapshot(
      strategiesPath,
      (docs) => {
        // Find the current strategy (active and most recent effectiveFrom)
        const currentDate = new Date();

        const strategies = docs
          .filter(
            (doc) => doc.isActive && doc.effectiveFrom?.toDate() <= currentDate
          )
          .map((doc) => ({
            id: doc.id,
            budgetId: doc.budgetId,
            name: doc.name,
            description: doc.description,
            effectiveFrom: doc.effectiveFrom?.toDate(),
            allocations: doc.allocations,
            isActive: doc.isActive,
            createdAt: doc.createdAt?.toDate(),
            updatedAt: doc.updatedAt?.toDate(),
          }))
          .sort(
            (a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime()
          );

        callback(
          strategies.length > 0 ? (strategies[0] as AllocationStrategy) : null
        );
      },
      [
        firestoreHelpers.where("isActive", "==", true),
        firestoreHelpers.orderBy("effectiveFrom", "desc"),
      ]
    );
  },

  /**
   * Subscribe to budget's allocation strategies list in real-time
   */
  onAllocationStrategiesChange(
    userId: string,
    budgetId: string,
    callback: (strategies: AllocationStrategy[]) => void,
    includeInactive: boolean = false
  ) {
    const strategiesPath = userDataHelpers.getBudgetSubcollectionPath(
      userId,
      budgetId,
      "allocationStrategies"
    );

    const constraints = includeInactive
      ? [firestoreHelpers.orderBy("effectiveFrom", "desc")]
      : [
          firestoreHelpers.where("isActive", "==", true),
          firestoreHelpers.orderBy("effectiveFrom", "desc"),
        ];

    return firestoreHelpers.onCollectionSnapshot(
      strategiesPath,
      (docs) => {
        const strategies = docs.map((doc) => ({
          id: doc.id,
          budgetId: doc.budgetId,
          name: doc.name,
          description: doc.description,
          effectiveFrom: doc.effectiveFrom?.toDate(),
          allocations: doc.allocations,
          isActive: doc.isActive,
          createdAt: doc.createdAt?.toDate(),
          updatedAt: doc.updatedAt?.toDate(),
        })) as AllocationStrategy[];

        callback(strategies);
      },
      constraints
    );
  },
};
