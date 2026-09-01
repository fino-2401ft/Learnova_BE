---
id: auth-m3-l2
course: Authentication & Security
module: Security Best Practices
title: Helmet
order: 2
difficulty: Intermediate
estimatedTime: 35
---
# Helmet

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Helmet là gì.
- Biết vì sao nên sử dụng Helmet.
- Cấu hình Helmet trong NestJS.
- Hiểu các HTTP Security Headers quan trọng.
- Áp dụng Helmet để tăng cường bảo mật ứng dụng.

---

## 📖 Definition

Helmet là một middleware dành cho Express và NestJS giúp **tự động thiết lập các HTTP Security Headers** nhằm giảm thiểu nhiều lỗ hổng bảo mật phổ biến.

Helmet không ngăn chặn Hacker trực tiếp nhưng giúp trình duyệt xử lý Website an toàn hơn.

Ví dụ các cuộc tấn công mà Helmet hỗ trợ giảm thiểu:

- Clickjacking
- MIME Sniffing
- Cross-Site Scripting (XSS)
- Information Disclosure

Helmet chỉ cần cấu hình một lần và sẽ áp dụng cho toàn bộ ứng dụng.

---

## 💻 Syntax

### Cài đặt

```bash
npm install helmet
```

---

### Enable Helmet

```typescript
import helmet from "helmet";

app.use(

    helmet()

);
```

---

### Configure Helmet

```typescript
app.use(

    helmet({

        contentSecurityPolicy: false

    })

);
```

---

## 📝 Example 1 - Enable Helmet

```typescript
import helmet from "helmet";

const app =

await NestFactory.create(AppModule);

app.use(

    helmet()

);
```

Output

```text
Helmet Enabled
```

### Giải thích

Helmet sẽ tự động thêm nhiều Security Headers vào mọi Response.

---

## 📝 Example 2 - Response Headers

Request

```http
GET /users
```

Response Header

```http
X-Content-Type-Options: nosniff

X-Frame-Options: SAMEORIGIN

X-DNS-Prefetch-Control: off
```

### Giải thích

Helmet tự động thêm các Header bảo mật giúp trình duyệt xử lý nội dung an toàn hơn.

---

## 📝 Example 3 - Disable Content Security Policy

```typescript
app.use(

    helmet({

        contentSecurityPolicy: false

    })

);
```

### Giải thích

Trong quá trình phát triển, một số ứng dụng có thể tạm thời tắt CSP để tránh xung đột với Frontend.

Trong môi trường Production nên cấu hình CSP phù hợp thay vì tắt hoàn toàn.

---

## ⚠️ Notes

### 1. X-Frame-Options

Ngăn Website bị nhúng vào iframe.

Ví dụ

```http
X-Frame-Options: SAMEORIGIN
```

Giúp giảm nguy cơ Clickjacking.

---

### 2. X-Content-Type-Options

```http
nosniff
```

Ngăn trình duyệt tự đoán kiểu dữ liệu.

Giảm nguy cơ thực thi mã độc.

---

### 3. Content Security Policy (CSP)

CSP quy định nguồn tài nguyên được phép tải.

Ví dụ

```text
Script

Image

Style

Font
```

CSP giúp giảm nguy cơ Cross-Site Scripting (XSS).

---

### 4. Hide Technology Information

Helmet có thể giảm việc tiết lộ thông tin về Server.

Điều này khiến kẻ tấn công khó xác định công nghệ đang sử dụng.

---

### 5. Helmet không thay thế Authentication

Helmet chỉ cấu hình Security Header.

Vẫn cần:

- JWT
- RBAC
- Validation
- Rate Limiting

để bảo vệ ứng dụng.

---

## 🌍 Real World Example

Một hệ thống quản lý doanh nghiệp.

Nếu không dùng Helmet

↓

Response

```http
X-Powered-By: Express
```

Kẻ tấn công biết Server đang sử dụng Express.

Sau khi cấu hình Helmet

↓

Header này sẽ được ẩn hoặc thay đổi tùy cấu hình.

Đồng thời nhiều Security Header khác cũng được thêm tự động.

---

## ❌ Common Mistakes

### Sai 1 - Không sử dụng Helmet

Nhiều ứng dụng chỉ cấu hình JWT mà bỏ qua Security Headers.

Helmet nên được bật ngay từ đầu dự án.

---

### Sai 2 - Tắt toàn bộ CSP

Sai

```typescript
contentSecurityPolicy: false
```

trong Production.

Nên cấu hình CSP phù hợp với ứng dụng.

---

### Sai 3 - Nghĩ Helmet chống được mọi cuộc tấn công

Helmet chỉ xử lý Security Headers.

Không thể thay thế:

- Authentication
- Authorization
- Validation
- HTTPS

---

### Sai 4 - Chỉ dùng Helmet trong Production

Nên sử dụng Helmet trong cả Development và Production để phát hiện sớm các vấn đề về Security Header.

---

## 📚 Summary

- Helmet là middleware giúp tăng cường bảo mật bằng HTTP Security Headers.
- Có thể tích hợp dễ dàng vào NestJS bằng `app.use(helmet())`.
- Helmet hỗ trợ giảm nguy cơ Clickjacking, MIME Sniffing và một số cuộc tấn công XSS.
- Helmet không thay thế Authentication, Authorization hay Validation.
- Trong Production nên cấu hình CSP thay vì tắt hoàn toàn.

---

## 📝 Quiz

### Question 1

Helmet chủ yếu dùng để làm gì?

A.

Hash Password

B.

Tạo JWT

C.

Thêm HTTP Security Headers

D.

Kết nối Database

**Answer: C**

**Giải thích:** Helmet đặt một loạt header bảo mật: `Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`… Nó không sửa gì trong logic ứng dụng, chỉ dựng thêm hàng rào ở tầng trình duyệt.


---

### Question 2

Middleware nào được dùng để tích hợp Helmet vào NestJS?

A.

```typescript
app.use(

    helmet()

);
```

B.

```typescript
app.enableHelmet();
```

C.

```typescript
app.useHelmet();
```

D.

```typescript
app.security();
```

**Answer: A**

**Giải thích:** Helmet là middleware Express nên gắn bằng `app.use(helmet())`. Nest không có phương thức riêng cho nó. Đặt càng sớm càng tốt trong `main.ts` để header áp cho mọi phản hồi, kể cả phản hồi lỗi.

