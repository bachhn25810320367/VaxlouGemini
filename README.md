Tiện ích mở rộng trình duyệt cho Google Gemini, tích hợp bộ công cụ nâng cao hiệu suất làm việc chuyên sâu, cơ chế định tuyến mã khóa API bảo mật và hệ thống xử lý dựa trên ngữ cảnh hội thoại. 

Kho lưu trữ này áp dụng cấu trúc monorepo nhằm phân tách độc lập các thành phần luồng nền (background logic), lớp giao diện người dùng (user interface layer) và các trình can thiệp mã lệnh (script injection engines).

## Tổng quan

Tiện ích nâng cao ứng dụng web Google Gemini mặc định bằng cách can thiệp và chèn các bảng điều khiển bên (side-panels) và thanh công cụ ngữ cảnh. Để vận hành an toàn và không xung đột với Chính sách Bảo mật Nội dung (CSP) nghiêm ngặt của Google, mọi giao dịch mạng tải nặng và điều phối LLM bên thứ ba (ví dụ: Groq Cloud, Google AI Studio) đều được ủy nhiệm (proxy) bất đồng bộ thông qua một background service worker cô lập.

### Biên dịch bản Beta
Để khởi chạy phiên bản phát triển mới nhất (bleeding-edge), lập trình viên có thể tiến hành biên dịch cục bộ từ mã nguồn.


### Hướng dẫn Biên dịch

1. Sao chép kho lưu trữ về máy cục bộ:
```bash
   git clone [https://github.com/vaxlou/extension.git](https://github.com/vaxlou/extension.git)
   cd extension
Cài đặt các gói phụ thuộc trong không gian làm việc (workspace):

Bash
   yarn install
Biên dịch tất cả các package nội bộ và tự động cập nhật khi có thay đổi (watch mode):

Bash
   yarn watch
Hoặc biên dịch một bản duy nhất đã tối ưu hóa cho môi trường production:

Bash
   yarn build
Khởi chạy Tiện ích trên Trình duyệt
Các tệp tin sau khi cấu hình build thành công sẽ được xuất bản trong thư mục packages/extension/build.

Google Chrome / Chromium:

Truy cập đường dẫn chrome://extensions/ trên trình duyệt.

Kích hoạt Chế độ nhà phát triển (Developer mode) ở góc trên bên phải màn hình.

Nhấp vào nút Tải tiện ích đã giải nén (Load unpacked) và chọn đường dẫn đến thư mục packages/extension/build.

Tìm và chọn tệp tệp cấu hình manifest.json bên trong thư mục build output vừa biên dịch.

Cấu trúc Dự án

Mã nguồn được phân tách thành các không gian làm việc (workspaces) dạng mô-đun nằm trong thư mục packages/ để cô lập hoàn toàn ngữ cảnh thực thi:

packages/extension - Điểm đầu vào biên dịch chính (main compilation entry point), chứa các tệp cấu hình manifest tài nguyên và đóng gói phân phối cuối cùng.

packages/extension-base - Xử lý luồng nền cốt lõi (core background workers), lớp dữ liệu bền vững (persistent data layer), cơ chế proxy fetch bất đồng bộ giữa các nguồn (cross-origin) và bộ điều khiển trạng thái mã hóa.

packages/extension-ui - Các thành phần React/UI cấu thành nên bố cục glassmorphic, công cụ ghi chú rich-text và cây dàn ý cấu trúc DOM thời gian thực.

packages/extension-optimizer - Thanh công cụ can thiệp trực tiếp vào DOM (direct DOM-injection), cơ chế đồng bộ hóa bố cục và các thuật toán ước lượng (heuristics) dự phòng ngoại tuyến.

Cấu trúc Lưu trữ Trạng thái (Storage State Schema)
Toàn bộ hoạt động của tiện ích được quản lý cục bộ bên trong một không gian lưu trữ cô lập thuộc thuộc tính chrome.storage.local. Cấu trúc bộ nhớ nội bộ được ánh xạ theo lược đồ dưới đây:

JSON
{
  "folders": [],
  "chatToFolder": {},
  "chatNotes": {
    "chat_id_string": {
      "content": "string (HTML rich-text payload)",
      "attachments": [
        { "name": "string", "data": "string (Base64 encoding)" }
      ]
    }
  },
  "settings": {
    "language": "vi",
    "apiKeys": [
      { "key": "string", "model": "string" }
    ],
    "activeKeyIndex": 0,
    "features": {
      "followUpEnabled": true,
      "optimizerEnabled": true
    }
  }
}
Triết lý Bảo mật và Quyền riêng tư
Lưu trữ Cục bộ (Local-First): Tiện ích tuân thủ nguyên tắc không thu thập dữ liệu phân tích người dùng (analytics), cấu trúc cuộc trò chuyện hoặc gửi các thông tin khóa API dạng văn bản thô (plain-text) về các máy chủ đồng bộ bên thứ ba. Mọi dữ liệu hoàn toàn nằm trong sandbox của thực thể trình duyệt cục bộ.

An toàn chống can thiệp CSP: Lớp nền tiện ích (extension-base) sử dụng các content script khai báo nghiêm ngặt và giao diện proxy nội dung rõ ràng nhằm ngăn chặn các đoạn mã độc hại từ bên thứ ba đọc giá trị trạng thái hệ thống.

Đóng góp và Báo lỗi
Vui lòng đọc kỹ Hướng dẫn Đóng góp trước khi gửi các bản vá (Pull Requests).

Mọi chỉnh sửa mã nguồn đều phải tuân thủ nghiêm ngặt các quy trình kiểm tra lỗi cú pháp (linting). Hãy đảm bảo không gian làm việc của bạn vượt qua bài kiểm tra trước khi xác nhận gửi mã: