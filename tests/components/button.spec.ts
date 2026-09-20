import { test, expect } from '@playwright/test';

test('Button Default story renders', async ({ mount }) => {
  const component = await mount('components/Button/Default');
  await expect(component.getByRole('button')).toBeVisible();
  await expect(component.getByRole('button')).toHaveText('Click me');
});

test('Button Disabled story renders', async ({ mount }) => {
  const component = await mount('components/Button/Disabled');
  await expect(component.getByRole('button', { disabled: true })).toBeVisible();
});

test('Button Stateful records expanded state', async ({ mount }) => {
  const component = await mount('components/Button/Stateful');
  // Initially collapsed
  await expect(component.locator('input[data-testid="expanded"]')).toHaveValue('false');
  // Click to expand
  await component.locator('button').click();
  await expect(component.locator('input[data-testid="expanded"]')).toHaveValue('true');
});