// Type declarations for Preline global helpers
// Provides minimal typing so calling window.HSStaticMethods?.autoInit() is type-safe.

interface HSStaticMethods {
  autoInit(): void;
}

declare global {
  interface Window {
    HSStaticMethods?: HSStaticMethods;
  }
}

export {};
