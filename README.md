# Smart Parking App

## Giới thiệu và mô tả dự án
Smart Parking App là một hệ thống quản lý và đặt chỗ bãi đỗ xe thông minh, hỗ trợ người dùng tìm kiếm, đặt chỗ, xem thông tin bãi đỗ xe và chỉ đường đến bãi đỗ xe mong muốn. Ứng dụng hướng tới việc tối ưu hóa trải nghiệm đỗ xe tại các thành phố lớn, giúp tiết kiệm thời gian và công sức cho người dùng.

## Yêu cầu hệ thống
- Node.js >= 18.x
- npm >= 9.x
- Hệ điều hành: Windows, macOS hoặc Linux

## Các tính năng chính
- Đăng ký, đăng nhập và phân quyền người dùng (người dùng thường, chủ bãi đỗ xe)
- Tìm kiếm và xem thông tin chi tiết các bãi đỗ xe trên bản đồ
- Đặt chỗ đỗ xe trực tuyến, quản lý lịch sử đặt chỗ
- Quản lý bãi đỗ xe dành cho chủ bãi (thêm/sửa/xóa bãi đỗ, quản lý chỗ trống, xem thống kê)
- Chỉ đường từ vị trí hiện tại đến bãi đỗ xe (tích hợp ArcGIS Routing API)

## Hướng dẫn cài đặt và khởi động dự án
1. **Clone source code:**
   ```sh
   git clone <repo-url>
   cd Smart-parking-app
   ```
2. **Cài đặt dependencies:**
   ```sh
   npm install
   ```
3. **Cấu hình API key cho chức năng chỉ đường:**
   - Tạo file `.env` ở thư mục `client` với nội dung:
     ```env
     VITE_ARCGIS_API_KEY=your_arcgis_api_key
     ```
   - Thay `your_arcgis_api_key` bằng API key ArcGIS của bạn.
4. **Khởi động server (bao gồm cả client và API):**
   ```sh
   npm run dev
   ```
   - Ứng dụng sẽ chạy tại địa chỉ: http://localhost:5000

---
Mọi thắc mắc hoặc đóng góp vui lòng liên hệ nhóm phát triển.
