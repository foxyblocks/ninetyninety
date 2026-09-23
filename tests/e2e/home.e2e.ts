import { expect, test } from "@playwright/test"

test.describe("Home Page", () => {
  test("should display the main heading", async ({ page }) => {
    await page.goto("/")

    // Check that the page has loaded
    await expect(page).toHaveTitle(/NinetyNinety/)

    // Check for the main heading
    const heading = page.getByRole("heading", { name: "Loved by both sides." })
    await expect(heading).toBeVisible()

    // Check for the tagline
    const tagline = page.getByText(/qualifying films|catalog is warming up/i).first()
    await expect(tagline).toBeVisible()
  })

  test("should be responsive", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Loved by both sides." })).toBeVisible()

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole("heading", { name: "Loved by both sides." })).toBeVisible()
  })
})
