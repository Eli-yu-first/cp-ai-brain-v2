const STORAGE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,511}$/;

export function normalizeStorageKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").trim();
}

export function isValidStorageKey(relKey: string): boolean {
  const key = normalizeStorageKey(relKey);
  if (!STORAGE_KEY_PATTERN.test(key)) return false;
  if (key.includes("..")) return false;
  if (key.includes("//")) return false;
  if (key.endsWith("/")) return false;
  return true;
}

export function assertValidStorageKey(relKey: string): string {
  const key = normalizeStorageKey(relKey);
  if (!isValidStorageKey(key)) {
    throw new Error("Invalid storage key");
  }
  return key;
}
