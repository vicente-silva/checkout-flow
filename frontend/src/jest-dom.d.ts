// Ensures the @testing-library/jest-dom matcher type augmentations
// (toBeInTheDocument, toBeDisabled, etc.) are visible to every spec file's
// TS program, regardless of import order. Runtime registration of the
// matchers themselves still happens via jest.setup.ts.
import '@testing-library/jest-dom';
