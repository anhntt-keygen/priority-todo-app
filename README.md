# Priority Todo App with LocalStorage & Backend Sync

Ứng dụng quản lý công việc (Todo App) phân loại theo mức độ ưu tiên (High, Medium, Low), tích hợp bộ lọc thông minh, thống kê trực quan và cơ chế đồng bộ kép (Double-Sync) giữa REST API Backend và LocalStorage.

## Tính năng nổi bật
- **Phân loại mức độ ưu tiên:** High (Đỏ), Medium (Vàng), Low (Xanh lá).
- **Bộ lọc thông minh:** Lọc theo trạng thái (Tất cả, Đang làm, Đã xong) và lọc theo mức độ ưu tiên (Tất cả, High, Medium, Low).
- **Sắp xếp linh hoạt:** Sắp xếp theo mức độ ưu tiên giảm dần hoặc theo hạn chót (Due Date).
- **Đồng bộ kép (Double-Sync):** Dữ liệu được lưu trữ đồng thời trên Backend API (`todos.json`) và `localStorage` của trình duyệt để đảm bảo an toàn dữ liệu tối đa.
- **Thống kê trực quan:** Thanh tiến độ hoàn thành công việc và số lượng công việc theo từng mức độ ưu tiên.

## Hướng dẫn cài đặt và khởi chạy
1. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
2. Khởi chạy ứng dụng (Backend & Frontend):
   ```bash
   npm start
   ```
3. Chạy kiểm thử tự động E2E với Playwright:
   ```bash
   npm test
   ```
```

---