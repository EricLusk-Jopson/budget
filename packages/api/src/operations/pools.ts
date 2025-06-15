import { firestoreHelpers, userDataHelpers, Timestamp } from "../firebase";
import type { Pool, CreatePool, UpdatePool } from "@budget/core";

export const poolOperations = {
  /**
   * Create a new pool for a budget
   */
  async createPool(
    userId: string,
    budgetId: string,
    data: CreatePool
  ): Promise<Pool> {
    try {
      const poolData = {
        budgetId: data.budgetId,
        name: data.name,
        description: data.description || "",
        icon: data.icon || "other",
        color: data.color || "blue",
        purposeType: data.purposeType,
        targetAmount: data.targetAmount || null,
        targetDate: data.targetDate
          ? Timestamp.fromDate(data.targetDate)
          : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await firestoreHelpers.addDoc(
        userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "pools"),
        poolData
      );

      return {
        id: docRef.id,
        budgetId: poolData.budgetId,
        name: poolData.name,
        description: poolData.description,
        icon: poolData.icon,
        color: poolData.color,
        purposeType: poolData.purposeType,
        targetAmount: poolData.targetAmount,
        targetDate: poolData.targetDate?.toDate(),
        isActive: poolData.isActive,
        createdAt: poolData.createdAt.toDate(),
        updatedAt: poolData.updatedAt.toDate(),
      } as Pool;
    } catch (error) {
      console.error("Error creating pool:", error);
      throw new Error("Failed to create pool");
    }
  },

  /**
   * Get a specific pool by ID
   */
  async getPool(
    userId: string,
    budgetId: string,
    poolId: string
  ): Promise<Pool | null> {
    try {
      const poolPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "pools")}/${poolId}`;
      const doc = await firestoreHelpers.getDoc(poolPath);

      if (!doc.exists()) {
        return null;
      }

      const data = doc.data();
      if (!data?.isActive) {
        return null; // Treat inactive pools as not found
      }

      return {
        id: doc.id,
        budgetId: data.budgetId,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        purposeType: data.purposeType,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate?.toDate(),
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Pool;
    } catch (error) {
      console.error("Error getting pool:", error);
      throw new Error("Failed to get pool");
    }
  },

  /**
   * Get all active pools for a budget
   */
  async getAllPools(
    userId: string,
    budgetId: string,
    includeInactive: boolean = false
  ): Promise<Pool[]> {
    try {
      const constraints = includeInactive
        ? [firestoreHelpers.orderBy("createdAt", "asc")]
        : [
            firestoreHelpers.where("isActive", "==", true),
            firestoreHelpers.orderBy("createdAt", "asc"),
          ];

      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "pools"),
        constraints
      );

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          budgetId: data.budgetId,
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          purposeType: data.purposeType,
          targetAmount: data.targetAmount,
          targetDate: data.targetDate?.toDate(),
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as Pool[];
    } catch (error) {
      console.error("Error getting pools:", error);
      throw new Error("Failed to get pools");
    }
  },

  /**
   * Get pools by purpose type
   */
  async getPoolsByPurpose(
    userId: string,
    budgetId: string,
    purposeType: string
  ): Promise<Pool[]> {
    try {
      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "pools"),
        [
          firestoreHelpers.where("isActive", "==", true),
          firestoreHelpers.where("purposeType", "==", purposeType),
          firestoreHelpers.orderBy("createdAt", "asc"),
        ]
      );

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          budgetId: data.budgetId,
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          purposeType: data.purposeType,
          targetAmount: data.targetAmount,
          targetDate: data.targetDate?.toDate(),
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as Pool[];
    } catch (error) {
      console.error("Error getting pools by purpose:", error);
      throw new Error("Failed to get pools by purpose");
    }
  },

  /**
   * Update pool data
   */
  async updatePool(
    userId: string,
    budgetId: string,
    poolId: string,
    updates: UpdatePool
  ): Promise<Pool> {
    try {
      const poolPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "pools")}/${poolId}`;

      // First verify the pool exists and is active
      const existingPool = await this.getPool(userId, budgetId, poolId);
      if (!existingPool) {
        throw new Error("Pool not found");
      }

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Convert targetDate to Timestamp if provided
      if (updates.targetDate !== undefined) {
        updateData.targetDate = updates.targetDate
          ? Timestamp.fromDate(updates.targetDate)
          : null;
      }

      await firestoreHelpers.updateDoc(poolPath, updateData);

      return {
        id: existingPool.id,
        budgetId: existingPool.budgetId,
        name: updateData.name || existingPool.name,
        description:
          updateData.description !== undefined
            ? updateData.description
            : existingPool.description,
        icon: updateData.icon || existingPool.icon,
        color: updateData.color || existingPool.color,
        purposeType: updateData.purposeType || existingPool.purposeType,
        targetAmount:
          updateData.targetAmount !== undefined
            ? updateData.targetAmount
            : existingPool.targetAmount,
        targetDate:
          updateData.targetDate !== undefined
            ? updateData.targetDate?.toDate() || null
            : existingPool.targetDate,
        isActive:
          updateData.isActive !== undefined
            ? updateData.isActive
            : existingPool.isActive,
        createdAt: existingPool.createdAt,
        updatedAt: updateData.updatedAt.toDate(),
      } as Pool;
    } catch (error) {
      console.error("Error updating pool:", error);
      throw new Error("Failed to update pool");
    }
  },

  /**
   * Soft delete a pool (set isActive to false)
   */
  async deletePool(
    userId: string,
    budgetId: string,
    poolId: string
  ): Promise<void> {
    try {
      const poolPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "pools")}/${poolId}`;

      await firestoreHelpers.updateDoc(poolPath, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error deleting pool:", error);
      throw new Error("Failed to delete pool");
    }
  },

  /**
   * Reactivate a soft-deleted pool
   */
  async reactivatePool(
    userId: string,
    budgetId: string,
    poolId: string
  ): Promise<Pool> {
    try {
      const poolPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "pools")}/${poolId}`;

      // Get the pool including inactive ones
      const doc = await firestoreHelpers.getDoc(poolPath);
      if (!doc.exists()) {
        throw new Error("Pool not found");
      }

      await firestoreHelpers.updateDoc(poolPath, {
        isActive: true,
        updatedAt: Timestamp.now(),
      });

      const data = doc.data();
      return {
        id: doc.id,
        budgetId: data.budgetId,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        purposeType: data.purposeType,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate?.toDate(),
        isActive: true,
        createdAt: data.createdAt?.toDate(),
        updatedAt: Timestamp.now().toDate(),
      } as Pool;
    } catch (error) {
      console.error("Error reactivating pool:", error);
      throw new Error("Failed to reactivate pool");
    }
  },

  /**
   * Subscribe to pool changes in real-time
   */
  onPoolChange(
    userId: string,
    budgetId: string,
    poolId: string,
    callback: (pool: Pool | null) => void
  ) {
    const poolPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "pools")}/${poolId}`;

    return firestoreHelpers.onDocSnapshot(poolPath, (doc) => {
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
        icon: data.icon,
        color: data.color,
        purposeType: data.purposeType,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate?.toDate(),
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Pool);
    });
  },

  /**
   * Subscribe to budget's pools list in real-time
   */
  onPoolsChange(
    userId: string,
    budgetId: string,
    callback: (pools: Pool[]) => void,
    includeInactive: boolean = false
  ) {
    const poolsPath = userDataHelpers.getBudgetSubcollectionPath(
      userId,
      budgetId,
      "pools"
    );

    const constraints = includeInactive
      ? [firestoreHelpers.orderBy("createdAt", "asc")]
      : [
          firestoreHelpers.where("isActive", "==", true),
          firestoreHelpers.orderBy("createdAt", "asc"),
        ];

    return firestoreHelpers.onCollectionSnapshot(
      poolsPath,
      (docs) => {
        const pools = docs.map((doc) => ({
          id: doc.id,
          budgetId: doc.budgetId,
          name: doc.name,
          description: doc.description,
          icon: doc.icon,
          color: doc.color,
          purposeType: doc.purposeType,
          targetAmount: doc.targetAmount,
          targetDate: doc.targetDate?.toDate(),
          isActive: doc.isActive,
          createdAt: doc.createdAt?.toDate(),
          updatedAt: doc.updatedAt?.toDate(),
        })) as Pool[];

        callback(pools);
      },
      constraints
    );
  },
};
