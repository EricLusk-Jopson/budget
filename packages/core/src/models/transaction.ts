import { z } from "zod";
import {
  AllocationBreakdownSchema,
  CreateAllocationBreakdownSchema,
} from "./allocationBreakdown";
import { CategoryReferenceSchema } from "./category";

/**
 * Base transaction fields shared across all transaction types
 */
export const BaseTransactionSchema = z.object({
  id: z.string().min(1, "Transaction ID is required"),
  date: z.date(),
  notes: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Income transaction - money coming in
 */
export const IncomeTransactionSchema = BaseTransactionSchema.extend({
  type: z.literal("income"),
  channelId: z.string().min(1, "Channel ID is required"),
  amount: z.number().positive("Income amount must be positive"),
  source: z.string().min(1, "Income source is required").max(100), // User-defined source
  allocationBreakdown: AllocationBreakdownSchema, // Defaults from strategy, user can override
});

export type IncomeTransaction = z.infer<typeof IncomeTransactionSchema>;

/**
 * Expense transaction - money going out
 */
export const ExpenseTransactionSchema = BaseTransactionSchema.extend({
  type: z.literal("expense"),
  channelId: z.string().min(1, "Channel ID is required"),
  amount: z.number().positive("Expense amount must be positive"),
  category: CategoryReferenceSchema, // User-defined category and subcategory
  allocationBreakdown: AllocationBreakdownSchema, // Defaults to single pool, can be split
});

export type ExpenseTransaction = z.infer<typeof ExpenseTransactionSchema>;

/**
 * Transfer transaction - money moving between channels/pools
 */
export const TransferTransactionSchema = BaseTransactionSchema.extend({
  type: z.literal("transfer"),
  amount: z.number().positive("Transfer amount must be positive"),
  description: z.string().min(1, "Transfer description is required").max(200),

  // Source information
  sourceChannelId: z.string().min(1, "Source channel ID is required"),
  sourceAllocation: AllocationBreakdownSchema, // What pools the money comes from

  // Destination information
  destinationChannelId: z.string().min(1, "Destination channel ID is required"),
  destinationAllocation: AllocationBreakdownSchema, // What pools the money goes to
});

export type TransferTransaction = z.infer<typeof TransferTransactionSchema>;

/**
 * Union type for all transaction types
 */
export const TransactionSchema = z.discriminatedUnion("type", [
  IncomeTransactionSchema,
  ExpenseTransactionSchema,
  TransferTransactionSchema,
]);

export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Income transaction creation input
 */
export const CreateIncomeTransactionSchema = z.object({
  date: z.date(),
  channelId: z.string().min(1, "Channel ID is required"),
  amount: z.number().positive("Income amount must be positive"),
  source: z.string().min(1, "Income source is required").max(100),
  allocationBreakdown: CreateAllocationBreakdownSchema,
  notes: z.string().max(500).optional(),
});

export type CreateIncomeTransaction = z.infer<
  typeof CreateIncomeTransactionSchema
>;

/**
 * Expense transaction creation input
 */
export const CreateExpenseTransactionSchema = z.object({
  date: z.date(),
  channelId: z.string().min(1, "Channel ID is required"),
  amount: z.number().positive("Expense amount must be positive"),
  category: CategoryReferenceSchema,
  allocationBreakdown: CreateAllocationBreakdownSchema,
  notes: z.string().max(500).optional(),
});

export type CreateExpenseTransaction = z.infer<
  typeof CreateExpenseTransactionSchema
>;

/**
 * Transfer transaction creation input
 */
export const CreateTransferTransactionSchema = z
  .object({
    date: z.date(),
    amount: z.number().positive("Transfer amount must be positive"),
    description: z.string().min(1, "Transfer description is required").max(200),
    sourceChannelId: z.string().min(1, "Source channel ID is required"),
    sourceAllocation: CreateAllocationBreakdownSchema,
    destinationChannelId: z
      .string()
      .min(1, "Destination channel ID is required"),
    destinationAllocation: CreateAllocationBreakdownSchema,
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Source and destination allocations must equal the transfer amount
      return (
        Math.abs(data.sourceAllocation.totalAmount - data.amount) < 0.01 &&
        Math.abs(data.destinationAllocation.totalAmount - data.amount) < 0.01
      );
    },
    {
      message: "Source and destination allocations must equal transfer amount",
      path: ["amount"],
    }
  );

export type CreateTransferTransaction = z.infer<
  typeof CreateTransferTransactionSchema
>;

/**
 * Update schemas for each transaction type
 */
export const UpdateIncomeTransactionSchema = z.object({
  date: z.date().optional(),
  channelId: z.string().min(1, "Channel ID is required").optional(),
  amount: z.number().positive("Income amount must be positive").optional(),
  source: z.string().min(1, "Income source is required").max(100).optional(),
  allocationBreakdown: CreateAllocationBreakdownSchema.optional(),
  notes: z.string().max(500).optional(),
  updatedAt: z.date(),
});

export type UpdateIncomeTransaction = z.infer<
  typeof UpdateIncomeTransactionSchema
>;

export const UpdateExpenseTransactionSchema = z.object({
  date: z.date().optional(),
  channelId: z.string().min(1, "Channel ID is required").optional(),
  amount: z.number().positive("Expense amount must be positive").optional(),
  category: CategoryReferenceSchema.optional(),
  allocationBreakdown: CreateAllocationBreakdownSchema.optional(),
  notes: z.string().max(500).optional(),
  updatedAt: z.date(),
});

export type UpdateExpenseTransaction = z.infer<
  typeof UpdateExpenseTransactionSchema
>;

export const UpdateTransferTransactionSchema = z.object({
  date: z.date().optional(),
  amount: z.number().positive("Transfer amount must be positive").optional(),
  description: z
    .string()
    .min(1, "Transfer description is required")
    .max(200)
    .optional(),
  sourceChannelId: z
    .string()
    .min(1, "Source channel ID is required")
    .optional(),
  sourceAllocation: CreateAllocationBreakdownSchema.optional(),
  destinationChannelId: z
    .string()
    .min(1, "Destination channel ID is required")
    .optional(),
  destinationAllocation: CreateAllocationBreakdownSchema.optional(),
  notes: z.string().max(500).optional(),
  updatedAt: z.date(),
});

export type UpdateTransferTransaction = z.infer<
  typeof UpdateTransferTransactionSchema
>;

/**
 * Validation functions
 */
export const validateIncomeTransaction = (data: unknown): IncomeTransaction => {
  return IncomeTransactionSchema.parse(data);
};

export const validateExpenseTransaction = (
  data: unknown
): ExpenseTransaction => {
  return ExpenseTransactionSchema.parse(data);
};

export const validateTransferTransaction = (
  data: unknown
): TransferTransaction => {
  return TransferTransactionSchema.parse(data);
};

export const validateTransaction = (data: unknown): Transaction => {
  return TransactionSchema.parse(data);
};

/**
 * Helper function to create income transaction with defaults
 */
export const createIncomeTransaction = (
  input: CreateIncomeTransaction
): Omit<IncomeTransaction, "id"> => {
  const now = new Date();

  return {
    type: "income",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Helper function to create expense transaction with defaults
 */
export const createExpenseTransaction = (
  input: CreateExpenseTransaction
): Omit<ExpenseTransaction, "id"> => {
  const now = new Date();

  return {
    type: "expense",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Helper function to create transfer transaction with defaults
 */
export const createTransferTransaction = (
  input: CreateTransferTransaction
): Omit<TransferTransaction, "id"> => {
  const now = new Date();

  return {
    type: "transfer",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Type guard functions
 */
export const isIncomeTransaction = (
  transaction: Transaction
): transaction is IncomeTransaction => {
  return transaction.type === "income";
};

export const isExpenseTransaction = (
  transaction: Transaction
): transaction is ExpenseTransaction => {
  return transaction.type === "expense";
};

export const isTransferTransaction = (
  transaction: Transaction
): transaction is TransferTransaction => {
  return transaction.type === "transfer";
};

/**
 * Helper function to validate credit card payment
 */
export const validateCreditCardPayment = (
  paymentAmount: number,
  sourceBalances: Array<{ poolId: string; availableAmount: number }>,
  destinationDebts: Array<{ poolId: string; debtAmount: number }>
): { isValid: boolean; maxPayable: number; errors: string[] } => {
  const errors: string[] = [];
  let maxPayable = 0;

  // Calculate maximum payable amount using the constraint logic
  sourceBalances.forEach((source) => {
    const matchingDebt = destinationDebts.find(
      (debt) => debt.poolId === source.poolId
    );
    if (matchingDebt) {
      const poolMaxPayable = Math.min(
        source.availableAmount,
        matchingDebt.debtAmount
      );
      maxPayable += poolMaxPayable;
    }
  });

  const isValid = paymentAmount <= maxPayable;

  if (!isValid) {
    errors.push(
      `Cannot pay $${paymentAmount}. Maximum payable amount is $${maxPayable}`
    );
  }

  return { isValid, maxPayable, errors };
};

/**
 * Helper function to create credit card payment transfer
 */
export const createCreditCardPaymentTransfer = (
  paymentAmount: number,
  sourceChannelId: string,
  destinationChannelId: string,
  sourceBalances: Array<{ poolId: string; availableAmount: number }>,
  destinationDebts: Array<{ poolId: string; debtAmount: number }>,
  date: Date = new Date()
): CreateTransferTransaction => {
  // Auto-distribute payment across pools
  const sourceItems: Array<{ poolId: string; amount: number }> = [];
  const destinationItems: Array<{ poolId: string; amount: number }> = [];

  let remainingAmount = paymentAmount;

  sourceBalances.forEach((source) => {
    if (remainingAmount <= 0) return;

    const matchingDebt = destinationDebts.find(
      (debt) => debt.poolId === source.poolId
    );
    if (matchingDebt) {
      const payableAmount = Math.min(
        source.availableAmount,
        matchingDebt.debtAmount,
        remainingAmount
      );

      if (payableAmount > 0) {
        sourceItems.push({ poolId: source.poolId, amount: -payableAmount });
        destinationItems.push({ poolId: source.poolId, amount: payableAmount });
        remainingAmount -= payableAmount;
      }
    }
  });

  return {
    date,
    amount: paymentAmount,
    description: `Credit card payment - $${paymentAmount}`,
    sourceChannelId,
    sourceAllocation: {
      items: sourceItems,
      totalAmount: -paymentAmount,
    },
    destinationChannelId,
    destinationAllocation: {
      items: destinationItems,
      totalAmount: paymentAmount,
    },
  };
};

/**
 * Transaction type display information
 */
export const TRANSACTION_TYPE_INFO = {
  income: {
    label: "Income",
    description: "Money coming in",
    icon: "arrow-down-circle",
    colorClass: "text-green-600",
  },
  expense: {
    label: "Expense",
    description: "Money going out",
    icon: "arrow-up-circle",
    colorClass: "text-red-600",
  },
  transfer: {
    label: "Transfer",
    description: "Money moving between accounts",
    icon: "arrow-right-circle",
    colorClass: "text-blue-600",
  },
} as const;
