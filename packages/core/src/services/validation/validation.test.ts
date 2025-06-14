import {
  ValidationService,
  ValidationErrorCodes,
  type ImportTransaction,
} from "./validation";
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
} from "../../models";

describe("ValidationService", () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  // ==================== Allocation Validation Tests ====================

  describe("validateAllocationBreakdown", () => {
    it("should validate correct allocation breakdown", async () => {
      const breakdown: AllocationBreakdown = {
        items: [
          { poolId: "pool1", amount: 100 },
          { poolId: "pool2", amount: 150 },
          { poolId: "pool3", amount: 50 },
        ],
        totalAmount: 300,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject breakdown with negative item amounts", async () => {
      const breakdown: AllocationBreakdown = {
        items: [
          { poolId: "pool1", amount: 100 },
          { poolId: "pool2", amount: -50 },
        ],
        totalAmount: 50,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
          field: "items.pool2.amount",
        })
      );
    });

    it("should reject breakdown with negative total amount", async () => {
      const breakdown: AllocationBreakdown = {
        items: [{ poolId: "pool1", amount: 100 }],
        totalAmount: -100,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
          field: "totalAmount",
        })
      );
    });
  });

  describe("validateAllocationStrategy", () => {
    const createValidStrategy = (): AllocationStrategy => ({
      id: "strategy1",
      budgetId: "budget1",
      name: "Test Strategy",
      effectiveFrom: new Date(),
      isActive: true,
      allocations: [
        { poolId: "pool1", proportion: 0.6 },
        { poolId: "pool2", proportion: 0.4 },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it("should validate correct allocation strategy", async () => {
      const strategy = createValidStrategy();
      const result =
        await validationService.validateAllocationStrategy(strategy);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject strategy with proportions not summing to 1.0", async () => {
      const strategy = createValidStrategy();
      strategy.allocations = [
        { poolId: "pool1", proportion: 0.6 },
        { poolId: "pool2", proportion: 0.3 }, // Sum = 0.9, not 1.0
      ];

      const result =
        await validationService.validateAllocationStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.ALLOCATION_SUM_INVALID,
          field: "allocations",
        })
      );
    });

    it("should reject strategy with negative proportions", async () => {
      const strategy = createValidStrategy();
      strategy.allocations = [
        { poolId: "pool1", proportion: 1.2 },
        { poolId: "pool2", proportion: -0.2 },
      ];

      const result =
        await validationService.validateAllocationStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
        })
      );
    });

    it("should reject strategy with proportions exceeding 1.0", async () => {
      const strategy = createValidStrategy();
      strategy.allocations = [{ poolId: "pool1", proportion: 1.5 }];

      const result =
        await validationService.validateAllocationStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.ALLOCATION_SUM_INVALID,
        })
      );
    });

    it("should handle floating point precision correctly", async () => {
      const strategy = createValidStrategy();
      strategy.allocations = [
        { poolId: "pool1", proportion: 0.1 },
        { poolId: "pool2", proportion: 0.2 },
        { poolId: "pool3", proportion: 0.7 }, // These sum to exactly 1.0
      ];

      const result =
        await validationService.validateAllocationStrategy(strategy);
      expect(result.isValid).toBe(true);
    });

    it("should reject empty allocation strategy", async () => {
      const strategy = createValidStrategy();
      strategy.allocations = [];

      const result =
        await validationService.validateAllocationStrategy(strategy);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.ALLOCATION_EMPTY,
        })
      );
    });
  });

  describe("validatePoolAllocation", () => {
    it("should validate allocation within available balance", async () => {
      const result = await validationService.validatePoolAllocation(
        "pool1",
        100,
        150
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject allocation exceeding available balance", async () => {
      const result = await validationService.validatePoolAllocation(
        "pool1",
        200,
        150
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.ALLOCATION_EXCEEDS_BALANCE,
        })
      );
    });

    it("should reject negative allocation amounts", async () => {
      const result = await validationService.validatePoolAllocation(
        "pool1",
        -50,
        150
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
        })
      );
    });

    it("should handle floating point precision in balance checking", async () => {
      // Allocation of 100.01 with balance of 100.00 should be rejected
      const result = await validationService.validatePoolAllocation(
        "pool1",
        100.02,
        100.0
      );
      expect(result.isValid).toBe(false);

      // But within tolerance should be accepted
      const result2 = await validationService.validatePoolAllocation(
        "pool1",
        100.005,
        100.0
      );
      expect(result2.isValid).toBe(true);
    });
  });

  // ==================== Transaction Validation Tests ====================

  describe("validateTransaction", () => {
    const createBaseTransaction = () => ({
      id: "trans1",
      budgetId: "budget1",
      date: new Date("2023-01-15"),
      description: "Test transaction",
      amount: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it("should validate basic transaction fields", async () => {
      const transaction = createBaseTransaction();
      const result = await validationService.validateTransaction(transaction);
      expect(result.isValid).toBe(true);
    });

    it("should reject transaction with empty description", async () => {
      const transaction = { ...createBaseTransaction(), description: "" };
      const result = await validationService.validateTransaction(transaction);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.TRANSACTION_DESCRIPTION_EMPTY,
        })
      );
    });

    it("should reject transaction with invalid amount", async () => {
      const transaction = { ...createBaseTransaction(), amount: 0 };
      const result = await validationService.validateTransaction(transaction);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.TRANSACTION_AMOUNT_INVALID,
        })
      );
    });

    it("should reject transaction with future date", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const transaction = { ...createBaseTransaction(), date: futureDate };
      const result = await validationService.validateTransaction(transaction);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.TRANSACTION_DATE_INVALID,
        })
      );
    });
  });

  describe("validateIncomeTransaction", () => {
    const createValidIncomeTransaction = (): IncomeTransaction => ({
      id: "income1",
      budgetId: "budget1",
      type: "income",
      date: new Date("2023-01-15"),
      description: "Salary",
      amount: 1000,
      channelId: "channel1",
      source: "Employer",
      allocationBreakdown: {
        items: [
          { poolId: "pool1", amount: 600 },
          { poolId: "pool2", amount: 400 },
        ],
        totalAmount: 1000,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it("should validate correct income transaction", async () => {
      const income = createValidIncomeTransaction();
      const result = await validationService.validateIncomeTransaction(income);
      expect(result.isValid).toBe(true);
    });

    it("should reject income with mismatched allocation total", async () => {
      const income = createValidIncomeTransaction();
      income.allocationBreakdown = {
        items: [
          { poolId: "pool1", amount: 600 },
          { poolId: "pool2", amount: 300 },
        ],
        totalAmount: 900, // Total 900, but transaction amount is 1000
      };

      const result = await validationService.validateIncomeTransaction(income);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
        })
      );
    });
  });

  describe("validateExpenseTransaction", () => {
    const createValidExpenseTransaction = (): ExpenseTransaction => ({
      id: "expense1",
      budgetId: "budget1",
      type: "expense",
      date: new Date("2023-01-15"),
      description: "Groceries",
      amount: 150,
      channelId: "channel1",
      category: {
        categoryId: "food",
        categoryName: "Food",
        subcategoryId: "groceries",
        subcategoryName: "Groceries",
      },
      allocationBreakdown: {
        items: [{ poolId: "pool1", amount: 150 }],
        totalAmount: 150,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it("should validate correct expense transaction", async () => {
      const expense = createValidExpenseTransaction();
      const result =
        await validationService.validateExpenseTransaction(expense);
      expect(result.isValid).toBe(true);
    });

    it("should reject expense with mismatched allocation total", async () => {
      const expense = createValidExpenseTransaction();
      expense.allocationBreakdown = {
        items: [{ poolId: "pool1", amount: 100 }],
        totalAmount: 100, // Total 100, but transaction amount is 150
      };

      const result =
        await validationService.validateExpenseTransaction(expense);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
        })
      );
    });
  });

  describe("validateTransferTransaction", () => {
    const createValidTransferTransaction = (): TransferTransaction => ({
      id: "transfer1",
      budgetId: "budget1",
      type: "transfer",
      date: new Date("2023-01-15"),
      description: "Transfer to savings",
      amount: 200,
      sourceChannelId: "checking",
      destinationChannelId: "savings",
      sourceAllocation: {
        items: [{ poolId: "pool1", amount: 200 }],
        totalAmount: 200,
      },
      destinationAllocation: {
        items: [{ poolId: "pool2", amount: 200 }],
        totalAmount: 200,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it("should validate correct transfer transaction", async () => {
      const transfer = createValidTransferTransaction();
      const result =
        await validationService.validateTransferTransaction(transfer);
      expect(result.isValid).toBe(true);
    });

    it("should reject transfer with mismatched source allocation total", async () => {
      const transfer = createValidTransferTransaction();
      transfer.sourceAllocation = {
        items: [{ poolId: "pool1", amount: 150 }],
        totalAmount: 150, // Total 150, but transaction amount is 200
      };

      const result =
        await validationService.validateTransferTransaction(transfer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
          field: "sourceAllocation",
        })
      );
    });

    it("should reject transfer with mismatched destination allocation total", async () => {
      const transfer = createValidTransferTransaction();
      transfer.destinationAllocation = {
        items: [{ poolId: "pool2", amount: 150 }],
        totalAmount: 150, // Total 150, but transaction amount is 200
      };

      const result =
        await validationService.validateTransferTransaction(transfer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
          field: "destinationAllocation",
        })
      );
    });

    it("should reject transfer between same channel and pools", async () => {
      const transfer = createValidTransferTransaction();
      transfer.sourceChannelId = "checking";
      transfer.destinationChannelId = "checking";
      transfer.sourceAllocation = {
        items: [{ poolId: "pool1", amount: 200 }],
        totalAmount: 200,
      };
      transfer.destinationAllocation = {
        items: [{ poolId: "pool1", amount: 200 }],
        totalAmount: 200,
      };

      const result =
        await validationService.validateTransferTransaction(transfer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.DATA_INTEGRITY_INVALID_STATE,
        })
      );
    });
  });

  // ==================== Credit Payment Validation Tests ====================

  describe("validateCreditPayment", () => {
    const createCreditPaymentTransfer = (): TransferTransaction => ({
      id: "payment1",
      budgetId: "budget1",
      type: "transfer",
      date: new Date("2023-01-15"),
      description: "Credit card payment",
      amount: 300,
      sourceChannelId: "checking",
      destinationChannelId: "credit-card",
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
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it("should validate correct credit payment", async () => {
      const payment = createCreditPaymentTransfer();
      const result = await validationService.validateCreditPayment(payment);
      expect(result.isValid).toBe(true);
    });

    it("should reject credit payment without source allocation", async () => {
      const payment = createCreditPaymentTransfer();
      payment.sourceAllocation = {
        items: [],
        totalAmount: 0,
      };

      const result = await validationService.validateCreditPayment(payment);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.CREDIT_PAYMENT_INVALID_SOURCE,
        })
      );
    });
  });

  describe("calculateMaxCreditPayment", () => {
    it("should calculate max payment based on available balances and debt", async () => {
      const sourceAllocation: AllocationBreakdown = {
        items: [
          { poolId: "pool1", amount: 200 },
          { poolId: "pool2", amount: 100 },
        ],
        totalAmount: 300,
      };

      const availableBalances = new Map([
        ["pool1", 300],
        ["pool2", 50],
      ]);

      const creditDebt = new Map([
        ["pool1", 150],
        ["pool2", 80],
      ]);

      const maxPayment = await validationService.calculateMaxCreditPayment(
        sourceAllocation,
        availableBalances,
        creditDebt
      );

      // pool1: min(300, 150) = 150
      // pool2: min(50, 80) = 50
      // total: 150 + 50 = 200
      expect(maxPayment).toBe(200);
    });

    it("should handle pools with no debt", async () => {
      const sourceAllocation: AllocationBreakdown = {
        items: [
          { poolId: "pool1", amount: 200 },
          { poolId: "pool2", amount: 100 },
        ],
        totalAmount: 300,
      };

      const availableBalances = new Map([
        ["pool1", 300],
        ["pool2", 50],
      ]);

      const creditDebt = new Map([
        ["pool1", 150],
        // pool2 has no debt
      ]);

      const maxPayment = await validationService.calculateMaxCreditPayment(
        sourceAllocation,
        availableBalances,
        creditDebt
      );

      // pool1: min(300, 150) = 150
      // pool2: min(50, 0) = 0
      // total: 150 + 0 = 150
      expect(maxPayment).toBe(150);
    });
  });

  // ==================== Balance Validation Tests ====================

  describe("validateBalanceConsistency", () => {
    const createValidPoolBalance = (): PoolBalance => ({
      poolId: "pool1",
      channelId: "channel1",
      amount: 100,
    });

    it("should validate positive balances", async () => {
      const balances = [createValidPoolBalance()];
      const result =
        await validationService.validateBalanceConsistency(balances);
      expect(result.isValid).toBe(true);
    });

    it("should flag negative balances", async () => {
      const balance = createValidPoolBalance();
      balance.amount = -50;

      const result = await validationService.validateBalanceConsistency([
        balance,
      ]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.BALANCE_NEGATIVE,
        })
      );
    });
  });

  describe("validatePoolChannelBalance", () => {
    it("should validate matching balances", async () => {
      const result = await validationService.validatePoolChannelBalance(
        "pool1",
        "channel1",
        100.0,
        100.0
      );
      expect(result.isValid).toBe(true);
    });

    it("should reject mismatched balances", async () => {
      const result = await validationService.validatePoolChannelBalance(
        "pool1",
        "channel1",
        100.0,
        95.0
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.BALANCE_INCONSISTENT,
        })
      );
    });

    it("should handle floating point precision in balance comparison", async () => {
      // Small difference within tolerance should be valid
      const result = await validationService.validatePoolChannelBalance(
        "pool1",
        "channel1",
        100.0,
        100.005
      );
      expect(result.isValid).toBe(true);

      // Larger difference should be invalid
      const result2 = await validationService.validatePoolChannelBalance(
        "pool1",
        "channel1",
        100.0,
        100.02
      );
      expect(result2.isValid).toBe(false);
    });
  });

  describe("validateCurrentBalance", () => {
    const createValidCurrentBalance = (): CurrentBalance => ({
      id: "currentBalance1",
      budgetId: "budget1",
      balances: [
        { poolId: "pool1", channelId: "channel1", amount: 100 },
        { poolId: "pool2", channelId: "channel1", amount: 50 },
      ],
      lastUpdated: new Date(),
      updatedBy: "user1",
    });

    it("should validate correct current balance", async () => {
      const currentBalance = createValidCurrentBalance();
      const result =
        await validationService.validateCurrentBalance(currentBalance);
      expect(result.isValid).toBe(true);
    });

    it("should reject current balance with invalid pool balances", async () => {
      const currentBalance = createValidCurrentBalance();
      currentBalance.balances[0].amount = -100; // This will trigger a negative balance warning

      const result =
        await validationService.validateCurrentBalance(currentBalance);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.BALANCE_NEGATIVE,
        })
      );
    });
  });

  describe("validateBalanceSnapshot", () => {
    const createValidBalanceSnapshot = (): BalanceSnapshot => ({
      id: "snapshot1",
      budgetId: "budget1",
      snapshotDate: new Date("2023-01-15"),
      balances: [
        { poolId: "pool1", channelId: "channel1", amount: 100 },
        { poolId: "pool2", channelId: "channel1", amount: 50 },
      ],
      createdAt: new Date("2023-01-15"),
      reason: "manual_snapshot",
    });

    it("should validate correct balance snapshot", async () => {
      const snapshot = createValidBalanceSnapshot();
      const result = await validationService.validateBalanceSnapshot(snapshot);
      expect(result.isValid).toBe(true);
    });

    it("should reject snapshot with future date", async () => {
      const snapshot = createValidBalanceSnapshot();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      snapshot.snapshotDate = futureDate;

      const result = await validationService.validateBalanceSnapshot(snapshot);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.TRANSACTION_DATE_INVALID,
        })
      );
    });

    it("should reject snapshot with invalid pool balances", async () => {
      const snapshot = createValidBalanceSnapshot();
      snapshot.balances[0].amount = -100; // This will trigger a negative balance warning

      const result = await validationService.validateBalanceSnapshot(snapshot);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.BALANCE_NEGATIVE,
        })
      );
    });
  });

  // ==================== Data Integrity Validation Tests ====================

  describe("validateBudgetIntegrity", () => {
    const createTestData = () => {
      const pools: Pool[] = [
        {
          id: "pool1",
          budgetId: "budget1",
          name: "Emergency Fund",
          purposeType: "saving",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pool2",
          budgetId: "budget1",
          name: "Groceries",
          purposeType: "spending",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const channels: Channel[] = [
        {
          id: "channel1",
          budgetId: "budget1",
          name: "Checking",
          type: "checking",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const transactions: ExpenseTransaction[] = [
        {
          id: "trans1",
          budgetId: "budget1",
          type: "expense",
          date: new Date(),
          description: "Groceries",
          amount: 50,
          channelId: "channel1",
          category: {
            categoryId: "food",
            categoryName: "Food",
            subcategoryId: "groceries",
            subcategoryName: "Groceries",
          },
          allocationBreakdown: {
            items: [{ poolId: "pool2", amount: 50 }],
            totalAmount: 50,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const allocationStrategies: AllocationStrategy[] = [
        {
          id: "strategy1",
          budgetId: "budget1",
          name: "Default",
          effectiveFrom: new Date(),
          isActive: true,
          allocations: [
            { poolId: "pool1", proportion: 0.5 },
            { poolId: "pool2", proportion: 0.5 },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      return { pools, channels, transactions, allocationStrategies };
    };

    it("should validate consistent budget data", async () => {
      const { pools, channels, transactions, allocationStrategies } =
        createTestData();

      const result = await validationService.validateBudgetIntegrity(
        pools,
        channels,
        transactions,
        allocationStrategies
      );

      expect(result.isValid).toBe(true);
    });

    it("should detect orphaned pool references in transactions", async () => {
      const { pools, channels, transactions, allocationStrategies } =
        createTestData();

      // Add transaction referencing non-existent pool
      transactions.push({
        id: "trans2",
        budgetId: "budget1",
        type: "expense",
        date: new Date(),
        description: "Invalid expense",
        amount: 25,
        channelId: "channel1",
        category: {
          categoryId: "food",
          categoryName: "Food",
          subcategoryId: "groceries",
          subcategoryName: "Groceries",
        },
        allocationBreakdown: {
          items: [{ poolId: "non-existent-pool", amount: 25 }],
          totalAmount: 25,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await validationService.validateBudgetIntegrity(
        pools,
        channels,
        transactions,
        allocationStrategies
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
        })
      );
    });

    it("should detect orphaned channel references in transactions", async () => {
      const { pools, channels, transactions, allocationStrategies } =
        createTestData();

      // Add transaction referencing non-existent channel
      transactions.push({
        id: "trans2",
        budgetId: "budget1",
        type: "expense",
        date: new Date(),
        description: "Invalid expense",
        amount: 25,
        channelId: "non-existent-channel",
        category: {
          categoryId: "food",
          categoryName: "Food",
          subcategoryId: "groceries",
          subcategoryName: "Groceries",
        },
        allocationBreakdown: {
          items: [{ poolId: "pool2", amount: 25 }],
          totalAmount: 25,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await validationService.validateBudgetIntegrity(
        pools,
        channels,
        transactions,
        allocationStrategies
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
        })
      );
    });
  });

  // ==================== Import Validation Tests ====================

  describe("validateImportData", () => {
    const createValidImportTransaction = (): ImportTransaction => ({
      date: "2023-01-15",
      description: "Test expense",
      amount: 50,
      type: "expense",
      category: "Food",
    });

    it("should validate correct import data", async () => {
      const importData = [createValidImportTransaction()];
      const result = await validationService.validateImportData(importData);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });

    it("should reject transactions with missing required fields", async () => {
      const importData: ImportTransaction[] = [
        {
          date: "2023-01-15",
          description: "",
          amount: 50,
          type: "expense",
        },
        {
          date: "",
          description: "Test",
          amount: 0,
          type: "expense",
        },
      ];

      const result = await validationService.validateImportData(importData);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(2);

      expect(result.invalid[0].errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.IMPORT_MISSING_REQUIRED_FIELD,
          field: "description",
        })
      );

      expect(result.invalid[1].errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.IMPORT_MISSING_REQUIRED_FIELD,
          field: "date",
        })
      );
    });

    it("should reject transactions with invalid date formats", async () => {
      const importData: ImportTransaction[] = [
        {
          date: "invalid-date",
          description: "Test expense",
          amount: 50,
          type: "expense",
        },
      ];

      const result = await validationService.validateImportData(importData);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.IMPORT_INVALID_DATE,
        })
      );
    });

    it("should reject transactions with invalid amounts", async () => {
      const importData: ImportTransaction[] = [
        {
          date: "2023-01-15",
          description: "Test expense",
          amount: NaN,
          type: "expense",
        },
        {
          date: "2023-01-15",
          description: "Test expense",
          amount: 0,
          type: "expense",
        },
      ];

      const result = await validationService.validateImportData(importData);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(2);

      result.invalid.forEach((invalid) => {
        expect(invalid.errors).toContainEqual(
          expect.objectContaining({
            code: ValidationErrorCodes.IMPORT_INVALID_AMOUNT,
          })
        );
      });
    });

    it("should reject transactions with invalid types", async () => {
      const importData: ImportTransaction[] = [
        {
          date: "2023-01-15",
          description: "Test transaction",
          amount: 50,
          type: "invalid-type" as any,
        },
      ];

      const result = await validationService.validateImportData(importData);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCodes.IMPORT_MISSING_REQUIRED_FIELD,
          field: "type",
        })
      );
    });
  });

  // ==================== Edge Cases and Error Handling ====================

  describe("edge cases and error handling", () => {
    it("should handle null and undefined inputs gracefully", async () => {
      // Test with null breakdown
      const result1 = await validationService.validateAllocationBreakdown(
        null as any
      );
      expect(result1.isValid).toBe(false);

      // Test with undefined breakdown
      const result2 = await validationService.validateAllocationBreakdown(
        undefined as any
      );
      expect(result2.isValid).toBe(false);
    });

    it("should handle very small floating point differences", async () => {
      const strategy: AllocationStrategy = {
        id: "strategy1",
        budgetId: "budget1",
        name: "Test Strategy",
        effectiveFrom: new Date(),
        isActive: true,
        allocations: [
          { poolId: "pool1", proportion: 0.33333333 },
          { poolId: "pool2", proportion: 0.33333333 },
          { poolId: "pool3", proportion: 0.33333334 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result =
        await validationService.validateAllocationStrategy(strategy);
      expect(result.isValid).toBe(true);
    });

    it("should handle large numbers correctly", async () => {
      const breakdown: AllocationBreakdown = {
        items: [
          { poolId: "pool1", amount: 1000000.01 },
          { poolId: "pool2", amount: 999999.99 },
        ],
        totalAmount: 2000000.0,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);
      expect(result.isValid).toBe(true);
    });
  });
});
