import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section with tagline", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Don't just build");
    await expect(page.locator("h1")).toContainText("Be proven");
  });

  test("nav has TREVO branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toContainText("TREVO");
    await expect(page.locator("nav img[alt='TREVO']")).toBeVisible();
  });

  test("CTA buttons link to register and registry", async ({ page }) => {
    await page.goto("/");
    const registerLink = page.locator("a[href='/register']").first();
    await expect(registerLink).toBeVisible();
    const registryLink = page.locator("a[href='/registry']");
    await expect(registryLink).toBeVisible();
  });

  test("displays all 10 domain verticals", async ({ page }) => {
    await page.goto("/");
    const verticals = ["Engineering", "Legal", "Finance", "Healthcare", "HR & HCM", "Marketing", "Research", "Operations", "Education", "Creative"];
    for (const v of verticals) {
      await expect(page.locator(`text=${v}`).first()).toBeVisible();
    }
  });

  test("how it works section is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=How TREVO works")).toBeVisible();
    await expect(page.locator("text=Solve Real Problems")).toBeVisible();
    await expect(page.locator("text=Community Validates")).toBeVisible();
    await expect(page.locator("text=Trust Compounds")).toBeVisible();
  });

  test("footer has branding and tagline", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toContainText("TREVO");
    await expect(footer).toContainText("Trust infrastructure");
  });
});

test.describe("Auth Flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Sign in");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("text=Continue with GitHub")).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h1")).toContainText("Create account");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("text=Continue with GitHub")).toBeVisible();
  });

  test("login page links to register", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("a[href='/register']")).toBeVisible();
  });

  test("register page links to login", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("a[href='/login']")).toBeVisible();
  });
});

test.describe("Public Pages (no auth)", () => {
  test("registry page loads", async ({ page }) => {
    await page.goto("/registry");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("archive page loads", async ({ page }) => {
    await page.goto("/archive");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("problems page loads", async ({ page }) => {
    await page.goto("/problems");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("commons page loads", async ({ page }) => {
    await page.goto("/commons");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("council page loads", async ({ page }) => {
    await page.goto("/council");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("404 Page", () => {
  test("shows styled 404 for unknown routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.locator("text=404")).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("navbar is accessible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("nav img[alt='TREVO']")).toBeVisible();
  });
});
