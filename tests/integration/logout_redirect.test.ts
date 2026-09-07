import { describe, it, expect, vi } from "vitest";
import { logoutAction } from "@/app/(auth)/actions";
import { POST as logoutPost, GET as logoutGet } from "@/app/api/v1/auth/logout/route";

describe("Logout Redirection & Session Revocation", () => {
  it("logoutAction invalidates auth and explicitly returns redirectUrl '/'", async () => {
    const result = await logoutAction();
    expect(result.success).toBe(true);
    expect(result.data?.redirectUrl).toBe("/");
  });

  it("POST /api/v1/auth/logout redirects to landing page '/' with status 303", async () => {
    const request = new Request("https://tasqone.com/api/v1/auth/logout", {
      method: "POST",
    });
    const response = await logoutPost(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://tasqone.com/");
  });

  it("GET /api/v1/auth/logout redirects to landing page '/' with status 303", async () => {
    const request = new Request("https://tasqone.com/api/v1/auth/logout", {
      method: "GET",
    });
    const response = await logoutGet(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://tasqone.com/");
  });
});
