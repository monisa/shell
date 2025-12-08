/* eslint-disable @typescript-eslint/no-explicit-any */
export const toKebabCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();

export type FlatTokenCallback = (key: string, value: string | number) => void;

export const deepFlattenTokens = (
  prefix: string,
  payload: Record<string, any>,
  onToken: FlatTokenCallback
): void => {
  Object.entries(payload).forEach(([key, value]) => {
    const normalizedKey = [prefix, toKebabCase(key)].filter(Boolean).join('-');

    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      deepFlattenTokens(normalizedKey, value, onToken);
      return;
    }

    onToken(normalizedKey, value);
  });
};