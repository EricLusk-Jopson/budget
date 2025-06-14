import { z } from "zod";

/**
 * Channel types representing different account types
 */
export const ChannelTypeSchema = z.enum([
  "cash", // Physical cash
  "checking", // Checking account
  "savings", // Savings account
  "credit", // Credit card
]);

export type ChannelType = z.infer<typeof ChannelTypeSchema>;

/**
 * Account number masking for security
 */
const AccountNumberSchema = z
  .string()
  .min(4, "Account number must be at least 4 characters")
  .max(20, "Account number too long")
  .optional();

/**
 * Bill tracking information for channels (optional, primarily for credit cards)
 */
export const BillTrackingSchema = z
  .object({
    statementAmount: z.number().optional(), // Total amount on current statement
    statementDate: z.date().optional(), // Date of current statement
    dueDate: z.date().optional(), // Payment due date
    amountPaid: z.number().default(0), // Amount paid toward current statement
    minimumPayment: z.number().optional(), // Minimum payment required
    lastPaymentDate: z.date().optional(), // Date of last payment
  })
  .optional();

export type BillTracking = z.infer<typeof BillTrackingSchema>;

/**
 * Core channel definition
 */
export const ChannelSchema = z.object({
  id: z.string().min(1, "Channel ID is required"),
  budgetId: z.string().min(1, "Budget ID is required"),
  name: z.string().min(1, "Channel name is required").max(50),
  description: z.string().max(200).optional(),
  type: ChannelTypeSchema,

  // Financial institution info
  institution: z.string().max(100).optional(),
  accountNumber: AccountNumberSchema,

  // For credit cards, track credit limit
  creditLimit: z.number().positive().optional(),

  // Optional bill tracking (primarily for credit cards)
  billTracking: BillTrackingSchema,

  // Status and metadata
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Channel = z.infer<typeof ChannelSchema>;

/**
 * Channel creation input
 */
export const CreateChannelSchema = z
  .object({
    budgetId: z.string().min(1, "Budget ID is required"),
    name: z.string().min(1, "Channel name is required").max(50),
    description: z.string().max(200).optional(),
    type: ChannelTypeSchema,
    institution: z.string().max(100).optional(),
    accountNumber: AccountNumberSchema,
    creditLimit: z.number().positive().optional(),
    billTracking: BillTrackingSchema,
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Credit cards should have a credit limit
      if (data.type === "credit") {
        return data.creditLimit !== undefined && data.creditLimit > 0;
      }
      return true;
    },
    {
      message: "Credit cards must have a positive credit limit",
      path: ["creditLimit"],
    }
  )
  .refine(
    (data) => {
      // Cash accounts shouldn't have institution or account number
      if (data.type === "cash") {
        return !data.institution && !data.accountNumber;
      }
      return true;
    },
    {
      message: "Cash accounts should not have institution or account number",
      path: ["institution"],
    }
  );

export type CreateChannel = z.infer<typeof CreateChannelSchema>;

/**
 * Channel update input
 */
export const UpdateChannelSchema = z
  .object({
    name: z.string().min(1, "Channel name is required").max(50).optional(),
    description: z.string().max(200).optional(),
    type: ChannelTypeSchema.optional(),
    institution: z.string().max(100).optional(),
    accountNumber: AccountNumberSchema,
    creditLimit: z.number().positive().optional(),
    billTracking: BillTrackingSchema,
    isActive: z.boolean().optional(),
    updatedAt: z.date(),
  })
  .refine(
    (data) => {
      // If type is being changed to credit, validate credit limit
      if (data.type === "credit") {
        return data.creditLimit !== undefined && data.creditLimit > 0;
      }
      return true;
    },
    {
      message: "Credit cards must have a positive credit limit",
      path: ["creditLimit"],
    }
  );

export type UpdateChannel = z.infer<typeof UpdateChannelSchema>;

/**
 * Channel with balance information (for display purposes)
 */
export const ChannelWithBalanceSchema = z.object({
  id: z.string().min(1, "Channel ID is required"),
  budgetId: z.string().min(1, "Budget ID is required"),
  name: z.string().min(1, "Channel name is required").max(50),
  description: z.string().max(200).optional(),
  type: ChannelTypeSchema,
  institution: z.string().max(100).optional(),
  accountNumber: AccountNumberSchema,
  creditLimit: z.number().positive().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  currentBalance: z.number(),
  availableBalance: z.number(), // Different from current for credit cards
  lastBalanceUpdate: z.date(),
});

export type ChannelWithBalance = z.infer<typeof ChannelWithBalanceSchema>;

/**
 * Validation functions
 */
export const validateChannel = (data: unknown): Channel => {
  return ChannelSchema.parse(data);
};

export const validateCreateChannel = (data: unknown): CreateChannel => {
  return CreateChannelSchema.parse(data);
};

export const validateUpdateChannel = (data: unknown): UpdateChannel => {
  return UpdateChannelSchema.parse(data);
};

/**
 * Helper function to create a new channel with defaults
 */
export const createChannel = (input: CreateChannel): Omit<Channel, "id"> => {
  const now = new Date();

  return {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Helper function to mask account number for display
 */
export const maskAccountNumber = (
  accountNumber: string | undefined
): string => {
  if (!accountNumber || accountNumber.length < 4) {
    return "****";
  }

  const lastFour = accountNumber.slice(-4);
  const masked = "*".repeat(Math.max(0, accountNumber.length - 4));
  return `${masked}${lastFour}`;
};

/**
 * Helper function to check if channel is a credit account
 */
export const isCreditChannel = (channel: Channel): boolean => {
  return channel.type === "credit";
};

/**
 * Helper function to check if channel is a cash account
 */
export const isCashChannel = (channel: Channel): boolean => {
  return channel.type === "cash";
};

/**
 * Helper function to calculate available balance for credit cards
 */
export const calculateAvailableBalance = (
  channel: Channel,
  currentBalance: number
): number => {
  if (isCreditChannel(channel) && channel.creditLimit) {
    // For credit cards, available = limit - current balance
    return channel.creditLimit - Math.abs(currentBalance);
  }

  // For other account types, available = current
  return currentBalance;
};

/**
 * Helper function to check if channel is over limit (credit cards)
 */
export const isOverLimit = (
  channel: Channel,
  currentBalance: number
): boolean => {
  if (!isCreditChannel(channel) || !channel.creditLimit) {
    return false;
  }

  return Math.abs(currentBalance) > channel.creditLimit;
};

/**
 * Helper function to check if channel has bill tracking enabled
 */
export const hasBillTracking = (channel: Channel): boolean => {
  return channel.billTracking !== undefined;
};

/**
 * Helper function to get remaining balance on credit card bill
 */
export const getRemainingBillBalance = (channel: Channel): number => {
  if (!channel.billTracking || !channel.billTracking.statementAmount) {
    return 0;
  }

  return channel.billTracking.statementAmount - channel.billTracking.amountPaid;
};

/**
 * Helper function to check if bill is overdue
 */
export const isBillOverdue = (channel: Channel): boolean => {
  if (!channel.billTracking || !channel.billTracking.dueDate) {
    return false;
  }

  const today = new Date();
  return (
    channel.billTracking.dueDate < today && getRemainingBillBalance(channel) > 0
  );
};

/**
 * Helper function to get days until bill is due
 */
export const getDaysUntilDue = (channel: Channel): number | null => {
  if (!channel.billTracking || !channel.billTracking.dueDate) {
    return null;
  }

  const today = new Date();
  const dueDate = channel.billTracking.dueDate;
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Helper function to check if minimum payment has been met
 */
export const isMinimumPaymentMet = (channel: Channel): boolean => {
  if (!channel.billTracking || !channel.billTracking.minimumPayment) {
    return true; // No minimum payment required
  }

  return channel.billTracking.amountPaid >= channel.billTracking.minimumPayment;
};

/**
 * Helper function to update bill tracking after payment
 */
export const updateBillTrackingAfterPayment = (
  channel: Channel,
  paymentAmount: number,
  paymentDate: Date
): Channel => {
  if (!channel.billTracking) {
    return channel;
  }

  return {
    ...channel,
    billTracking: {
      ...channel.billTracking,
      amountPaid: channel.billTracking.amountPaid + paymentAmount,
      lastPaymentDate: paymentDate,
    },
    updatedAt: new Date(),
  };
};
export const CHANNEL_TEMPLATES: Record<
  string,
  Partial<CreateChannel> & { name: string }
> = {
  primaryChecking: {
    name: "Primary Checking",
    description: "Primary checking account",
    type: "checking",
  },
  primarySavings: {
    name: "Primary Savings",
    description: "Primary savings account",
    type: "savings",
  },
  emergencySavings: {
    name: "Emergency Savings",
    description: "Emergency fund savings account",
    type: "savings",
  },
  cash: {
    name: "Cash",
    description: "Cash on hand",
    type: "cash",
  },
  primaryCredit: {
    name: "Primary Credit Card",
    description: "Primary credit card",
    type: "credit",
    creditLimit: 5000, // Default limit, should be updated
  },
};

/**
 * Channel type display information
 */
export const CHANNEL_TYPE_INFO: Record<
  ChannelType,
  {
    label: string;
    description: string;
    icon: string;
  }
> = {
  cash: {
    label: "Cash",
    description: "Physical cash on hand",
    icon: "banknotes",
  },
  checking: {
    label: "Checking",
    description: "Checking account for daily transactions",
    icon: "credit-card",
  },
  savings: {
    label: "Savings",
    description: "Savings account for storing money",
    icon: "banknotes",
  },
  credit: {
    label: "Credit Card",
    description: "Credit card account",
    icon: "credit-card",
  },
};
