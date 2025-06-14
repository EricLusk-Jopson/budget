/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Pool,
  Channel,
  AllocationStrategy,
  IncomeTransaction,
  ExpenseTransaction,
  TransferTransaction,
  AllocationBreakdown,
  PoolBalance,
  CurrentBalance,
  BalanceSnapshot,
  PoolPurposeType,
  ChannelType,
} from "../../models";

/**
 * Creates comprehensive test data for validation testing
 */
export function createTestData() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Helper to create pools
  const createPool = (
    id: string,
    name = `Pool ${id}`,
    purposeType: PoolPurposeType = "spending"
  ): Pool => ({
    id,
    budgetId: "budget1",
    name,
    description: `Test pool ${name}`,
    icon: "other",
    color: "blue",
    purposeType,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  // Helper to create channels
  const createChannel = (
    id: string,
    name = `Channel ${id}`,
    type: ChannelType = "checking"
  ): Channel => ({
    id,
    budgetId: "budget1",
    name,
    description: `Test channel ${name}`,
    type,
    institution: type === "cash" ? undefined : "Test Bank",
    accountNumber: type === "cash" ? undefined : `****1234`,
    creditLimit: type === "credit" ? 5000 : undefined,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  // Helper to create income transactions
  const createIncomeTransaction = (
    id: string,
    poolId = "pool1",
    channelId = "channel1",
    amount = 1000
  ): IncomeTransaction => ({
    id,
    budgetId: "budget1",
    type: "income",
    date: yesterday,
    channelId,
    amount,
    source: "Test Salary",
    allocationBreakdown: {
      items: [{ poolId, amount }],
      totalAmount: amount,
    },
    notes: "Test income transaction",
    createdAt: now,
    updatedAt: now,
  });

  // Helper to create expense transactions
  const createExpenseTransaction = (
    id: string,
    poolId = "pool1",
    channelId = "channel1",
    amount = 100
  ): ExpenseTransaction => ({
    id,
    budgetId: "budget1",
    type: "expense",
    date: yesterday,
    channelId,
    amount,
    category: {
      categoryId: "cat1",
      categoryName: "Food",
      subcategoryId: "subcat1",
      subcategoryName: "Groceries",
    },
    allocationBreakdown: {
      items: [{ poolId, amount }],
      totalAmount: amount,
    },
    notes: "Test expense transaction",
    createdAt: now,
    updatedAt: now,
  });

  // Helper to create transfer transactions
  const createTransferTransaction = (
    id: string,
    sourceChannelId = "channel1",
    destinationChannelId = "channel2",
    amount = 100
  ): TransferTransaction => ({
    id,
    budgetId: "budget1",
    type: "transfer",
    date: yesterday,
    amount,
    description: "Test transfer",
    sourceChannelId,
    sourceAllocation: {
      items: [{ poolId: "pool1", amount }],
      totalAmount: amount,
    },
    destinationChannelId,
    destinationAllocation: {
      items: [{ poolId: "pool1", amount }],
      totalAmount: amount,
    },
    notes: "Test transfer transaction",
    createdAt: now,
    updatedAt: now,
  });

  // Create test entities
  const pools: Pool[] = [
    createPool("pool1", "Emergency Fund", "saving"),
    createPool("pool2", "Groceries", "spending"),
    createPool("pool3", "Vacation Fund", "goal"),
    createPool("pool4", "Entertainment", "spending"),
  ];

  const channels: Channel[] = [
    createChannel("channel1", "Primary Checking", "checking"),
    createChannel("channel2", "Savings Account", "savings"),
    createChannel("channel3", "Credit Card", "credit"),
    createChannel("channel4", "Cash", "cash"),
  ];

  // Valid allocation strategy
  const validAllocationStrategy: AllocationStrategy = {
    id: "strategy1",
    budgetId: "budget1",
    name: "Primary Strategy",
    description: "Main allocation strategy",
    effectiveFrom: now,
    allocations: [
      { poolId: "pool1", proportion: 0.4 }, // 40%
      { poolId: "pool2", proportion: 0.3 }, // 30%
      { poolId: "pool3", proportion: 0.2 }, // 20%
      { poolId: "pool4", proportion: 0.1 }, // 10%
    ],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  // Valid pool balances
  const validPoolBalances: PoolBalance[] = [
    { poolId: "pool1", channelId: "channel1", amount: 1000 },
    { poolId: "pool1", channelId: "channel2", amount: 500 },
    { poolId: "pool2", channelId: "channel1", amount: 300 },
    { poolId: "pool3", channelId: "channel2", amount: 800 },
    { poolId: "pool4", channelId: "channel4", amount: 50 },
  ];

  // Valid current balance
  const validCurrentBalance: CurrentBalance = {
    id: "balance1",
    budgetId: "budget1",
    balances: validPoolBalances,
    lastUpdated: now,
    updatedBy: "user1",
  };

  // Valid balance snapshot
  const validBalanceSnapshot: BalanceSnapshot = {
    id: "snapshot1",
    budgetId: "budget1",
    snapshotDate: yesterday,
    balances: validPoolBalances,
    createdAt: now,
    reason: "transaction_created",
    relatedTransactionId: "trans1",
  };

  // Valid transactions
  const validIncomeTransaction = createIncomeTransaction("income1");
  const validExpenseTransaction = createExpenseTransaction("expense1");
  const validTransferTransaction = createTransferTransaction("transfer1");

  // Valid credit payment transaction
  const validCreditPayment: TransferTransaction = {
    ...createTransferTransaction("credit_payment1", "channel1", "channel3"),
    description: "Credit card payment",
    sourceAllocation: {
      items: [
        { poolId: "pool1", amount: 200 },
        { poolId: "pool2", amount: 100 },
      ],
      totalAmount: 300,
    },
    destinationAllocation: {
      items: [
        { poolId: "pool1", amount: 200 },
        { poolId: "pool2", amount: 100 },
      ],
      totalAmount: 300,
    },
    amount: 300,
  };

  const transactions = [
    validIncomeTransaction,
    validExpenseTransaction,
    validTransferTransaction,
  ];

  const allocationStrategies = [validAllocationStrategy];

  return {
    // Test entities
    pools,
    channels,
    transactions,
    allocationStrategies,

    // Individual valid entities
    validAllocationStrategy,
    validPoolBalances,
    validCurrentBalance,
    validBalanceSnapshot,
    validIncomeTransaction,
    validExpenseTransaction,
    validTransferTransaction,
    validCreditPayment,

    // Helper functions
    createPool,
    createChannel,
    createIncomeTransaction,
    createExpenseTransaction,
    createTransferTransaction,

    // Test utilities
    now,
    yesterday,
  };
}

/**
 * Creates invalid test data for negative testing scenarios
 */
export function createInvalidTestData() {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    // Invalid allocation strategy (proportions don't sum to 1.0)
    invalidAllocationStrategy: {
      id: "invalid_strategy1",
      budgetId: "budget1",
      name: "Invalid Strategy",
      effectiveFrom: now,
      allocations: [
        { poolId: "pool1", proportion: 0.4 },
        { poolId: "pool2", proportion: 0.3 },
        // Missing 0.3 to sum to 1.0
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } as AllocationStrategy,

    // Invalid allocation breakdown (items don't sum to total)
    invalidAllocationBreakdown: {
      items: [
        { poolId: "pool1", amount: 100 },
        { poolId: "pool2", amount: 50 },
      ],
      totalAmount: 200, // Should be 150
    } as AllocationBreakdown,

    // Invalid income transaction (negative amount)
    invalidIncomeTransaction: {
      id: "invalid_income1",
      budgetId: "budget1",
      type: "income",
      date: now,
      channelId: "channel1",
      amount: -1000, // Negative amount
      source: "Invalid Income",
      allocationBreakdown: {
        items: [{ poolId: "pool1", amount: -1000 }],
        totalAmount: -1000,
      },
      createdAt: now,
      updatedAt: now,
    } as IncomeTransaction,

    // Transaction with future date
    futureTransaction: {
      id: "future_trans1",
      budgetId: "budget1",
      type: "income",
      date: futureDate, // Future date
      channelId: "channel1",
      amount: 1000,
      source: "Future Income",
      allocationBreakdown: {
        items: [{ poolId: "pool1", amount: 1000 }],
        totalAmount: 1000,
      },
      createdAt: now,
      updatedAt: now,
    } as IncomeTransaction,

    // Transaction with mismatched allocation
    mismatchedAllocationTransaction: {
      id: "mismatched1",
      budgetId: "budget1",
      type: "income",
      date: now,
      channelId: "channel1",
      amount: 1000,
      source: "Mismatched Income",
      allocationBreakdown: {
        items: [{ poolId: "pool1", amount: 500 }],
        totalAmount: 500, // Should match amount (1000)
      },
      createdAt: now,
      updatedAt: now,
    } as IncomeTransaction,

    // Transfer between same channel and pool
    invalidSelfTransfer: {
      id: "invalid_transfer1",
      budgetId: "budget1",
      type: "transfer",
      date: now,
      amount: 100,
      description: "Invalid self transfer",
      sourceChannelId: "channel1",
      sourceAllocation: {
        items: [{ poolId: "pool1", amount: 100 }],
        totalAmount: 100,
      },
      destinationChannelId: "channel1", // Same channel
      destinationAllocation: {
        items: [{ poolId: "pool1", amount: 100 }], // Same pool
        totalAmount: 100,
      },
      createdAt: now,
      updatedAt: now,
    } as TransferTransaction,

    // Negative balance
    negativeBalance: {
      poolId: "pool1",
      channelId: "channel1",
      amount: -500,
    } as PoolBalance,

    futureDate,
  };
}

/**
 * Creates edge case test data for boundary testing
 */
export function createEdgeCaseTestData() {
  const now = new Date();

  return {
    // Very small amounts near floating point precision
    smallAmountBreakdown: {
      items: [
        { poolId: "pool1", amount: 0.01 },
        { poolId: "pool2", amount: 0.005 },
        { poolId: "pool3", amount: 0.004 },
      ],
      totalAmount: 0.019,
    } as AllocationBreakdown,

    // Large amounts
    largeAmountBreakdown: {
      items: [{ poolId: "pool1", amount: 999999999.99 }],
      totalAmount: 999999999.99,
    } as AllocationBreakdown,

    // Allocation strategy with many pools
    manyPoolsStrategy: {
      id: "many_pools_strategy",
      budgetId: "budget1",
      name: "Many Pools Strategy",
      effectiveFrom: now,
      allocations: Array.from({ length: 50 }, (_, i) => ({
        poolId: `pool${i}`,
        proportion: 0.02, // 2% each, 50 pools = 100%
      })),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } as AllocationStrategy,

    // Floating point precision edge case
    floatingPointStrategy: {
      id: "floating_point_strategy",
      budgetId: "budget1",
      name: "Floating Point Strategy",
      effectiveFrom: now,
      allocations: [
        { poolId: "pool1", proportion: 0.333333 },
        { poolId: "pool2", proportion: 0.333333 },
        { poolId: "pool3", proportion: 0.333334 }, // Total = 1.000000
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } as AllocationStrategy,

    // Empty arrays and zero values
    emptyAllocationStrategy: {
      id: "empty_strategy",
      budgetId: "budget1",
      name: "Empty Strategy",
      effectiveFrom: now,
      allocations: [], // Empty allocations
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } as AllocationStrategy,

    zeroAmountBreakdown: {
      items: [{ poolId: "pool1", amount: 0 }],
      totalAmount: 0,
    } as AllocationBreakdown,
  };
}

/**
 * Creates mock import data for testing import validation
 */
export function createImportTestData() {
  return {
    validImportData: [
      {
        date: "2024-01-15",
        description: "Salary Payment",
        amount: 3000,
        type: "income" as const,
        category: "Salary",
      },
      {
        date: "2024-01-16",
        description: "Grocery Store",
        amount: 150.75,
        type: "expense" as const,
        category: "Food",
        subcategory: "Groceries",
      },
      {
        date: "2024-01-17",
        description: "Transfer to Savings",
        amount: 500,
        type: "transfer" as const,
        channelName: "Checking",
        poolName: "Emergency Fund",
      },
    ],

    invalidImportData: [
      {
        date: "", // Missing date
        description: "",
        amount: 0,
        type: "invalid",
      },
      {
        date: "invalid-date-format",
        description: "Invalid Date",
        amount: "not-a-number",
        type: "income",
      },
      {
        date: "2024-01-15",
        description: "Missing Amount",
        // amount: missing
        type: "expense",
      },
    ],

    mixedImportData: [
      {
        date: "2024-01-15",
        description: "Valid Transaction",
        amount: 100,
        type: "income" as const,
      },
      {
        date: "invalid-date",
        description: "Invalid Transaction",
        amount: "invalid" as any,
        type: "invalid" as any,
      },
      {
        date: "2024-01-16",
        description: "Another Valid Transaction",
        amount: 200,
        type: "expense" as const,
      },
    ],
  };
}

/**
 * Performance test data generator
 */
export function createPerformanceTestData() {
  const now = new Date();

  const generatePools = (count: number): Pool[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `pool${i}`,
      budgetId: "budget1",
      name: `Pool ${i}`,
      description: `Performance test pool ${i}`,
      icon: "other",
      color: "blue",
      purposeType: "spending" as PoolPurposeType,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));

  const generateChannels = (count: number): Channel[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `channel${i}`,
      budgetId: "budget1",
      name: `Channel ${i}`,
      description: `Performance test channel ${i}`,
      type: "checking" as ChannelType,
      institution: "Test Bank",
      accountNumber: `****${i.toString().padStart(4, "0")}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));

  const generateTransactions = (count: number): IncomeTransaction[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `trans${i}`,
      budgetId: "budget1",
      type: "income",
      date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
      channelId: `channel${i % 10}`, // Cycle through first 10 channels
      amount: 1000 + (i % 1000),
      source: `Performance Test Income ${i}`,
      allocationBreakdown: {
        items: [{ poolId: `pool${i % 50}`, amount: 1000 + (i % 1000) }],
        totalAmount: 1000 + (i % 1000),
      },
      notes: `Performance test transaction ${i}`,
      createdAt: now,
      updatedAt: now,
    }));

  return {
    generatePools,
    generateChannels,
    generateTransactions,

    // Pre-generated sets for common test scenarios
    largePools: generatePools(100),
    mediumChannels: generateChannels(20),
    manyTransactions: generateTransactions(1000),
  };
}

/**
 * Assertion helpers for test validation
 */
export const testHelpers = {
  /**
   * Asserts that a validation result is invalid with specific error codes
   */
  expectValidationError: (
    result: { isValid: boolean; errors: any[] },
    expectedCodes: string[]
  ) => {
    expect(result.isValid).toBe(false);
    const actualCodes = result.errors.map((error) => error.code);
    expectedCodes.forEach((code) => {
      expect(actualCodes).toContain(code);
    });
  },

  /**
   * Asserts that a validation result is valid
   */
  expectValidationSuccess: (result: { isValid: boolean; errors: any[] }) => {
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  },

  /**
   * Creates a matcher for validation errors with specific field and code
   */
  validationErrorMatcher: (field: string, code: string) =>
    expect.objectContaining({
      field,
      code,
    }),

  /**
   * Measures execution time of a function
   */
  measureExecutionTime: async <T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; timeMs: number }> => {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    return { result, timeMs: end - start };
  },
};
