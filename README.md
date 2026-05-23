<h1 align="center">Vaxlou- All in one for Gemini</h1>

<p align="center">
  <strong> Bộ công cụ nâng cao hiệu suất chuyên sâu cho Gemini </strong>
  <br />
  <em>Works with Gemini.</em>
</p>

<p align="center">
  <a href="https://trendshift.io/repositories/23482" target="_blank"><img src="https://trendshift.io/api/badge/repositories/23482" alt="Lum1104%2FUnderstand-Anything | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
</p>

<p align="center">
  <a href="README.md">Tiếng Việt</a> | <a href="READMEs/README.zh-CN.md">简体中文</a> | <a href="READMEs/README.zh-TW.md">繁體中文</a> | <a href="READMEs/README.ja-JP.md">日本語</a> | <a href="READMEs/README.ko-KR.md">한국어</a> | <a href="READMEs/README.es-ES.md">Español</a> | <a href="READMEs/README.tr-TR.md">Türkçe</a> | <a href="READMEs/README.ru-RU.md">Русский</a>
</p>

<p align="center">
  <img src="banner.jpeg" alt="Vaxlou - All in one for Gemini" width="800" />
</p>


---


Tiện ích mở rộng trình duyệt cho Google Gemini, tích hợp bộ công cụ nâng cao hiệu suất làm việc chuyên sâu, cơ chế định tuyến mã khóa API bảo mật và hệ thống xử lý dựa trên ngữ cảnh hội thoại. 

> **Kho lưu trữ này áp dụng cấu trúc monorepo nhằm phân tách độc lập các thành phần luồng nền (background logic), lớp giao diện người dùng (user interface layer) và các trình can thiệp mã lệnh (script injection engines).

---

## ✨Tổng quan


Tiện ích nâng cao ứng dụng web Google Gemini mặc định bằng cách can thiệp và chèn các bảng điều khiển bên (side-panels) và thanh công cụ ngữ cảnh. Để vận hành an toàn và không xung đột với Chính sách Bảo mật Nội dung (CSP) nghiêm ngặt của Google, mọi giao dịch mạng tải nặng và điều phối LLM bên thứ ba (ví dụ: Groq Cloud, Google AI Studio) đều được ủy nhiệm (proxy) bất đồng bộ thông qua một background service worker cô lập.

### Biên dịch bản Beta
Để khởi chạy phiên bản phát triển mới nhất (bleeding-edge), lập trình viên có thể tiến hành biên dịch cục bộ từ mã nguồn.


### Hướng dẫn Biên dịch

 1. Sao chép kho lưu trữ về máy cục bộ:
```bash
   git clone [https://github.com/vaxlou/extension.git](https://github.com/vaxlou/extension.git)
   cd extension
```
 2. Cài đặt các gói phụ thuộc trong không gian làm việc (workspace):

```bash
   yarn install

```
 3. Biên dịch tất cả các package nội bộ và tự động cập nhật khi có thay đổi (watch mode):

```bash
   yarn watch

```

4. Hoặc biên dịch một bản duy nhất đã tối ưu hóa cho môi trường production:

```bash
   yarn build
```

---
### Khởi chạy Tiện ích trên Trình duyệt
```bash
Các tệp tin sau khi cấu hình build thành công sẽ được xuất bản trong thư mục packages/extension/build.
Truy cập đường dẫn chrome://extensions/ trên trình duyệt.
Kích hoạt Chế độ nhà phát triển (Developer mode) ở góc trên bên phải màn hình.
Nhấp vào nút Tải tiện ích đã giải nén (Load unpacked) và chọn đường dẫn đến thư mục packages/extension/build.
Tìm và chọn tệp tệp cấu hình manifest.json bên trong thư mục build output vừa biên dịch.
```
---
### Cấu trúc Dự án

- Mã nguồn được phân tách thành các không gian làm việc (workspaces) dạng mô-đun nằm trong thư mục packages/ để cô lập hoàn toàn ngữ cảnh thực thi:

1.packages/extension - Điểm đầu vào biên dịch chính (main compilation entry point), chứa các tệp cấu hình manifest tài nguyên và đóng gói phân phối cuối cùng.

2.packages/extension-base - Xử lý luồng nền cốt lõi (core background workers), lớp dữ liệu bền vững (persistent data layer), cơ chế proxy fetch bất đồng bộ giữa các nguồn (cross-origin) và bộ điều khiển trạng thái mã hóa.

3.packages/extension-ui - Các thành phần React/UI cấu thành nên bố cục glassmorphic, công cụ ghi chú rich-text và cây dàn ý cấu trúc DOM thời gian thực.

4.packages/extension-optimizer - Thanh công cụ can thiệp trực tiếp vào DOM (direct DOM-injection), cơ chế đồng bộ hóa bố cục và các thuật toán ước lượng (heuristics) dự phòng ngoại tuyến.

---
### Triết lý Bảo mật và Quyền riêng tư
- Lưu trữ Cục bộ (Local-First): Tiện ích tuân thủ nguyên tắc không thu thập dữ liệu phân tích người dùng (analytics), cấu trúc cuộc trò chuyện hoặc gửi các thông tin khóa API dạng văn bản thô (plain-text) về các máy chủ đồng bộ bên thứ ba. Mọi dữ liệu hoàn toàn nằm trong sandbox của thực thể trình duyệt cục bộ.

- An toàn chống can thiệp CSP: Lớp nền tiện ích (extension-base) sử dụng các content script khai báo nghiêm ngặt và giao diện proxy nội dung rõ ràng nhằm ngăn chặn các đoạn mã độc hại từ bên thứ ba đọc giá trị trạng thái hệ thống.
---
<p align="center">
  <em>Sản phẩm là hậu quả của videcode quá 180p</em>
</p>

