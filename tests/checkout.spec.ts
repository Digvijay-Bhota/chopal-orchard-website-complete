import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await page.getByRole('link', { name: 'Explore Our Harvest' }).click();

  await page.getByRole('button', { name: 'Add' }).first().click();

  await page.locator('iframe').contentFrame()
    .getByTestId('contactNumber')
    .click();

  await page.locator('iframe').contentFrame()
    .getByTestId('contactNumber')
    .fill('9999999999');

  // Keep the remaining generated actions for now.
});