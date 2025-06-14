import { ValidationService, ValidationErrorCodes } from "./validation";
import { createTestData } from "./test-helpers";

describe("ValidationService", () => {
  let validationService;
  let testData;

  beforeEach(() => {
    validationService = new ValidationService();
    testData = createTestData();
  });

  // ==================== Allocation Breakdown Validations ====================

  describe("validateAllocationBreakdown", () => {
    it("should validate a valid allocation breakdown", async () => {
      const breakdown = {
        items: [
          { poolId: "pool1", amount: 100 },
          { poolId: "pool2", amount: 50 },
        ],
        totalAmount: 150,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject allocation with negative amounts", async () => {
      const breakdown = {
        items: [
          { poolId: "pool1", amount: -100 },
          { poolId: "pool2", amount: 50 },
        ],
        totalAmount: -50,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
            field: "items.pool1.amount",
          }),
        ])
      );
    });

    it("should reject allocation with negative total amount", async () => {
      const breakdown = {
        items: [{ poolId: "pool1", amount: 100 }],
        totalAmount: -100,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
            field: "totalAmount",
          }),
        ])
      );
    });

    it("should reject allocation where items sum does not match total", async () => {
      const breakdown = {
        items: [
          { poolId: "pool1", amount: 100 },
          { poolId: "pool2", amount: 50 },
        ],
        totalAmount: 200, // Should be 150
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
          }),
        ])
      );
    });

    it("should reject allocation with duplicate pools", async () => {
      const breakdown = {
        items: [
          { poolId: "pool1", amount: 100 },
          { poolId: "pool1", amount: 50 }, // Duplicate
        ],
        totalAmount: 150,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
          }),
        ])
      );
    });

    it("should handle floating point precision correctly", async () => {
      const breakdown = {
        items: [
          { poolId: "pool1", amount: 33.33 },
          { poolId: "pool2", amount: 33.33 },
          { poolId: "pool3", amount: 33.34 },
        ],
        totalAmount: 100.0,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);

      expect(result.isValid).toBe(true);
    });
  });

  // ==================== Allocation Strategy Validations ====================

  describe("validateAllocationStrategy", () => {
    it("should validate a valid allocation strategy", async () => {
      const strategy = testData.validAllocationStrategy;

      const result =
        await validationService.validateAllocationStrategy(strategy);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject strategy with proportions not summing to 1.0", async () => {
      const strategy = {
        ...testData.validAllocationStrategy,
        allocations: [
          { poolId: "pool1", proportion: 0.6 },
          { poolId: "pool2", proportion: 0.3 }, // Total = 0.9, should be 1.0
        ],
      };

      const result =
        await validationService.validateAllocationStrategy(strategy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.ALLOCATION_SUM_INVALID,
            field: "allocations",
          }),
        ])
      );
    });

    it("should reject strategy with negative proportions", async () => {
      const strategy = {
        ...testData.validAllocationStrategy,
        allocations: [
          { poolId: "pool1", proportion: -0.5 },
          { poolId: "pool2", proportion: 1.5 },
        ],
      };

      const result =
        await validationService.validateAllocationStrategy(strategy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
            field: "allocations.pool1.proportion",
          }),
        ])
      );
    });

    it("should reject strategy with proportions exceeding 1.0", async () => {
      const strategy = {
        ...testData.validAllocationStrategy,
        allocations: [
          { poolId: "pool1", proportion: 1.5 }, // Exceeds 100%
        ],
      };

      const result =
        await validationService.validateAllocationStrategy(strategy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.ALLOCATION_SUM_INVALID,
            field: "allocations.pool1.proportion",
          }),
        ])
      );
    });

    it("should reject strategy with duplicate pools", async () => {
      const strategy = {
        ...testData.validAllocationStrategy,
        allocations: [
          { poolId: "pool1", proportion: 0.5 },
          { poolId: "pool1", proportion: 0.5 }, // Duplicate
        ],
      };

      const result =
        await validationService.validateAllocationStrategy(strategy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.ALLOCATION_DUPLICATE_POOL,
          }),
        ])
      );
    });

    it("should reject strategy with no allocations", async () => {
      const strategy = {
        ...testData.validAllocationStrategy,
        allocations: [],
      };

      const result =
        await validationService.validateAllocationStrategy(strategy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.ALLOCATION_EMPTY,
          }),
        ])
      );
    });

    it("should handle floating point precision in proportions", async () => {
      const strategy = {
        ...testData.validAllocationStrategy,
        allocations: [
          { poolId: "pool1", proportion: 0.333333 },
          { poolId: "pool2", proportion: 0.333333 },
          { poolId: "pool3", proportion: 0.333334 }, // Total = 1.000000
        ],
      };

      const result =
        await validationService.validateAllocationStrategy(strategy);

      expect(result.isValid).toBe(true);
    });
  });

  // ==================== Pool Allocation Validations ====================

  describe("validatePoolAllocation", () => {
    it("should validate allocation within available balance", async () => {
      const result = await validationService.validatePoolAllocation(
        "pool1",
        100,
        150 // Available balance
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject allocation exceeding available balance", async () => {
      const result = await validationService.validatePoolAllocation(
        "pool1",
        200,
        150 // Available balance
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.ALLOCATION_EXCEEDS_BALANCE,
            field: "amount",
          }),
        ])
      );
    });

    it("should reject negative allocation amounts", async () => {
      const result = await validationService.validatePoolAllocation(
        "pool1",
        -50,
        150
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
            field: "amount",
          }),
        ])
      );
    });

    it("should handle small tolerance for floating point precision", async () => {
      const result = await validationService.validatePoolAllocation(
        "pool1",
        100.005, // Slightly over due to floating point
        100
      );

      expect(result.isValid).toBe(true); // Within tolerance
    });
  });

  // ==================== Transaction Validations ====================

  describe("validateIncomeTransaction", () => {
    it("should validate a valid income transaction", async () => {
      const income = testData.validIncomeTransaction;

      const result = await validationService.validateIncomeTransaction(income);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject income with mismatched allocation total", async () => {
      const income = {
        ...testData.validIncomeTransaction,
        amount: 1000,
        allocationBreakdown: {
          items: [{ poolId: "pool1", amount: 500 }],
          totalAmount: 500, // Should be 1000
        },
      };

      const result = await validationService.validateIncomeTransaction(income);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
            field: "allocationBreakdown",
          }),
        ])
      );
    });

    it("should reject income with negative amount", async () => {
      const income = {
        ...testData.validIncomeTransaction,
        amount: -1000,
      };

      const result = await validationService.validateIncomeTransaction(income);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
          }),
        ])
      );
    });

    it("should reject income with future date", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const income = {
        ...testData.validIncomeTransaction,
        date: futureDate,
      };

      const result = await validationService.validateIncomeTransaction(income);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.TRANSACTION_DATE_INVALID,
            field: "date",
          }),
        ])
      );
    });
  });

  describe("validateExpenseTransaction", () => {
    it("should validate a valid expense transaction", async () => {
      const expense = testData.validExpenseTransaction;

      const result =
        await validationService.validateExpenseTransaction(expense);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject expense with mismatched allocation total", async () => {
      const expense = {
        ...testData.validExpenseTransaction,
        amount: 100,
        allocationBreakdown: {
          items: [{ poolId: "pool1", amount: 150 }],
          totalAmount: 150, // Should be 100
        },
      };

      const result =
        await validationService.validateExpenseTransaction(expense);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
          }),
        ])
      );
    });
  });

  describe("validateTransferTransaction", () => {
    it("should validate a valid transfer transaction", async () => {
      const transfer = testData.validTransferTransaction;

      const result =
        await validationService.validateTransferTransaction(transfer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject transfer with mismatched source allocation", async () => {
      const transfer = {
        ...testData.validTransferTransaction,
        amount: 100,
        sourceAllocation: {
          items: [{ poolId: "pool1", amount: 150 }],
          totalAmount: 150, // Should be 100
        },
      };

      const result =
        await validationService.validateTransferTransaction(transfer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
            field: "sourceAllocation",
          }),
        ])
      );
    });

    it("should reject transfer with mismatched destination allocation", async () => {
      const transfer = {
        ...testData.validTransferTransaction,
        amount: 100,
        destinationAllocation: {
          items: [{ poolId: "pool1", amount: 50 }],
          totalAmount: 50, // Should be 100
        },
      };

      const result =
        await validationService.validateTransferTransaction(transfer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
            field: "destinationAllocation",
          }),
        ])
      );
    });

    it("should reject transfer between same channel and pools", async () => {
      const transfer = {
        ...testData.validTransferTransaction,
        sourceChannelId: "channel1",
        destinationChannelId: "channel1", // Same channel
        sourceAllocation: {
          items: [{ poolId: "pool1", amount: 100 }],
          totalAmount: 100,
        },
        destinationAllocation: {
          items: [{ poolId: "pool1", amount: 100 }], // Same pool
          totalAmount: 100,
        },
      };

      const result =
        await validationService.validateTransferTransaction(transfer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.DATA_INTEGRITY_INVALID_STATE,
          }),
        ])
      );
    });
  });

  // ==================== Credit Payment Validations ====================

  describe("validateCreditPayment", () => {
    it("should validate a valid credit payment", async () => {
      const creditPayment = testData.validCreditPayment;

      const result =
        await validationService.validateCreditPayment(creditPayment);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject credit payment without source allocation", async () => {
      const creditPayment = {
        ...testData.validCreditPayment,
        sourceAllocation: {
          items: [],
          totalAmount: 0,
        },
      };

      const result =
        await validationService.validateCreditPayment(creditPayment);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.CREDIT_PAYMENT_INVALID_SOURCE,
          }),
        ])
      );
    });
  });

  describe("calculateMaxCreditPayment", () => {
    it("should calculate maximum payment correctly", async () => {
      const sourceAllocation = {
        items: [
          { poolId: "pool1", amount: 100 },
          { poolId: "pool2", amount: 50 },
        ],
        totalAmount: 150,
      };

      const availableBalances = new Map([
        ["pool1", 80], // Less than requested
        ["pool2", 60], // More than requested
      ]);

      const creditDebt = new Map([
        ["pool1", 200], // More debt than available
        ["pool2", 30], // Less debt than available
      ]);

      const maxPayment = await validationService.calculateMaxCreditPayment(
        sourceAllocation,
        availableBalances,
        creditDebt
      );

      // Should be min(80, 200) + min(60, 30) = 80 + 30 = 110
      expect(maxPayment).toBe(110);
    });

    it("should handle pools with no available balance", async () => {
      const sourceAllocation = {
        items: [{ poolId: "pool1", amount: 100 }],
        totalAmount: 100,
      };

      const availableBalances = new Map([["pool1", 0]]);
      const creditDebt = new Map([["pool1", 100]]);

      const maxPayment = await validationService.calculateMaxCreditPayment(
        sourceAllocation,
        availableBalances,
        creditDebt
      );

      expect(maxPayment).toBe(0);
    });

    it("should handle pools with no debt", async () => {
      const sourceAllocation = {
        items: [{ poolId: "pool1", amount: 100 }],
        totalAmount: 100,
      };

      const availableBalances = new Map([["pool1", 100]]);
      const creditDebt = new Map([["pool1", 0]]);

      const maxPayment = await validationService.calculateMaxCreditPayment(
        sourceAllocation,
        availableBalances,
        creditDebt
      );

      expect(maxPayment).toBe(0);
    });
  });

  // ==================== Balance Validations ====================

  describe("validateBalanceConsistency", () => {
    it("should validate consistent balances", async () => {
      const balances = testData.validPoolBalances;

      const result =
        await validationService.validateBalanceConsistency(balances);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should flag negative balances", async () => {
      const balances = [
        { poolId: "pool1", channelId: "channel1", amount: -100 },
      ];

      const result =
        await validationService.validateBalanceConsistency(balances);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.BALANCE_NEGATIVE,
          }),
        ])
      );
    });
  });

  describe("validatePoolChannelBalance", () => {
    it("should validate matching balances", async () => {
      const result = await validationService.validatePoolChannelBalance(
        "pool1",
        "channel1",
        100, // Expected
        100 // Actual
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject mismatched balances", async () => {
      const result = await validationService.validatePoolChannelBalance(
        "pool1",
        "channel1",
        100, // Expected
        150 // Actual
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.BALANCE_INCONSISTENT,
          }),
        ])
      );
    });

    it("should handle small tolerance for floating point", async () => {
      const result = await validationService.validatePoolChannelBalance(
        "pool1",
        "channel1",
        100.0, // Expected
        100.005 // Actual (within tolerance)
      );

      expect(result.isValid).toBe(true);
    });
  });

  // ==================== Data Integrity Validations ====================

  describe("validateBudgetIntegrity", () => {
    it("should validate budget with consistent references", async () => {
      const { pools, channels, transactions, allocationStrategies } = testData;

      const result = await validationService.validateBudgetIntegrity(
        pools,
        channels,
        transactions,
        allocationStrategies
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect orphaned channel references in transactions", async () => {
      const { pools, channels, allocationStrategies } = testData;

      const transactionWithOrphanedChannel = {
        ...testData.validIncomeTransaction,
        channelId: "non-existent-channel",
      };

      const result = await validationService.validateBudgetIntegrity(
        pools,
        channels,
        [transactionWithOrphanedChannel],
        allocationStrategies
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
          }),
        ])
      );
    });

    it("should detect orphaned pool references in allocations", async () => {
      const { pools, channels, allocationStrategies } = testData;

      const transactionWithOrphanedPool = {
        ...testData.validIncomeTransaction,
        allocationBreakdown: {
          items: [{ poolId: "non-existent-pool", amount: 100 }],
          totalAmount: 100,
        },
      };

      const result = await validationService.validateBudgetIntegrity(
        pools,
        channels,
        [transactionWithOrphanedPool],
        allocationStrategies
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
          }),
        ])
      );
    });

    it("should detect orphaned pools in allocation strategies", async () => {
      const { pools, channels, transactions } = testData;

      const strategyWithOrphanedPool = {
        ...testData.validAllocationStrategy,
        allocations: [{ poolId: "non-existent-pool", proportion: 1.0 }],
      };

      const result = await validationService.validateBudgetIntegrity(
        pools,
        channels,
        transactions,
        [strategyWithOrphanedPool]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
          }),
        ])
      );
    });
  });

  describe("validateTransactionIntegrity", () => {
    it("should validate transaction with existing references", async () => {
      const existingPoolIds = new Set(["pool1", "pool2"]);
      const existingChannelIds = new Set(["channel1", "channel2"]);

      const result = await validationService.validateTransactionIntegrity(
        testData.validIncomeTransaction,
        existingPoolIds,
        existingChannelIds
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject transaction with non-existent channel", async () => {
      const existingPoolIds = new Set(["pool1", "pool2"]);
      const existingChannelIds = new Set(["channel2"]); // Missing channel1

      const result = await validationService.validateTransactionIntegrity(
        testData.validIncomeTransaction,
        existingPoolIds,
        existingChannelIds
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.TRANSACTION_CHANNEL_NOT_FOUND,
          }),
        ])
      );
    });

    it("should reject transaction with non-existent pool", async () => {
      const existingPoolIds = new Set(["pool2"]); // Missing pool1
      const existingChannelIds = new Set(["channel1", "channel2"]);

      const result = await validationService.validateTransactionIntegrity(
        testData.validIncomeTransaction,
        existingPoolIds,
        existingChannelIds
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.TRANSACTION_POOL_NOT_FOUND,
          }),
        ])
      );
    });
  });

  // ==================== Import Validations ====================

  describe("validateImportData", () => {
    it("should validate correctly formatted import data", async () => {
      const importData = [
        {
          date: "2024-01-15",
          description: "Salary",
          amount: 3000,
          type: "income",
        },
        {
          date: "2024-01-16",
          description: "Groceries",
          amount: 150,
          type: "expense",
          category: "Food",
        },
      ];

      const result = await validationService.validateImportData(importData);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
    });

    it("should reject import with missing required fields", async () => {
      const importData = [
        {
          date: "",
          description: "",
          amount: 0,
          type: "invalid",
        },
      ];

      const result = await validationService.validateImportData(importData);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.IMPORT_MISSING_REQUIRED_FIELD,
            field: "date",
          }),
        ])
      );
      expect(result.invalid[0].errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.IMPORT_MISSING_REQUIRED_FIELD,
            field: "description",
          }),
        ])
      );
      expect(result.invalid[0].errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.IMPORT_MISSING_REQUIRED_FIELD,
            field: "type",
          }),
        ])
      );
    });

    it("should reject import with invalid date format", async () => {
      const importData = [
        {
          date: "invalid-date",
          description: "Test",
          amount: 100,
          type: "income",
        },
      ];

      const result = await validationService.validateImportData(importData);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: ValidationErrorCodes.IMPORT_INVALID_DATE,
            field: "date",
          }),
        ])
      );
    });

    it("should reject import with invalid amounts", async () => {
      const importData = [
        {
          date: "2024-01-15",
          description: "Test",
          amount: "invalid",
          type: "income",
        },
        {
          date: "2024-01-15",
          description: "Test Zero",
          amount: 0,
          type: "income",
        },
        {
          date: "2024-01-15",
          description: "Test NaN",
          amount: NaN,
          type: "income",
        },
      ];

      const result = await validationService.validateImportData(importData);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(3);

      result.invalid.forEach((item) => {
        expect(item.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: ValidationErrorCodes.IMPORT_INVALID_AMOUNT,
              field: "amount",
            }),
          ])
        );
      });
    });

    it("should handle mixed valid and invalid import data", async () => {
      const importData = [
        {
          date: "2024-01-15",
          description: "Valid Transaction",
          amount: 100,
          type: "income",
        },
        {
          date: "invalid-date",
          description: "Invalid Transaction",
          amount: "invalid",
          type: "invalid",
        },
      ];

      const result = await validationService.validateImportData(importData);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(1);
      expect(result.valid[0].description).toBe("Valid Transaction");
      expect(result.invalid[0].transaction.description).toBe(
        "Invalid Transaction"
      );
    });
  });

  // ==================== Edge Cases and Complex Scenarios ====================

  describe("Edge Cases", () => {
    it("should handle very small amounts near floating point precision", async () => {
      const breakdown = {
        items: [
          { poolId: "pool1", amount: 0.01 },
          { poolId: "pool2", amount: 0.005 },
          { poolId: "pool3", amount: 0.004 },
        ],
        totalAmount: 0.019,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);

      expect(result.isValid).toBe(true);
    });

    it("should handle large numbers correctly", async () => {
      const largeAmount = 999999999.99;
      const breakdown = {
        items: [{ poolId: "pool1", amount: largeAmount }],
        totalAmount: largeAmount,
      };

      const result =
        await validationService.validateAllocationBreakdown(breakdown);

      expect(result.isValid).toBe(true);
    });

    it("should validate complex transfer with multiple pools", async () => {
      const complexTransfer = {
        ...testData.validTransferTransaction,
        sourceAllocation: {
          items: [
            { poolId: "pool1", amount: 300 },
            { poolId: "pool2", amount: 200 },
            { poolId: "pool3", amount: 500 },
          ],
          totalAmount: 1000,
        },
        destinationAllocation: {
          items: [
            { poolId: "pool1", amount: 600 },
            { poolId: "pool4", amount: 400 },
          ],
          totalAmount: 1000,
        },
        amount: 1000,
      };

      const result =
        await validationService.validateTransferTransaction(complexTransfer);

      expect(result.isValid).toBe(true);
    });
  });

  // ==================== Performance Tests ====================

  describe("Performance", () => {
    it("should handle large datasets efficiently", async () => {
      const largeAllocationStrategy = {
        ...testData.validAllocationStrategy,
        allocations: Array.from({ length: 100 }, (_, i) => ({
          poolId: `pool${i}`,
          proportion: 0.01,
        })),
      };

      const startTime = Date.now();
      const result = await validationService.validateAllocationStrategy(
        largeAllocationStrategy
      );
      const endTime = Date.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it("should validate large transaction sets efficiently", async () => {
      const pools = Array.from({ length: 50 }, (_, i) =>
        testData.createPool(`pool${i}`)
      );
      const channels = Array.from({ length: 10 }, (_, i) =>
        testData.createChannel(`channel${i}`)
      );
      const transactions = Array.from({ length: 1000 }, (_, i) =>
        testData.createIncomeTransaction(
          `trans${i}`,
          pools[0].id,
          channels[0].id
        )
      );
      const strategies = [testData.validAllocationStrategy];

      const startTime = Date.now();
      const result = await validationService.validateBudgetIntegrity(
        pools,
        channels,
        transactions,
        strategies
      );
      const endTime = Date.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
