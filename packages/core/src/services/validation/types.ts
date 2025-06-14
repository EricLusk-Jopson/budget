import { ValidationErrorCodes } from "../constants/validation-errors";

// Validation Result Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field?: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationWarning {
  field?: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Import validation types
export interface ImportTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category?: string;
  subcategory?: string;
  channelName?: string;
  poolName?: string;
  [key: string]: unknown;
}

export type ValidationErrorCode =
  (typeof ValidationErrorCodes)[keyof typeof ValidationErrorCodes];
