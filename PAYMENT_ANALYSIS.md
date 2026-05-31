# PAYMENT ANALYSIS - MineShop

## 1. Thành phần hiện có (Current Components)

### Frontend
- **Example Components (`frontend/src/components/example_components`)**:
    - `Checkout.tsx`: UI cổng thanh toán với QR Code, thông tin chuyển khoản và giả lập webhook.
    - `History.tsx`: UI lịch sử giao dịch.
    - `Settings.tsx`: UI cấu hình hệ thống (có phần config chung).
    - `Admin.tsx`: UI quản lý tổng thể cho Admin.
    - `Success.tsx`: UI thông báo thành công.
- **Features (`frontend/src/features`)**:
    - `payment`: Đã có thư mục nhưng chưa có logic.
    - `dashboard`: Chứa thông tin ví của user.

### Backend
- **Models**:
    - `Package.js`: Model cho các gói nạp (Coin, VIP, Pass).
    - `Transaction.js`: Model lưu trữ lịch sử giao dịch. Chưa có các trường chuyên dụng cho PayOS (orderCode, paymentUrl, etc.).
- **Routes**:
    - `packageRoutes.js`: Lấy danh sách gói nạp public và endpoint mua gói (đang ở mức basic).
- **Controllers**:
    - `adminController.js`: Chứa logic `getPublicPackages` và `purchasePackage` (hiện tại có thể mới chỉ là mock hoặc logic đơn giản).

## 2. Database hiện có
- **Collection `packages`**: name, description, price, coinAmount, bonusCoin, isVisible, category.
- **Collection `transactions`**: user, type, item, amount, coinsChange, status.

## 3. Thiếu sót để hoàn thiện (Gaps)
- **Model PayOS Config**: Chưa có model lưu Client ID, API Key, Checksum Key cho PayOS.
- **PayOS Integration**: Chưa tích hợp SDK `@payos/node`.
- **Webhook Handling**: Chưa có endpoint `/api/payment/webhook` để nhận thông báo từ PayOS.
- **Anti-Duplicate**: Chưa xử lý logic kiểm tra transaction đã PAID hay chưa để tránh cộng tiền lỗi.
- **Frontend Pages**: Cần chuyển các example components sang code chính, refactor và kết nối API thật.
- **Admin Management**: Chưa có UI/API hoàn chỉnh để quản lý Package và Payment Config.
- **Minecraft Service**: Chưa có kiến trúc `minecraftService` để chuẩn bị cho việc đồng bộ coin ingame.

## 4. Tái sử dụng thành phần (Reusable Components)
- `Checkout.tsx`: Dùng làm template cho trang thanh toán QR.
- `Success.tsx`: Dùng làm template cho trang kết quả thành công.
- `History.tsx`: Dùng làm template cho trang lịch sử giao dịch của user và admin.
- `Settings.tsx`: Dùng làm template cho form cấu hình PayOS.

---
*Báo cáo được thực hiện bởi Senior Fullstack Engineer/Architect.*
