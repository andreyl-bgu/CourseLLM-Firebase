import { test, expect } from "@playwright/test";
import { loginAsTeacher } from "../helpers/auth-helpers";

test.describe("Teacher Monitoring", () => {
  test("monitoring page renders and API responds", async ({ page, request }) => {
    await loginAsTeacher(page, request);

    await page.goto("/teacher/monitoring");
    await expect(page.getByRole("heading", { name: "System Monitoring" })).toBeVisible();

    const res = await request.get("/api/monitoring?format=raw");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.data).toBeTruthy();
  });
});

