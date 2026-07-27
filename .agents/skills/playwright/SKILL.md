---
name: playwright
description: End-to-end (E2E) web testing, browser automation, visual regression testing, and user-facing assertions.
---

# Playwright E2E Testing

1. **Selector Strategy**: Prefer user-facing locators (`getByRole`, `getByTestId`, `getByText`) matching Reticle `data-testid` attributes.
2. **Assertions**: Use auto-retrying assertions (`await expect(page.getByTestId('submit-btn')).toBeVisible()`).
3. **Flakiness Prevention**: Avoid hardcoded delays (`page.waitForTimeout()`); wait on network/DOM events.
