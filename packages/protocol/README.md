# @protocol

AI contracts and adapters:
- JSON Schemas for analysis outputs.
- Validators (Zod).
- Provider clients (mock first, real later).
- No React/UI imports.

## SalesCall Schema

The `SalesCall` schema provides type-safe validation for sales call analysis data.

### Usage

```typescript
import { validateSalesCall, type SalesCall } from '@mudul/protocol';

// Validate incoming data
const result = validateSalesCall(jsonData);
if (result.success) {
  const salesCall: SalesCall = result.data;
  // Use typed data safely
} else {
  console.error('Validation failed:', result.errors);
}
```

### Return Type

The validator returns a `ValidationResult<SalesCall>`:

```typescript
type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: ZodIssue[] };
```