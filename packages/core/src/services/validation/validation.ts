// packages/core/src/services/validation.ts

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
  AllocationStrategySchema,
  IncomeTransactionSchema,
  ExpenseTransactionSchema,
  TransferTransactionSchema,
  AllocationBreakdownSchema,
  PoolBalanceSchema,
  CurrentBalanceSchema,
  BalanceSnapshotSchema,
} from "../../models";
import { ValidationErrorCodes } from "../constants/validation-errors";
import { ImportTransaction, ValidationError, ValidationResult } from "./types";

export class ValidationService {
  private readonly ALLOCATION_TOLERANCE = 0.01; // Allow 1 cent tolerance for floating point precision
  private readonly PERCENTAGE_TOLERANCE = 0.0001; // Allow 0.01% tolerance for percentage calculations

  // ==================== Allocation Validations ====================

  /**
   * Validates allocation breakdown structure and totals
   */
  async validateAllocationBreakdown(
    breakdown: AllocationBreakdown
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Schema validation (includes built-in refinements for sum and duplicates)
    const schemaResult = AllocationBreakdownSchema.safeParse(breakdown);
    if (!schemaResult.success) {
      errors.push({
        code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
        message: "Allocation breakdown schema validation failed",
        details: { zodErrors: schemaResult.error.errors },
      });
      return { isValid: false, errors };
    }

    // Additional validation: check for negative amounts in individual items
    for (const item of breakdown.items) {
      if (item.amount < 0) {
        errors.push({
          field: `items.${item.poolId}.amount`,
          code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
          message: `Allocation amount cannot be negative for pool ${item.poolId}`,
          details: { poolId: item.poolId, amount: item.amount },
        });
      }
    }

    // Validate total amount is positive
    if (breakdown.totalAmount <= 0) {
      errors.push({
        field: "totalAmount",
        code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
        message: "Total allocation amount must be positive",
        details: { totalAmount: breakdown.totalAmount },
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates allocation strategy proportions sum to 1.0
   */
  async validateAllocationStrategy(
    strategy: AllocationStrategy
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // First validate the schema
    const schemaResult = AllocationStrategySchema.safeParse(strategy);
    if (!schemaResult.success) {
      errors.push({
        code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
        message: "Allocation strategy schema validation failed",
        details: { zodErrors: schemaResult.error.errors },
      });
      return { isValid: false, errors };
    }

    if (!strategy.allocations || strategy.allocations.length === 0) {
      errors.push({
        code: ValidationErrorCodes.ALLOCATION_EMPTY,
        message: "Allocation strategy must have at least one allocation",
      });
      return { isValid: false, errors };
    }

    // Check for duplicate pools
    const poolIds = strategy.allocations.map((a) => a.poolId);
    const uniquePoolIds = new Set(poolIds);
    if (poolIds.length !== uniquePoolIds.size) {
      errors.push({
        code: ValidationErrorCodes.ALLOCATION_DUPLICATE_POOL,
        message: "Duplicate pool allocations in strategy",
      });
    }

    // Check proportions sum to 1.0
    const totalProportion = strategy.allocations.reduce(
      (sum, allocation) => sum + allocation.proportion,
      0
    );
    if (Math.abs(totalProportion - 1.0) > this.PERCENTAGE_TOLERANCE) {
      errors.push({
        field: "allocations",
        code: ValidationErrorCodes.ALLOCATION_SUM_INVALID,
        message: `Allocation proportions must sum to 100% (1.0), got ${(totalProportion * 100).toFixed(2)}%`,
        details: { totalProportion, expected: 1.0 },
      });
    }

    // Check individual proportions
    for (const allocation of strategy.allocations) {
      if (allocation.proportion < 0) {
        errors.push({
          field: `allocations.${allocation.poolId}.proportion`,
          code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
          message: `Allocation proportion cannot be negative for pool ${allocation.poolId}`,
          details: {
            poolId: allocation.poolId,
            proportion: allocation.proportion,
          },
        });
      }
      if (allocation.proportion > 1.0) {
        errors.push({
          field: `allocations.${allocation.poolId}.proportion`,
          code: ValidationErrorCodes.ALLOCATION_SUM_INVALID,
          message: `Allocation proportion cannot exceed 100% for pool ${allocation.poolId}`,
          details: {
            poolId: allocation.poolId,
            proportion: allocation.proportion,
          },
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates pool allocation against available balance
   */
  async validatePoolAllocation(
    poolId: string,
    amount: number,
    availableBalance: number
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (amount < 0) {
      errors.push({
        field: "amount",
        code: ValidationErrorCodes.ALLOCATION_NEGATIVE_AMOUNT,
        message: "Allocation amount cannot be negative",
        details: { poolId, amount },
      });
    }

    if (amount > availableBalance + this.ALLOCATION_TOLERANCE) {
      errors.push({
        field: "amount",
        code: ValidationErrorCodes.ALLOCATION_EXCEEDS_BALANCE,
        message: `Allocation amount (${amount}) exceeds available balance (${availableBalance}) for pool ${poolId}`,
        details: { poolId, amount, availableBalance },
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  // ==================== Transaction Validations ====================

  /**
   * Generic transaction validation
   */
  async validateTransaction(
    transaction: Partial<
      IncomeTransaction | ExpenseTransaction | TransferTransaction
    >
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Basic field validations
    if (!transaction.notes || transaction.notes.trim().length === 0) {
      errors.push({
        field: "notes",
        code: ValidationErrorCodes.TRANSACTION_DESCRIPTION_EMPTY,
        message: "Transaction notes are required",
      });
    }

    if (!transaction.amount || transaction.amount <= 0) {
      errors.push({
        field: "amount",
        code: ValidationErrorCodes.TRANSACTION_AMOUNT_INVALID,
        message: "Transaction amount must be positive",
        details: { amount: transaction.amount },
      });
    }

    if (!transaction.date) {
      errors.push({
        field: "date",
        code: ValidationErrorCodes.TRANSACTION_DATE_INVALID,
        message: "Transaction date is required",
      });
    } else if (transaction.date > new Date()) {
      errors.push({
        field: "date",
        code: ValidationErrorCodes.TRANSACTION_DATE_INVALID,
        message: "Transaction date cannot be in the future",
        details: { date: transaction.date },
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates income transaction
   */
  async validateIncomeTransaction(
    income: IncomeTransaction
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Schema validation
    const schemaResult = IncomeTransactionSchema.safeParse(income);
    if (!schemaResult.success) {
      errors.push({
        code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
        message: "Income transaction schema validation failed",
        details: { zodErrors: schemaResult.error.errors },
      });
    }

    // Basic transaction validation
    const basicValidation = await this.validateTransaction(income);
    errors.push(...basicValidation.errors);

    // Validate allocation breakdown matches transaction amount
    if (income.allocationBreakdown) {
      // Check if breakdown total equals transaction amount
      if (
        Math.abs(income.allocationBreakdown.totalAmount - income.amount) >
        this.ALLOCATION_TOLERANCE
      ) {
        errors.push({
          field: "allocationBreakdown",
          code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
          message: `Allocation breakdown total (${income.allocationBreakdown.totalAmount}) must equal transaction amount (${income.amount})`,
          details: {
            allocationTotal: income.allocationBreakdown.totalAmount,
            transactionAmount: income.amount,
          },
        });
      }

      // Validate the allocation breakdown structure
      const allocationValidation = await this.validateAllocationBreakdown(
        income.allocationBreakdown
      );
      errors.push(...allocationValidation.errors);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates expense transaction
   */
  async validateExpenseTransaction(
    expense: ExpenseTransaction
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Schema validation
    const schemaResult = ExpenseTransactionSchema.safeParse(expense);
    if (!schemaResult.success) {
      errors.push({
        code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
        message: "Expense transaction schema validation failed",
        details: { zodErrors: schemaResult.error.errors },
      });
    }

    // Basic transaction validation
    const basicValidation = await this.validateTransaction(expense);
    errors.push(...basicValidation.errors);

    // Validate allocation breakdown matches transaction amount
    if (expense.allocationBreakdown) {
      // Check if breakdown total equals transaction amount
      if (
        Math.abs(expense.allocationBreakdown.totalAmount - expense.amount) >
        this.ALLOCATION_TOLERANCE
      ) {
        errors.push({
          field: "allocationBreakdown",
          code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
          message: `Allocation breakdown total (${expense.allocationBreakdown.totalAmount}) must equal transaction amount (${expense.amount})`,
          details: {
            allocationTotal: expense.allocationBreakdown.totalAmount,
            transactionAmount: expense.amount,
          },
        });
      }

      // Validate the allocation breakdown structure
      const allocationValidation = await this.validateAllocationBreakdown(
        expense.allocationBreakdown
      );
      errors.push(...allocationValidation.errors);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates transfer transaction
   */
  async validateTransferTransaction(
    transfer: TransferTransaction
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Schema validation
    const schemaResult = TransferTransactionSchema.safeParse(transfer);
    if (!schemaResult.success) {
      errors.push({
        code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
        message: "Transfer transaction schema validation failed",
        details: { zodErrors: schemaResult.error.errors },
      });
    }

    // Basic transaction validation
    const basicValidation = await this.validateTransaction(transfer);
    errors.push(...basicValidation.errors);

    // Validate source and destination are different
    if (transfer.sourceChannelId === transfer.destinationChannelId) {
      // Only invalid if pool allocations are also the same
      const sourcePoolIds = new Set(
        transfer.sourceAllocation?.items?.map((a) => a.poolId) || []
      );
      const destPoolIds = new Set(
        transfer.destinationAllocation?.items?.map((a) => a.poolId) || []
      );
      const samePoolsSelected =
        sourcePoolIds.size === destPoolIds.size &&
        [...sourcePoolIds].every((id) => destPoolIds.has(id));

      if (samePoolsSelected) {
        errors.push({
          field: "channels",
          code: ValidationErrorCodes.DATA_INTEGRITY_INVALID_STATE,
          message:
            "Cannot transfer between the same channel and pool combinations",
        });
      }
    }

    // Validate source allocation matches transaction amount
    if (transfer.sourceAllocation) {
      if (
        Math.abs(transfer.sourceAllocation.totalAmount - transfer.amount) >
        this.ALLOCATION_TOLERANCE
      ) {
        errors.push({
          field: "sourceAllocation",
          code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
          message: `Source allocation total (${transfer.sourceAllocation.totalAmount}) must equal transaction amount (${transfer.amount})`,
          details: {
            sourceTotal: transfer.sourceAllocation.totalAmount,
            transactionAmount: transfer.amount,
          },
        });
      }

      // Validate the source allocation breakdown structure
      const sourceValidation = await this.validateAllocationBreakdown(
        transfer.sourceAllocation
      );
      errors.push(...sourceValidation.errors);
    }

    // Validate destination allocation matches transaction amount
    if (transfer.destinationAllocation) {
      if (
        Math.abs(transfer.destinationAllocation.totalAmount - transfer.amount) >
        this.ALLOCATION_TOLERANCE
      ) {
        errors.push({
          field: "destinationAllocation",
          code: ValidationErrorCodes.TRANSACTION_ALLOCATION_MISMATCH,
          message: `Destination allocation total (${transfer.destinationAllocation.totalAmount}) must equal transaction amount (${transfer.amount})`,
          details: {
            destinationTotal: transfer.destinationAllocation.totalAmount,
            transactionAmount: transfer.amount,
          },
        });
      }

      // Validate the destination allocation breakdown structure
      const destinationValidation = await this.validateAllocationBreakdown(
        transfer.destinationAllocation
      );
      errors.push(...destinationValidation.errors);
    }

    return { isValid: errors.length === 0, errors };
  }

  // ==================== Credit Payment Validations ====================

  /**
   * Validates credit card payment constraints
   */
  async validateCreditPayment(
    transfer: TransferTransaction
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Basic transfer validation first
    const transferValidation = await this.validateTransferTransaction(transfer);
    errors.push(...transferValidation.errors);

    // Additional credit payment specific validations would go here
    // This requires context about which channels are credit cards and current balances
    // For now, we'll validate the basic constraint structure

    if (
      !transfer.sourceAllocation?.items ||
      transfer.sourceAllocation.items.length === 0
    ) {
      errors.push({
        field: "sourceAllocation",
        code: ValidationErrorCodes.CREDIT_PAYMENT_INVALID_SOURCE,
        message: "Credit payment must specify source allocation breakdown",
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Calculates maximum credit payment amount based on pool constraints
   */
  async calculateMaxCreditPayment(
    sourceAllocation: AllocationBreakdown,
    availableBalances: Map<string, number>,
    creditDebt: Map<string, number>
  ): Promise<number> {
    let maxPayment = 0;

    for (const item of sourceAllocation.items) {
      const availableInPool = availableBalances.get(item.poolId) ?? 0;
      const debtInPool = creditDebt.get(item.poolId) ?? 0;

      // Can only pay up to the minimum of available balance and debt for each pool
      const maxForThisPool = Math.min(availableInPool, debtInPool);
      maxPayment += Math.max(0, maxForThisPool);
    }

    return maxPayment;
  }

  // ==================== Balance Validations ====================

  /**
   * Validates balance consistency
   */
  async validateBalanceConsistency(
    balances: PoolBalance[]
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    for (const balance of balances) {
      // Schema validation
      const schemaResult = PoolBalanceSchema.safeParse(balance);
      if (!schemaResult.success) {
        errors.push({
          code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
          message: `Pool balance schema validation failed for pool ${balance.poolId}, channel ${balance.channelId}`,
          details: { zodErrors: schemaResult.error.errors },
        });
        continue;
      }

      // Check for negative balances (warnings for some cases)
      if (balance.amount < 0) {
        // Negative balances might be acceptable for credit cards
        errors.push({
          field: "amount",
          code: ValidationErrorCodes.BALANCE_NEGATIVE,
          message: `Negative balance detected for pool ${balance.poolId}, channel ${balance.channelId}`,
          details: {
            poolId: balance.poolId,
            channelId: balance.channelId,
            amount: balance.amount,
          },
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates specific pool-channel balance
   */
  async validatePoolChannelBalance(
    poolId: string,
    channelId: string,
    expectedAmount: number,
    actualAmount: number
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (Math.abs(expectedAmount - actualAmount) > this.ALLOCATION_TOLERANCE) {
      errors.push({
        code: ValidationErrorCodes.BALANCE_INCONSISTENT,
        message: `Balance inconsistency for pool ${poolId}, channel ${channelId}`,
        details: {
          poolId,
          channelId,
          expected: expectedAmount,
          actual: actualAmount,
          difference: Math.abs(expectedAmount - actualAmount),
        },
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates current balance state
   */
  async validateCurrentBalance(
    currentBalance: CurrentBalance
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Schema validation
    const schemaResult = CurrentBalanceSchema.safeParse(currentBalance);
    if (!schemaResult.success) {
      errors.push({
        code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
        message: "Current balance schema validation failed",
        details: { zodErrors: schemaResult.error.errors },
      });
      return { isValid: false, errors };
    }

    // Validate individual pool balances
    const poolBalanceValidation = await this.validateBalanceConsistency(
      currentBalance.balances
    );
    errors.push(...poolBalanceValidation.errors);

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates balance snapshot
   */
  async validateBalanceSnapshot(
    snapshot: BalanceSnapshot
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Schema validation
    const schemaResult = BalanceSnapshotSchema.safeParse(snapshot);
    if (!schemaResult.success) {
      errors.push({
        code: ValidationErrorCodes.SCHEMA_VALIDATION_FAILED,
        message: "Balance snapshot schema validation failed",
        details: { zodErrors: schemaResult.error.errors },
      });
      return { isValid: false, errors };
    }

    // Validate snapshot date is not in the future
    if (snapshot.snapshotDate > new Date()) {
      errors.push({
        field: "snapshotDate",
        code: ValidationErrorCodes.TRANSACTION_DATE_INVALID,
        message: "Snapshot date cannot be in the future",
        details: { snapshotDate: snapshot.snapshotDate },
      });
    }

    // Validate individual pool balances
    const poolBalanceValidation = await this.validateBalanceConsistency(
      snapshot.balances
    );
    errors.push(...poolBalanceValidation.errors);

    return { isValid: errors.length === 0, errors };
  }

  // ==================== Data Integrity Validations ====================

  /**
   * Validates budget data integrity
   */
  async validateBudgetIntegrity(
    pools: Pool[],
    channels: Channel[],
    transactions: (
      | IncomeTransaction
      | ExpenseTransaction
      | TransferTransaction
    )[],
    allocationStrategies: AllocationStrategy[]
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    const poolIds = new Set(pools.filter((p) => p.isActive).map((p) => p.id));
    const channelIds = new Set(
      channels.filter((c) => c.isActive).map((c) => c.id)
    );

    // Check for orphaned references in transactions
    for (const transaction of transactions) {
      // Check channel references
      if (
        "channelId" in transaction &&
        !channelIds.has(transaction.channelId)
      ) {
        errors.push({
          code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
          message: `Transaction ${transaction.id} references non-existent channel ${transaction.channelId}`,
          details: {
            transactionId: transaction.id,
            channelId: transaction.channelId,
          },
        });
      }

      // Check source channel for transfers
      if (transaction.type === "transfer") {
        const transfer = transaction;
        if (!channelIds.has(transfer.sourceChannelId)) {
          errors.push({
            code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
            message: `Transfer ${transfer.id} references non-existent source channel ${transfer.sourceChannelId}`,
            details: {
              transactionId: transfer.id,
              channelId: transfer.sourceChannelId,
            },
          });
        }
        if (!channelIds.has(transfer.destinationChannelId)) {
          errors.push({
            code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
            message: `Transfer ${transfer.id} references non-existent destination channel ${transfer.destinationChannelId}`,
            details: {
              transactionId: transfer.id,
              channelId: transfer.destinationChannelId,
            },
          });
        }
      }

      // Check pool references in allocations
      if (transaction.type === "income" || transaction.type === "expense") {
        const transactionWithAllocation = transaction;
        if (transactionWithAllocation.allocationBreakdown) {
          for (const item of transactionWithAllocation.allocationBreakdown
            .items) {
            if (!poolIds.has(item.poolId)) {
              errors.push({
                code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
                message: `Transaction ${transaction.id} references non-existent pool ${item.poolId}`,
                details: { transactionId: transaction.id, poolId: item.poolId },
              });
            }
          }
        }
      }

      // Check source and destination allocations for transfers
      if (transaction.type === "transfer") {
        const transfer = transaction;

        // Check source allocation
        if (transfer.sourceAllocation) {
          for (const item of transfer.sourceAllocation.items) {
            if (!poolIds.has(item.poolId)) {
              errors.push({
                code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
                message: `Transfer ${transfer.id} source allocation references non-existent pool ${item.poolId}`,
                details: { transactionId: transfer.id, poolId: item.poolId },
              });
            }
          }
        }

        // Check destination allocation
        if (transfer.destinationAllocation) {
          for (const item of transfer.destinationAllocation.items) {
            if (!poolIds.has(item.poolId)) {
              errors.push({
                code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
                message: `Transfer ${transfer.id} destination allocation references non-existent pool ${item.poolId}`,
                details: { transactionId: transfer.id, poolId: item.poolId },
              });
            }
          }
        }
      }
    }

    // Check allocation strategies reference valid pools
    for (const strategy of allocationStrategies.filter((s) => s.isActive)) {
      for (const allocation of strategy.allocations) {
        if (!poolIds.has(allocation.poolId)) {
          errors.push({
            code: ValidationErrorCodes.DATA_INTEGRITY_ORPHANED_REFERENCE,
            message: `Allocation strategy ${strategy.id} references non-existent pool ${allocation.poolId}`,
            details: { strategyId: strategy.id, poolId: allocation.poolId },
          });
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates individual transaction integrity
   */
  async validateTransactionIntegrity(
    transaction: IncomeTransaction | ExpenseTransaction | TransferTransaction,
    existingPoolIds: Set<string>,
    existingChannelIds: Set<string>
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Check channel exists
    if (
      "channelId" in transaction &&
      !existingChannelIds.has(transaction.channelId)
    ) {
      errors.push({
        code: ValidationErrorCodes.TRANSACTION_CHANNEL_NOT_FOUND,
        message: `Referenced channel ${transaction.channelId} does not exist`,
        details: { channelId: transaction.channelId },
      });
    }

    // Check transfer channels
    if (transaction.type === "transfer") {
      const transfer = transaction;
      if (!existingChannelIds.has(transfer.sourceChannelId)) {
        errors.push({
          code: ValidationErrorCodes.TRANSACTION_CHANNEL_NOT_FOUND,
          message: `Source channel ${transfer.sourceChannelId} does not exist`,
          details: { channelId: transfer.sourceChannelId },
        });
      }
      if (!existingChannelIds.has(transfer.destinationChannelId)) {
        errors.push({
          code: ValidationErrorCodes.TRANSACTION_CHANNEL_NOT_FOUND,
          message: `Destination channel ${transfer.destinationChannelId} does not exist`,
          details: { channelId: transfer.destinationChannelId },
        });
      }
    }

    // Check pool references
    if (transaction.type === "income" || transaction.type === "expense") {
      const transactionWithAllocation = transaction;
      if (transactionWithAllocation.allocationBreakdown) {
        for (const item of transactionWithAllocation.allocationBreakdown
          .items) {
          if (!existingPoolIds.has(item.poolId)) {
            errors.push({
              code: ValidationErrorCodes.TRANSACTION_POOL_NOT_FOUND,
              message: `Referenced pool ${item.poolId} does not exist`,
              details: { poolId: item.poolId },
            });
          }
        }
      }
    }

    // Check transfer allocations
    if (transaction.type === "transfer") {
      const transfer = transaction;

      // Check source allocation
      if (transfer.sourceAllocation) {
        for (const item of transfer.sourceAllocation.items) {
          if (!existingPoolIds.has(item.poolId)) {
            errors.push({
              code: ValidationErrorCodes.TRANSACTION_POOL_NOT_FOUND,
              message: `Source allocation references non-existent pool ${item.poolId}`,
              details: { poolId: item.poolId },
            });
          }
        }
      }

      // Check destination allocation
      if (transfer.destinationAllocation) {
        for (const item of transfer.destinationAllocation.items) {
          if (!existingPoolIds.has(item.poolId)) {
            errors.push({
              code: ValidationErrorCodes.TRANSACTION_POOL_NOT_FOUND,
              message: `Destination allocation references non-existent pool ${item.poolId}`,
              details: { poolId: item.poolId },
            });
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // ==================== Import Validations ====================

  /**
   * Validates import data
   */
  async validateImportData(importData: ImportTransaction[]): Promise<{
    valid: ImportTransaction[];
    invalid: { transaction: ImportTransaction; errors: ValidationError[] }[];
  }> {
    const valid: ImportTransaction[] = [];
    const invalid: {
      transaction: ImportTransaction;
      errors: ValidationError[];
    }[] = [];

    for (const transaction of importData) {
      const errors: ValidationError[] = [];

      // Validate required fields
      if (!transaction.date) {
        errors.push({
          field: "date",
          code: ValidationErrorCodes.IMPORT_MISSING_REQUIRED_FIELD,
          message: "Date is required",
        });
      } else {
        // Validate date format
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) {
          errors.push({
            field: "date",
            code: ValidationErrorCodes.IMPORT_INVALID_DATE,
            message: `Invalid date format: ${transaction.date}`,
          });
        }
      }

      if (
        !transaction.description ||
        transaction.description.trim().length === 0
      ) {
        errors.push({
          field: "description",
          code: ValidationErrorCodes.IMPORT_MISSING_REQUIRED_FIELD,
          message: "Description is required",
        });
      }

      if (transaction.amount === undefined || transaction.amount === null) {
        errors.push({
          field: "amount",
          code: ValidationErrorCodes.IMPORT_MISSING_REQUIRED_FIELD,
          message: "Amount is required",
        });
      } else if (
        typeof transaction.amount !== "number" ||
        isNaN(transaction.amount)
      ) {
        errors.push({
          field: "amount",
          code: ValidationErrorCodes.IMPORT_INVALID_AMOUNT,
          message: `Invalid amount: ${transaction.amount}`,
        });
      } else if (transaction.amount === 0) {
        errors.push({
          field: "amount",
          code: ValidationErrorCodes.IMPORT_INVALID_AMOUNT,
          message: "Amount cannot be zero",
        });
      }

      if (
        !transaction.type ||
        !["income", "expense", "transfer"].includes(transaction.type)
      ) {
        errors.push({
          field: "type",
          code: ValidationErrorCodes.IMPORT_MISSING_REQUIRED_FIELD,
          message: "Type must be one of: income, expense, transfer",
        });
      }

      if (errors.length === 0) {
        valid.push(transaction);
      } else {
        invalid.push({ transaction, errors });
      }
    }

    return { valid, invalid };
  }
}
