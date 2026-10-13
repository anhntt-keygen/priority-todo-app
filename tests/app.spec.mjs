import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

test.describe('Priority Todo App E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Truy cập ứng dụng trước mỗi test case
    await page.goto(APP_URL);
  });

  test('[SC-01] Thêm công việc mới với mức độ ưu tiên', async ({ page }) => {
    // Nhập tên công việc
    await page.fill('[data-testid="todo-input"]', 'Lập trình Playwright Test');
    
    // Chọn mức độ ưu tiên High
    await page.selectOption('[data-testid="todo-priority-select"]', 'high');
    
    // Nhấn nút Thêm
    await page.click('[data-testid="todo-submit-btn"]');

    // Kiểm tra công việc mới xuất hiện trong danh sách
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await expect(todoItem).toBeVisible();
    await expect(todoItem).toContainText('Lập trình Playwright Test');
    await expect(todoItem).toContainText('high');
  });

  test('[SC-02] Lọc công việc theo mức độ ưu tiên', async ({ page }) => {
    // Thêm 1 công việc High
    await page.fill('[data-testid="todo-input"]', 'Công việc quan trọng');
    await page.selectOption('[data-testid="todo-priority-select"]', 'high');
    await page.click('[data-testid="todo-submit-btn"]');

    // Thêm 1 công việc Low
    await page.fill('[data-testid="todo-input"]', 'Công việc phụ');
    await page.selectOption('[data-testid="todo-priority-select"]', 'low');
    await page.click('[data-testid="todo-submit-btn"]');

    // Lọc chỉ hiển thị công việc High
    await page.selectOption('[data-testid="todo-filter-priority"]', 'high');

    // Kiểm tra danh sách chỉ chứa công việc High
    const items = page.locator('[data-testid="todo-item"]');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toContainText('high');
      await expect(items.nth(i)).not.toContainText('low');
    }
  });

  test('[SC-03] Đánh dấu hoàn thành và Xóa công việc', async ({ page }) => {
    // Thêm công việc mới
    await page.fill('[data-testid="todo-input"]', 'Công việc cần xóa');
    await page.selectOption('[data-testid="todo-priority-select"]', 'medium');
    await page.click('[data-testid="todo-submit-btn"]');

    const todoItem = page.locator('[data-testid="todo-item"]').first();
    
    // Đánh dấu hoàn thành (click checkbox)
    const checkbox = todoItem.locator('input[type="checkbox"]');
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Nhấn nút xóa
    const deleteBtn = todoItem.locator('button');
    await deleteBtn.click();

    // Đợi danh sách cập nhật và kiểm tra không còn công việc đó nữa
    await expect(page.locator('text=Công việc cần xóa')).not.toBeVisible();
  });

  test('[SC-04] Kiểm tra lưu trữ LocalStorage', async ({ page }) => {
    // Thêm công việc mới
    await page.fill('[data-testid="todo-input"]', 'Kiểm tra LocalStorage');
    await page.selectOption('[data-testid="todo-priority-select"]', 'medium');
    await page.click('[data-testid="todo-submit-btn"]');

    // Kiểm tra xem dữ liệu đã được lưu vào localStorage chưa
    const localStorageData = await page.evaluate(() => localStorage.getItem('todos'));
    expect(localStorageData).not.toBeNull();
    
    const parsedTodos = JSON.parse(localStorageData);
    expect(parsedTodos.some(t => t.title === 'Kiểm tra LocalStorage')).toBe(true);
  });
});