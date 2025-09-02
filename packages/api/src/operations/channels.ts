import { firestoreHelpers, userDataHelpers, Timestamp } from "../firebase.js";
import type {
  Channel,
  CreateChannel,
  UpdateChannel,
  BillTracking,
} from "@budget/core";

/**
 * Helper function to convert BillTracking dates to Firestore Timestamps
 */
const convertBillTrackingToFirestore = (billTracking?: BillTracking) => {
  if (!billTracking) return null;

  return {
    statementAmount: billTracking.statementAmount || null,
    statementDate: billTracking.statementDate
      ? Timestamp.fromDate(billTracking.statementDate)
      : null,
    dueDate: billTracking.dueDate
      ? Timestamp.fromDate(billTracking.dueDate)
      : null,
    amountPaid: billTracking.amountPaid || 0,
    minimumPayment: billTracking.minimumPayment || null,
    lastPaymentDate: billTracking.lastPaymentDate
      ? Timestamp.fromDate(billTracking.lastPaymentDate)
      : null,
  };
};

/**
 * Helper function to convert Firestore BillTracking back to dates
 */
const convertBillTrackingFromFirestore = (
  firestoreBillTracking: any
): BillTracking | undefined => {
  if (!firestoreBillTracking) return undefined;

  return {
    statementAmount: firestoreBillTracking.statementAmount,
    statementDate: firestoreBillTracking.statementDate?.toDate(),
    dueDate: firestoreBillTracking.dueDate?.toDate(),
    amountPaid: firestoreBillTracking.amountPaid || 0,
    minimumPayment: firestoreBillTracking.minimumPayment,
    lastPaymentDate: firestoreBillTracking.lastPaymentDate?.toDate(),
  };
};

export const channelOperations = {
  /**
   * Create a new channel for a budget
   */
  async createChannel(
    userId: string,
    budgetId: string,
    data: CreateChannel
  ): Promise<Channel> {
    try {
      const channelData = {
        budgetId: data.budgetId,
        name: data.name,
        description: data.description || "",
        type: data.type,
        institution: data.institution || null,
        accountNumber: data.accountNumber || null,
        creditLimit: data.creditLimit || null,
        billTracking: convertBillTrackingToFirestore(data.billTracking),
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await firestoreHelpers.addDoc(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "channels"
        ),
        channelData
      );

      return {
        id: docRef.id,
        budgetId: channelData.budgetId,
        name: channelData.name,
        description: channelData.description,
        type: channelData.type,
        institution: channelData.institution,
        accountNumber: channelData.accountNumber,
        creditLimit: channelData.creditLimit,
        billTracking: convertBillTrackingFromFirestore(
          channelData.billTracking
        ),
        isActive: channelData.isActive,
        createdAt: channelData.createdAt.toDate(),
        updatedAt: channelData.updatedAt.toDate(),
      } as Channel;
    } catch (error) {
      console.error("Error creating channel:", error);
      throw new Error("Failed to create channel");
    }
  },

  /**
   * Get a specific channel by ID
   */
  async getChannel(
    userId: string,
    budgetId: string,
    channelId: string
  ): Promise<Channel | null> {
    try {
      const channelPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "channels")}/${channelId}`;
      const doc = await firestoreHelpers.getDoc(channelPath);

      if (!doc.exists()) {
        return null;
      }

      const data = doc.data();
      if (!data?.isActive) {
        return null; // Treat inactive channels as not found
      }

      return {
        id: doc.id,
        budgetId: data.budgetId,
        name: data.name,
        description: data.description,
        type: data.type,
        institution: data.institution,
        accountNumber: data.accountNumber,
        creditLimit: data.creditLimit,
        billTracking: convertBillTrackingFromFirestore(data.billTracking),
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Channel;
    } catch (error) {
      console.error("Error getting channel:", error);
      throw new Error("Failed to get channel");
    }
  },

  /**
   * Get all active channels for a budget
   */
  async getAllChannels(
    userId: string,
    budgetId: string,
    includeInactive: boolean = false
  ): Promise<Channel[]> {
    try {
      const constraints = includeInactive
        ? [firestoreHelpers.orderBy("createdAt", "asc")]
        : [
            firestoreHelpers.where("isActive", "==", true),
            firestoreHelpers.orderBy("createdAt", "asc"),
          ];

      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "channels"
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
          type: data.type,
          institution: data.institution,
          accountNumber: data.accountNumber,
          creditLimit: data.creditLimit,
          billTracking: convertBillTrackingFromFirestore(data.billTracking),
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as Channel[];
    } catch (error) {
      console.error("Error getting channels:", error);
      throw new Error("Failed to get channels");
    }
  },

  /**
   * Get channels by type
   */
  async getChannelsByType(
    userId: string,
    budgetId: string,
    channelType: string
  ): Promise<Channel[]> {
    try {
      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "channels"
        ),
        [
          firestoreHelpers.where("isActive", "==", true),
          firestoreHelpers.where("type", "==", channelType),
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
          type: data.type,
          institution: data.institution,
          accountNumber: data.accountNumber,
          creditLimit: data.creditLimit,
          billTracking: convertBillTrackingFromFirestore(data.billTracking),
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as Channel[];
    } catch (error) {
      console.error("Error getting channels by type:", error);
      throw new Error("Failed to get channels by type");
    }
  },

  /**
   * Get credit card channels with upcoming due dates
   */
  async getCreditChannelsWithDueDates(
    userId: string,
    budgetId: string,
    dayLimit: number = 30
  ): Promise<Channel[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + dayLimit);

      const snapshot = await firestoreHelpers.getDocs(
        userDataHelpers.getBudgetSubcollectionPath(
          userId,
          budgetId,
          "channels"
        ),
        [
          firestoreHelpers.where("isActive", "==", true),
          firestoreHelpers.where("type", "==", "credit"),
        ]
      );

      // Filter client-side for due dates since Firestore can't query nested fields easily
      return snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            budgetId: data.budgetId,
            name: data.name,
            description: data.description,
            type: data.type,
            institution: data.institution,
            accountNumber: data.accountNumber,
            creditLimit: data.creditLimit,
            billTracking: convertBillTrackingFromFirestore(data.billTracking),
            isActive: data.isActive,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as Channel;
        })
        .filter((channel) => {
          if (!channel.billTracking?.dueDate) return false;
          return channel.billTracking.dueDate <= cutoffDate;
        });
    } catch (error) {
      console.error("Error getting credit channels with due dates:", error);
      throw new Error("Failed to get credit channels with due dates");
    }
  },

  /**
   * Update channel data
   */
  async updateChannel(
    userId: string,
    budgetId: string,
    channelId: string,
    updates: UpdateChannel
  ): Promise<Channel> {
    try {
      const channelPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "channels")}/${channelId}`;

      // First verify the channel exists and is active
      const existingChannel = await this.getChannel(
        userId,
        budgetId,
        channelId
      );
      if (!existingChannel) {
        throw new Error("Channel not found");
      }

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Convert billTracking dates to Timestamps if provided
      if (updates.billTracking !== undefined) {
        updateData.billTracking = convertBillTrackingToFirestore(
          updates.billTracking
        );
      }

      await firestoreHelpers.updateDoc(channelPath, updateData);

      return {
        id: existingChannel.id,
        budgetId: existingChannel.budgetId,
        name: updateData.name || existingChannel.name,
        description:
          updateData.description !== undefined
            ? updateData.description
            : existingChannel.description,
        type: updateData.type || existingChannel.type,
        institution:
          updateData.institution !== undefined
            ? updateData.institution
            : existingChannel.institution,
        accountNumber:
          updateData.accountNumber !== undefined
            ? updateData.accountNumber
            : existingChannel.accountNumber,
        creditLimit:
          updateData.creditLimit !== undefined
            ? updateData.creditLimit
            : existingChannel.creditLimit,
        billTracking:
          updateData.billTracking !== undefined
            ? convertBillTrackingFromFirestore(updateData.billTracking)
            : existingChannel.billTracking,
        isActive:
          updateData.isActive !== undefined
            ? updateData.isActive
            : existingChannel.isActive,
        createdAt: existingChannel.createdAt,
        updatedAt: updateData.updatedAt.toDate(),
      } as Channel;
    } catch (error) {
      console.error("Error updating channel:", error);
      throw new Error("Failed to update channel");
    }
  },

  /**
   * Update bill tracking information for a channel
   */
  async updateBillTracking(
    userId: string,
    budgetId: string,
    channelId: string,
    billTracking: BillTracking
  ): Promise<Channel> {
    try {
      const channelPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "channels")}/${channelId}`;

      const updateData = {
        billTracking: convertBillTrackingToFirestore(billTracking),
        updatedAt: Timestamp.now(),
      };

      await firestoreHelpers.updateDoc(channelPath, updateData);

      // Return updated channel
      const updatedChannel = await this.getChannel(userId, budgetId, channelId);
      if (!updatedChannel) {
        throw new Error("Channel not found after update");
      }

      return updatedChannel;
    } catch (error) {
      console.error("Error updating bill tracking:", error);
      throw new Error("Failed to update bill tracking");
    }
  },

  /**
   * Record a payment on a credit card bill
   */
  async recordBillPayment(
    userId: string,
    budgetId: string,
    channelId: string,
    paymentAmount: number,
    paymentDate: Date = new Date()
  ): Promise<Channel> {
    try {
      const existingChannel = await this.getChannel(
        userId,
        budgetId,
        channelId
      );
      if (!existingChannel) {
        throw new Error("Channel not found");
      }

      if (existingChannel.type !== "credit") {
        throw new Error(
          "Bill payments are only supported for credit card channels"
        );
      }

      const currentBillTracking = existingChannel.billTracking || {
        amountPaid: 0,
      };

      const updatedBillTracking: BillTracking = {
        ...currentBillTracking,
        amountPaid: (currentBillTracking.amountPaid || 0) + paymentAmount,
        lastPaymentDate: paymentDate,
      };

      return this.updateBillTracking(
        userId,
        budgetId,
        channelId,
        updatedBillTracking
      );
    } catch (error) {
      console.error("Error recording bill payment:", error);
      throw new Error("Failed to record bill payment");
    }
  },

  /**
   * Soft delete a channel (set isActive to false)
   */
  async deleteChannel(
    userId: string,
    budgetId: string,
    channelId: string
  ): Promise<void> {
    try {
      const channelPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "channels")}/${channelId}`;

      await firestoreHelpers.updateDoc(channelPath, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error deleting channel:", error);
      throw new Error("Failed to delete channel");
    }
  },

  /**
   * Reactivate a soft-deleted channel
   */
  async reactivateChannel(
    userId: string,
    budgetId: string,
    channelId: string
  ): Promise<Channel> {
    try {
      const channelPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "channels")}/${channelId}`;

      // Get the channel including inactive ones
      const doc = await firestoreHelpers.getDoc(channelPath);
      if (!doc.exists()) {
        throw new Error("Channel not found");
      }

      await firestoreHelpers.updateDoc(channelPath, {
        isActive: true,
        updatedAt: Timestamp.now(),
      });

      const data = doc.data();
      return {
        id: doc.id,
        budgetId: data.budgetId,
        name: data.name,
        description: data.description,
        type: data.type,
        institution: data.institution,
        accountNumber: data.accountNumber,
        creditLimit: data.creditLimit,
        billTracking: convertBillTrackingFromFirestore(data.billTracking),
        isActive: true,
        createdAt: data.createdAt?.toDate(),
        updatedAt: Timestamp.now().toDate(),
      } as Channel;
    } catch (error) {
      console.error("Error reactivating channel:", error);
      throw new Error("Failed to reactivate channel");
    }
  },

  /**
   * Subscribe to channel changes in real-time
   */
  onChannelChange(
    userId: string,
    budgetId: string,
    channelId: string,
    callback: (channel: Channel | null) => void
  ) {
    const channelPath = `${userDataHelpers.getBudgetSubcollectionPath(userId, budgetId, "channels")}/${channelId}`;

    return firestoreHelpers.onDocSnapshot(channelPath, (doc) => {
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
        type: data.type,
        institution: data.institution,
        accountNumber: data.accountNumber,
        creditLimit: data.creditLimit,
        billTracking: convertBillTrackingFromFirestore(data.billTracking),
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Channel);
    });
  },

  /**
   * Subscribe to budget's channels list in real-time
   */
  onChannelsChange(
    userId: string,
    budgetId: string,
    callback: (channels: Channel[]) => void,
    includeInactive: boolean = false
  ) {
    const channelsPath = userDataHelpers.getBudgetSubcollectionPath(
      userId,
      budgetId,
      "channels"
    );

    const constraints = includeInactive
      ? [firestoreHelpers.orderBy("createdAt", "asc")]
      : [
          firestoreHelpers.where("isActive", "==", true),
          firestoreHelpers.orderBy("createdAt", "asc"),
        ];

    return firestoreHelpers.onCollectionSnapshot(
      channelsPath,
      (docs) => {
        const channels = docs.map((doc) => ({
          id: doc.id,
          budgetId: doc.budgetId,
          name: doc.name,
          description: doc.description,
          type: doc.type,
          institution: doc.institution,
          accountNumber: doc.accountNumber,
          creditLimit: doc.creditLimit,
          billTracking: convertBillTrackingFromFirestore(doc.billTracking),
          isActive: doc.isActive,
          createdAt: doc.createdAt?.toDate(),
          updatedAt: doc.updatedAt?.toDate(),
        })) as Channel[];

        callback(channels);
      },
      constraints
    );
  },
};
