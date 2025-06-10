# Values-Based Budget App

A comprehensive budgeting application that helps users align their spending with their personal values.

## Project Structure

This is a monorepo containing multiple packages and applications:

- `packages/core` - Core business logic and data models
- `packages/api` - Firebase integration layer
- `packages/state` - Redux state management
- `packages/ui` - Shared UI components
- `apps/web` - Web application
- `firebase/functions` - Cloud Functions

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Getting Started

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build
```
