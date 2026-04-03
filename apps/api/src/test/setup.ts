/// <reference types="vitest/globals" />
// Global test setup for apps/api unit tests
// No infrastructure — runs in milliseconds

// Suppress console output in tests unless DEBUG=true
if (!process.env.DEBUG) {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
}
