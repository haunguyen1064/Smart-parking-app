# Tài liệu cơ sở dữ liệu - Ứng dụng Bãi đỗ xe Thông minh

## Các thực thể và mối quan hệ

Ứng dụng Bãi đỗ xe Thông minh bao gồm các thực thể chính và mối quan hệ sau:

### Các thực thể

1. **Người dùng**: Đại diện cho người sử dụng ứng dụng, có thể là người dùng thông thường tìm chỗ đỗ hoặc chủ sở hữu quản lý bãi đỗ xe.
   
2. **Bãi đỗ xe**: Đại diện cho một bãi đỗ xe mà người dùng có thể đặt chỗ. Mỗi bãi đỗ xe thuộc sở hữu của một người dùng có vai trò "owner" (chủ sở hữu).

3. **Sơ đồ bãi đỗ**: Đại diện cho bố trí vật lý các chỗ đỗ trong một bãi đỗ xe, được tổ chức theo hàng và vị trí.

4. **Đặt chỗ**: Đại diện cho một lượt đặt chỗ của người dùng cho một vị trí đỗ xe cụ thể trong một bãi đỗ xe trong một khoảng thời gian xác định.

### Mối quan hệ

1. **Người dùng - Bãi đỗ xe**: Một-nhiều (Một người dùng có vai trò "owner" có thể sở hữu nhiều bãi đỗ xe)
   - Thực hiện qua khóa ngoại `ownerId` trong bảng `parking_lots`

2. **Bãi đỗ xe - Sơ đồ bãi đỗ**: Một-nhiều (Một bãi đỗ xe có thể có nhiều sơ đồ bố trí)
   - Thực hiện qua khóa ngoại `parkingLotId` trong bảng `parking_layouts`

3. **Người dùng - Đặt chỗ**: Một-nhiều (Một người dùng có thể đặt nhiều lượt)
   - Thực hiện qua khóa ngoại `userId` trong bảng `bookings`

4. **Bãi đỗ xe - Đặt chỗ**: Một-nhiều (Một bãi đỗ xe có thể có nhiều lượt đặt chỗ)
   - Thực hiện qua khóa ngoại `parkingLotId` trong bảng `bookings`


## Các bảng và thuộc tính

### 1. users

Lưu thông tin về người dùng ứng dụng.

| Thuộc tính    | Kiểu     | Mô tả                                              | Ràng buộc             |
|--------------|----------|----------------------------------------------------|-----------------------|
| id           | serial   | Định danh duy nhất cho người dùng                  | Khóa chính            |
| username     | text     | Tên đăng nhập                                      | Không rỗng, Duy nhất  |
| password     | text     | Mật khẩu đã mã hóa                                 | Không rỗng            |
| fullName     | text     | Họ tên đầy đủ                                      | Không rỗng            |
| email        | text     | Địa chỉ email                                      | Không rỗng, Duy nhất  |
| phoneNumber  | text     | Số điện thoại liên hệ                              | Tùy chọn              |
| role         | text     | Vai trò người dùng ("user" hoặc "owner")           | Không rỗng, Mặc định "user" |

### 2. parking_lots

Lưu thông tin về các bãi đỗ xe.

| Thuộc tính      | Kiểu       | Mô tả                                            | Ràng buộc             |
|-----------------|------------|--------------------------------------------------|-----------------------|
| id              | serial     | Định danh duy nhất cho bãi đỗ xe                 | Khóa chính            |
| name            | text       | Tên bãi đỗ xe                                    | Không rỗng            |
| address         | text       | Địa chỉ bãi đỗ xe                                | Không rỗng            |
| latitude        | text       | Vĩ độ địa lý                                     | Không rỗng            |
| longitude       | text       | Kinh độ địa lý                                   | Không rỗng            |
| totalSpots      | integer    | Tổng số chỗ đỗ xe                                | Không rỗng            |
| availableSpots  | integer    | Số chỗ trống hiện tại                            | Không rỗng            |
| pricePerHour    | integer    | Giá đỗ xe mỗi giờ (đơn vị nhỏ nhất)              | Không rỗng            |
| description     | text       | Thông tin mô tả về bãi đỗ xe                     | Tùy chọn              |
| openingHour     | text       | Giờ mở cửa                                       | Không rỗng            |
| closingHour     | text       | Giờ đóng cửa                                     | Không rỗng            |
| ownerId         | integer    | ID người sở hữu bãi đỗ xe                        | Không rỗng            |
| images          | text[]     | Mảng URL hình ảnh của bãi đỗ xe                  | Tùy chọn              |
| layouts         | jsonb[]    | Mảng dữ liệu sơ đồ bãi đỗ xe                     | Không rỗng, Mặc định [] |
| createdAt       | timestamp  | Thời điểm tạo bản ghi bãi đỗ xe                  | Không rỗng, Mặc định hiện tại |

### 3. parking_layouts

Lưu cấu hình bố trí cụ thể các chỗ đỗ trong một bãi đỗ xe.

| Thuộc tính    | Kiểu     | Mô tả                                              | Ràng buộc             |
|--------------|----------|----------------------------------------------------|-----------------------|
| id           | serial   | Định danh duy nhất cho sơ đồ                       | Khóa chính            |
| parkingLotId | integer  | ID bãi đỗ xe liên kết                              | Không rỗng            |
| name         | text     | Tên/định danh sơ đồ                                | Không rỗng            |
| rows         | jsonb    | Dữ liệu JSON mô tả các hàng và vị trí đỗ           | Không rỗng            |

Trường `rows` chứa dữ liệu cấu trúc gồm:
- `prefix`: Ký hiệu hàng (ví dụ: "A", "B", "C")
- `slots`: Mảng các vị trí đỗ trong hàng, mỗi vị trí gồm:
  - `id`: Định danh vị trí (ví dụ: "A1", "A2")
  - `status`: Trạng thái hiện tại (ví dụ: "available", "occupied", "reserved")

### 4. bookings

Lưu thông tin về các lượt đặt chỗ đỗ xe.

| Thuộc tính      | Kiểu      | Mô tả                                            | Ràng buộc             |
|-----------------|-----------|--------------------------------------------------|-----------------------|
| id              | serial    | Định danh duy nhất cho lượt đặt chỗ              | Khóa chính            |
| userId          | integer   | ID người dùng đặt chỗ                            | Không rỗng            |
| parkingLotId    | integer   | ID bãi đỗ xe được đặt                            | Không rỗng            |
| parkingSpaceId  | text      | ID vị trí đỗ cụ thể (ví dụ: "A1")                | Không rỗng            |
| startTime       | timestamp | Thời gian bắt đầu đặt chỗ                        | Không rỗng            |
| endTime         | timestamp | Thời gian kết thúc đặt chỗ                       | Không rỗng            |
| status          | text      | Trạng thái đặt chỗ                                | Không rỗng, Mặc định "pending" |
| totalPrice      | integer   | Tổng giá trị đặt chỗ (đơn vị nhỏ nhất)            | Không rỗng            |
| createdAt       | timestamp | Thời điểm tạo lượt đặt chỗ                       | Không rỗng, Mặc định hiện tại |

Trường `status` có thể nhận các giá trị: "pending", "confirmed", "completed", "cancelled"

