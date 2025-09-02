import { z } from "zod";
import { ValidationErrorCodes } from "../constants/validation-errors";

/**
 * Expense subcategory - nested under a parent category
 */
export const ExpenseSubcategorySchema = z.object({
  id: z.string().min(1, ValidationErrorCodes.SUBCATEGORY_ID_REQUIRED),
  name: z
    .string()
    .min(1, ValidationErrorCodes.SUBCATEGORY_NAME_REQUIRED)
    .max(50, ValidationErrorCodes.FIELD_TOO_LONG),
  description: z
    .string()
    .max(200, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ExpenseSubcategory = z.infer<typeof ExpenseSubcategorySchema>;

/**
 * Expense category - top-level category that can contain subcategories
 */
export const ExpenseCategorySchema = z.object({
  id: z.string().min(1, ValidationErrorCodes.CATEGORY_ID_REQUIRED),
  budgetId: z.string().min(1, ValidationErrorCodes.BUDGET_ID_REQUIRED),
  name: z
    .string()
    .min(1, ValidationErrorCodes.CATEGORY_NAME_REQUIRED)
    .max(50, ValidationErrorCodes.FIELD_TOO_LONG),
  description: z
    .string()
    .max(200, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),

  // Subcategories nested under this category
  subcategories: z.array(ExpenseSubcategorySchema).default([]),

  // Display and organization
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, ValidationErrorCodes.FIELD_INVALID_COLOR)
    .optional(),
  icon: z.string().max(50, ValidationErrorCodes.FIELD_TOO_LONG).optional(),
  sortOrder: z.number().int().default(0),

  // Status and metadata
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

/**
 * Category creation input
 */
export const CreateExpenseCategorySchema = z.object({
  budgetId: z.string().min(1, ValidationErrorCodes.BUDGET_ID_REQUIRED),
  name: z
    .string()
    .min(1, ValidationErrorCodes.CATEGORY_NAME_REQUIRED)
    .max(50, ValidationErrorCodes.FIELD_TOO_LONG),
  description: z
    .string()
    .max(200, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, ValidationErrorCodes.FIELD_INVALID_COLOR)
    .optional(),
  icon: z.string().max(50, ValidationErrorCodes.FIELD_TOO_LONG).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CreateExpenseCategory = z.infer<typeof CreateExpenseCategorySchema>;

/**
 * Category update input
 */
export const UpdateExpenseCategorySchema = z.object({
  name: z
    .string()
    .min(1, ValidationErrorCodes.CATEGORY_NAME_REQUIRED)
    .max(50, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  description: z
    .string()
    .max(200, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, ValidationErrorCodes.FIELD_INVALID_COLOR)
    .optional(),
  icon: z.string().max(50, ValidationErrorCodes.FIELD_TOO_LONG).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  updatedAt: z.date(),
});

export type UpdateExpenseCategory = z.infer<typeof UpdateExpenseCategorySchema>;

/**
 * Subcategory creation input
 */
export const CreateExpenseSubcategorySchema = z.object({
  name: z
    .string()
    .min(1, ValidationErrorCodes.SUBCATEGORY_NAME_REQUIRED)
    .max(50, ValidationErrorCodes.FIELD_TOO_LONG),
  description: z
    .string()
    .max(200, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  isActive: z.boolean().default(true),
});

export type CreateExpenseSubcategory = z.infer<
  typeof CreateExpenseSubcategorySchema
>;

/**
 * Subcategory update input
 */
export const UpdateExpenseSubcategorySchema = z.object({
  name: z
    .string()
    .min(1, ValidationErrorCodes.SUBCATEGORY_NAME_REQUIRED)
    .max(50, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  description: z
    .string()
    .max(200, ValidationErrorCodes.FIELD_TOO_LONG)
    .optional(),
  isActive: z.boolean().optional(),
  updatedAt: z.date(),
});

export type UpdateExpenseSubcategory = z.infer<
  typeof UpdateExpenseSubcategorySchema
>;

/**
 * Category reference for transactions (lightweight reference)
 */
export const CategoryReferenceSchema = z.object({
  categoryId: z.string().min(1, ValidationErrorCodes.CATEGORY_ID_REQUIRED),
  categoryName: z.string().min(1, ValidationErrorCodes.CATEGORY_NAME_REQUIRED),
  subcategoryId: z.string().optional(),
  subcategoryName: z.string().optional(),
});

export type CategoryReference = z.infer<typeof CategoryReferenceSchema>;

/**
 * Category with usage statistics (for analytics)
 */
export const CategoryWithStatsSchema = z.object({
  category: ExpenseCategorySchema,
  stats: z.object({
    totalTransactions: z.number().int().min(0),
    totalAmount: z.number(),
    averageAmount: z.number(),
    lastUsed: z.date().optional(),
    mostUsedSubcategory: z.string().optional(),
  }),
});

export type CategoryWithStats = z.infer<typeof CategoryWithStatsSchema>;

/**
 * Validation functions
 */
export const validateExpenseCategory = (data: unknown): ExpenseCategory => {
  return ExpenseCategorySchema.parse(data);
};

export const validateCreateExpenseCategory = (
  data: unknown
): CreateExpenseCategory => {
  return CreateExpenseCategorySchema.parse(data);
};

export const validateUpdateExpenseCategory = (
  data: unknown
): UpdateExpenseCategory => {
  return UpdateExpenseCategorySchema.parse(data);
};

export const validateCategoryReference = (data: unknown): CategoryReference => {
  return CategoryReferenceSchema.parse(data);
};

/**
 * Helper function to create a new category with defaults
 */
export const createExpenseCategory = (
  input: CreateExpenseCategory
): Omit<ExpenseCategory, "id"> => {
  const now = new Date();

  return {
    ...input,
    subcategories: [],
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Helper function to create a new subcategory with defaults
 */
export const createExpenseSubcategory = (
  input: CreateExpenseSubcategory
): Omit<ExpenseSubcategory, "id"> => {
  const now = new Date();

  return {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Helper function to add subcategory to category
 */
export const addSubcategoryToCategory = (
  category: ExpenseCategory,
  subcategory: ExpenseSubcategory
): ExpenseCategory => {
  return {
    ...category,
    subcategories: [...category.subcategories, subcategory],
    updatedAt: new Date(),
  };
};

/**
 * Helper function to remove subcategory from category
 */
export const removeSubcategoryFromCategory = (
  category: ExpenseCategory,
  subcategoryId: string
): ExpenseCategory => {
  return {
    ...category,
    subcategories: category.subcategories.filter(
      (sub) => sub.id !== subcategoryId
    ),
    updatedAt: new Date(),
  };
};

/**
 * Helper function to find subcategory by ID within a category
 */
export const findSubcategory = (
  category: ExpenseCategory,
  subcategoryId: string
): ExpenseSubcategory | undefined => {
  return category.subcategories.find((sub) => sub.id === subcategoryId);
};

/**
 * Helper function to create category reference from category and subcategory
 */
export const createCategoryReference = (
  category: ExpenseCategory,
  subcategoryId?: string
): CategoryReference => {
  const subcategory = subcategoryId
    ? findSubcategory(category, subcategoryId)
    : undefined;

  return {
    categoryId: category.id,
    categoryName: category.name,
    subcategoryId: subcategory?.id,
    subcategoryName: subcategory?.name,
  };
};

/**
 * Helper function to validate that subcategory belongs to category
 */
export const validateSubcategoryBelongsToCategory = (
  category: ExpenseCategory,
  subcategoryId: string
): boolean => {
  return category.subcategories.some((sub) => sub.id === subcategoryId);
};

/**
 * Helper function to get all active categories and subcategories
 */
export const getActiveCategories = (
  categories: ExpenseCategory[]
): ExpenseCategory[] => {
  return categories
    .filter((category) => category.isActive)
    .map((category) => ({
      ...category,
      subcategories: category.subcategories.filter((sub) => sub.isActive),
    }));
};

/**
 * Common default categories for quick setup
 */
export const DEFAULT_EXPENSE_CATEGORIES: Array<
  Omit<CreateExpenseCategory, "budgetId"> & {
    defaultSubcategories: Array<Omit<CreateExpenseSubcategory, "categoryId">>;
  }
> = [
  {
    name: "Food",
    description: "Food and dining expenses",
    color: "#10B981",
    icon: "utensils",
    sortOrder: 1,
    isActive: true,
    defaultSubcategories: [
      {
        name: "Groceries",
        description: "Grocery shopping and household essentials",
        isActive: true,
      },
      {
        name: "Restaurants",
        description: "Dining out and takeout",
        isActive: true,
      },
      {
        name: "Coffee",
        description: "Coffee shops and beverages",
        isActive: true,
      },
    ],
  },
  {
    name: "Transportation",
    description: "Travel and transportation costs",
    color: "#3B82F6",
    icon: "car",
    sortOrder: 2,
    isActive: true,
    defaultSubcategories: [
      { name: "Gas", description: "Fuel and gas expenses", isActive: true },
      {
        name: "Public Transit",
        description: "Bus, train, and public transportation",
        isActive: true,
      },
      {
        name: "Parking",
        description: "Parking fees and permits",
        isActive: true,
      },
      {
        name: "Maintenance",
        description: "Car maintenance and repairs",
        isActive: true,
      },
    ],
  },
  {
    name: "Entertainment",
    description: "Entertainment and leisure activities",
    color: "#8B5CF6",
    icon: "ticket",
    sortOrder: 3,
    isActive: true,
    defaultSubcategories: [
      { name: "Movies", description: "Movies and theaters", isActive: true },
      {
        name: "Sports",
        description: "Sports events and activities",
        isActive: true,
      },
      { name: "Games", description: "Video games and gaming", isActive: true },
      {
        name: "Books",
        description: "Books and reading materials",
        isActive: true,
      },
    ],
  },
  {
    name: "Shopping",
    description: "Shopping and personal purchases",
    color: "#EC4899",
    icon: "shopping-bag",
    sortOrder: 4,
    isActive: true,
    defaultSubcategories: [
      {
        name: "Clothing",
        description: "Clothes and accessories",
        isActive: true,
      },
      {
        name: "Electronics",
        description: "Electronics and gadgets",
        isActive: true,
      },
      {
        name: "Home Goods",
        description: "Home and household items",
        isActive: true,
      },
      {
        name: "Personal Care",
        description: "Personal care and beauty products",
        isActive: true,
      },
    ],
  },
  {
    name: "Bills & Utilities",
    description: "Regular bills and utility payments",
    color: "#F59E0B",
    icon: "document-text",
    sortOrder: 5,
    isActive: true,
    defaultSubcategories: [
      { name: "Electric", description: "Electricity bills", isActive: true },
      {
        name: "Internet",
        description: "Internet and cable services",
        isActive: true,
      },
      {
        name: "Phone",
        description: "Phone and mobile services",
        isActive: true,
      },
      { name: "Insurance", description: "Insurance payments", isActive: true },
    ],
  },
];
