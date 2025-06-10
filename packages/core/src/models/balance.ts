import { z } from "zod";

/**
 * Individual pool balance within a specific channel
 */
export const PoolBalanceSchema = z.object({
  poolId: z.string().min(1, "Pool ID is required"),
  channelId: z.string().min(1, "Channel ID is required"),
  amount: z.number(), // Can be negative for credit accounts
});

export type PoolBalance = z.infer<typeof PoolBalanceSchema>;

/**
 * Current balance state - represents the current balance of all pool/channel combinations
 */
export const CurrentBalanceSchema = z.object({
  id: z.string().min(1, "Balance ID is required"),
  budgetId: z.string().min(1, "Budget ID is required"),
  balances: z.array(PoolBalanceSchema),
  lastUpdated: z.date(),
  updatedBy: z.string().min(1, "Updated by user ID is required"), // For audit trail
});

export type CurrentBalance = z.infer<typeof CurrentBalanceSchema>;

/**
 * Historic balance snapshot - captures complete state at a specific point in time
 */
export const BalanceSnapshotSchema = z.object({
  id: z.string().min(1, "Snapshot ID is required"),
  budgetId: z.string().min(1, "Budget ID is required"),
  snapshotDate: z.date(), // The date this snapshot represents
  balances: z.array(PoolBalanceSchema),
  createdAt: z.date(), // When the snapshot was created
  reason: z.enum([
    "transaction_created",
    "transaction_updated",
    "transaction_deleted",
    "manual_snapshot",
    "end_of_period",
  ]),
  relatedTransactionId: z.string().optional(), // If snapshot was created due to transaction change
});

export type BalanceSnapshot = z.infer<typeof BalanceSnapshotSchema>;

/**
 * Balance query result - aggregated view for display purposes
 */
export const BalanceQueryResultSchema = z.object({
  poolId: z.string(),
  poolName: z.string(),
  channelId: z.string(),
  channelName: z.string(),
  amount: z.number(),
  lastUpdated: z.date(),
});

export type BalanceQueryResult = z.infer<typeof BalanceQueryResultSchema>;

/**
 * Channel total balance - sum of all pools within a channel
 */
export const ChannelTotalBalanceSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  totalBalance: z.number(),
  poolBreakdown: z.array(
    z.object({
      poolId: z.string(),
      poolName: z.string(),
      amount: z.number(),
    })
  ),
  lastUpdated: z.date(),
});

export type ChannelTotalBalance = z.infer<typeof ChannelTotalBalanceSchema>;

/**
 * Pool total balance - sum of a pool across all channels
 */
export const PoolTotalBalanceSchema = z.object({
  poolId: z.string(),
  poolName: z.string(),
  totalBalance: z.number(),
  channelBreakdown: z.array(
    z.object({
      channelId: z.string(),
      channelName: z.string(),
      amount: z.number(),
    })
  ),
  lastUpdated: z.date(),
});

export type PoolTotalBalance = z.infer<typeof PoolTotalBalanceSchema>;

/**
 * Validation functions
 */
export const validateCurrentBalance = (data: unknown): CurrentBalance => {
  return CurrentBalanceSchema.parse(data);
};

export const validateBalanceSnapshot = (data: unknown): BalanceSnapshot => {
  return BalanceSnapshotSchema.parse(data);
};

/**
 * Helper function to get balance for specific pool/channel combination
 */
export const getPoolChannelBalance = (
  balances: PoolBalance[],
  poolId: string,
  channelId: string
): number => {
  const balance = balances.find(
    (b) => b.poolId === poolId && b.channelId === channelId
  );
  return balance?.amount || 0;
};

/**
 * Helper function to get total balance for a channel (sum of all pools)
 */
export const getChannelTotalBalance = (
  balances: PoolBalance[],
  channelId: string
): number => {
  return balances
    .filter((b) => b.channelId === channelId)
    .reduce((sum, balance) => sum + balance.amount, 0);
};

/**
 * Helper function to get total balance for a pool (sum across all channels)
 */
export const getPoolTotalBalance = (
  balances: PoolBalance[],
  poolId: string
): number => {
  return balances
    .filter((b) => b.poolId === poolId)
    .reduce((sum, balance) => sum + balance.amount, 0);
};

/**
 * Helper function to calculate net worth (sum of all positive balances minus debts)
 */
export const calculateNetWorth = (balances: PoolBalance[]): number => {
  return balances.reduce((sum, balance) => sum + balance.amount, 0);
};

/**
 * Helper function to get all balances for a specific channel
 */
export const getChannelBalances = (
  balances: PoolBalance[],
  channelId: string
): PoolBalance[] => {
  return balances.filter((b) => b.channelId === channelId);
};

/**
 * Helper function to get all balances for a specific pool
 */
export const getPoolBalances = (
  balances: PoolBalance[],
  poolId: string
): PoolBalance[] => {
  return balances.filter((b) => b.poolId === poolId);
};

/**
 * Helper function to create a balance snapshot
 */
export const createBalanceSnapshot = (
  budgetId: string,
  currentBalances: PoolBalance[],
  reason: BalanceSnapshot["reason"],
  relatedTransactionId?: string
): Omit<BalanceSnapshot, "id"> => {
  const now = new Date();

  return {
    budgetId,
    snapshotDate: now,
    balances: [...currentBalances], // Create a copy
    createdAt: now,
    reason,
    relatedTransactionId,
  };
};

/**
 * Helper function to update balance after transaction
 */
export const updateBalanceAfterTransaction = (
  currentBalances: PoolBalance[],
  poolAllocations: Array<{ poolId: string; amount: number }>,
  channelId: string,
  destinationChannelId?: string
): PoolBalance[] => {
  const updatedBalances = [...currentBalances];

  // Update source channel balances
  poolAllocations.forEach((allocation) => {
    const existingIndex = updatedBalances.findIndex(
      (b) => b.poolId === allocation.poolId && b.channelId === channelId
    );

    if (existingIndex >= 0) {
      updatedBalances[existingIndex].amount += allocation.amount;
    } else {
      // Create new balance entry if it doesn't exist
      updatedBalances.push({
        poolId: allocation.poolId,
        channelId,
        amount: allocation.amount,
      });
    }
  });

  // For transfers, update destination channel balances
  if (destinationChannelId) {
    poolAllocations.forEach((allocation) => {
      const existingIndex = updatedBalances.findIndex(
        (b) =>
          b.poolId === allocation.poolId && b.channelId === destinationChannelId
      );

      if (existingIndex >= 0) {
        updatedBalances[existingIndex].amount += Math.abs(allocation.amount);
      } else {
        // Create new balance entry if it doesn't exist
        updatedBalances.push({
          poolId: allocation.poolId,
          channelId: destinationChannelId,
          amount: Math.abs(allocation.amount),
        });
      }
    });
  }

  return updatedBalances;
};
