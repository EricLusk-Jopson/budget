// packages/core/src/index.ts

/**
 * @fileoverview Core package entry point
 *
 * This package contains the core business logic, data models, and services
 * for the values-based budgeting application. It provides the foundation
 * that all other packages (web, mobile, desktop) depend on.
 */

// Export all data models
export * from "./models";

// Export services (to be implemented)
export * from "./services";

// Export utilities (to be implemented)
export * from "./utils";

// Package version and metadata
export const CORE_VERSION = "1.0.0";
export const CORE_NAME = "@budget/core";
