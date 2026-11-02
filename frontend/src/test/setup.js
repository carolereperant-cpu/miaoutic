// Runs before every unit test: adds matchers such as
// toBeInTheDocument() and cleans the page after each test.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
