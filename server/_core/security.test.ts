import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./cookies";
import { assertValidStorageKey, isValidStorageKey } from "./storageKey";

describe("security hardening", () => {
  it("uses browser-compatible, CSRF-resistant session cookie defaults", () => {
    const httpOptions = getSessionCookieOptions({
      protocol: "http",
      headers: {},
    } as Parameters<typeof getSessionCookieOptions>[0]);

    expect(httpOptions).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    });

    const httpsOptions = getSessionCookieOptions({
      protocol: "http",
      headers: { "x-forwarded-proto": "https" },
    } as Parameters<typeof getSessionCookieOptions>[0]);

    expect(httpsOptions).toMatchObject({
      sameSite: "lax",
      secure: true,
    });
  });

  it("rejects unsafe storage proxy keys", () => {
    expect(isValidStorageKey("reports/plan-2026.png")).toBe(true);
    expect(assertValidStorageKey("/reports/plan-2026.png")).toBe("reports/plan-2026.png");
    expect(isValidStorageKey("../secret.txt")).toBe(false);
    expect(isValidStorageKey("reports//secret.txt")).toBe(false);
    expect(isValidStorageKey("reports/<script>.png")).toBe(false);
    expect(isValidStorageKey("reports/")).toBe(false);
  });
});
