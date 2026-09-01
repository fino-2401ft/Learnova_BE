---
id: auth-m3-l1
course: Authentication & Security
module: Security Best Practices
title: CORS
order: 1
difficulty: Intermediate
estimatedTime: 35
---
# CORS (Cross-Origin Resource Sharing)

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu CORS là gì.
- Hiểu khái niệm Same-Origin Policy.
- Biết nguyên nhân xảy ra lỗi CORS.
- Cấu hình CORS trong NestJS.
- Áp dụng CORS an toàn trong môi trường Production.

---

## 📖 Definition

Theo mặc định, trình duyệt áp dụng **Same-Origin Policy (SOP)** để ngăn một website truy cập tài nguyên của website khác.

Hai URL được coi là **cùng Origin** khi giống nhau về:

- Protocol (HTTP/HTTPS)
- Domain
- Port

Ví dụ

```text
http://localhost:3000

↓

Origin
```

```text
http://localhost:3000/api

↓

Same Origin
```

Nhưng

```text
http://localhost:5173

↓

Different Origin
```

Khi Frontend và Backend khác Origin, trình duyệt sẽ chặn Request nếu Server chưa cho phép.

CORS (Cross-Origin Resource Sharing) là cơ chế cho phép Server chỉ định những Origin nào được phép truy cập tài nguyên.

---

## 💻 Syntax

### Enable CORS

```typescript
app.enableCors();
```

---

### Specify Origin

```typescript
app.enableCors({

    origin: "http://localhost:5173"

});
```

---

### Multiple Origins

```typescript
app.enableCors({

    origin: [

        "http://localhost:3000",

        "http://localhost:5173"

    ]

});
```

---

## 📝 Example 1 - Enable CORS

```typescript
const app =

await NestFactory.create(AppModule);

app.enableCors();

await app.listen(3000);
```

Output

```text
CORS Enabled
```

### Giải thích

Tất cả Origin sẽ được phép truy cập theo cấu hình mặc định.

---

## 📝 Example 2 - Allow Specific Origin

```typescript
app.enableCors({

    origin:

    "http://localhost:5173"

});
```

Frontend

```text
http://localhost:5173
```

↓

```text
Request Success
```

Frontend

```text
http://localhost:8080
```

↓

```text
Blocked by CORS
```

### Giải thích

Chỉ Origin được chỉ định mới được phép gửi Request.

---

## 📝 Example 3 - Credentials

```typescript
app.enableCors({

    origin:

    "http://localhost:5173",

    credentials: true

});
```

Response Header

```http
Access-Control-Allow-Credentials: true
```

### Giải thích

Cho phép trình duyệt gửi Cookie hoặc thông tin xác thực cùng Request.

---

## ⚠️ Notes

### 1. Same-Origin Policy

Trình duyệt chỉ cho phép JavaScript truy cập tài nguyên cùng Origin.

Điều này giúp hạn chế nhiều cuộc tấn công như Cross-Site Request Forgery (CSRF).

---

### 2. CORS chỉ áp dụng trên Browser

Ví dụ

```text
Chrome

Edge

Firefox
```

Các công cụ như:

- Postman
- Insomnia
- curl

không bị ảnh hưởng bởi CORS.

---

### 3. Không nên dùng origin: "*"

Sai

```typescript
origin: "*"
```

Điều này cho phép mọi website truy cập API.

Trong Production nên chỉ định Origin cụ thể.

---

### 4. credentials

Nếu sử dụng:

- Cookie
- Session
- Refresh Token trong Cookie

cần bật:

```typescript
credentials: true
```

---

### 5. Preflight Request

Một số Request sẽ được trình duyệt gửi trước bằng phương thức:

```http
OPTIONS
```

để kiểm tra xem Server có cho phép Request chính hay không.

NestJS sẽ xử lý tự động khi CORS được cấu hình đúng.

---

## 🌍 Real World Example

Frontend

```text
http://localhost:5173
```

Backend

```text
http://localhost:3000
```

Nếu Backend chưa bật CORS

↓

```text
Access to fetch has been blocked by CORS policy
```

Sau khi cấu hình

```typescript
app.enableCors({

    origin:

    "http://localhost:5173"

});
```

Frontend có thể gọi API thành công.

---

## ❌ Common Mistakes

### Sai 1 - Cho phép mọi Origin

Sai

```typescript
origin: "*"
```

Trong Production nên chỉ định rõ các Origin được phép.

---

### Sai 2 - Quên bật credentials

Nếu sử dụng Cookie nhưng không bật:

```typescript
credentials: true
```

Cookie sẽ không được gửi.

---

### Sai 3 - Nghĩ CORS bảo vệ API

CORS chỉ được trình duyệt thực thi.

Không thể thay thế Authentication hoặc Authorization.

---

### Sai 4 - Nhầm CORS với Firewall

Firewall kiểm soát kết nối mạng.

CORS chỉ kiểm soát Request từ trình duyệt.

---

## 📚 Summary

- CORS cho phép Server kiểm soát Origin được phép truy cập tài nguyên.
- Same-Origin Policy là cơ chế bảo mật mặc định của trình duyệt.
- NestJS hỗ trợ cấu hình CORS bằng `app.enableCors()`.
- Trong Production nên chỉ định Origin cụ thể thay vì `"*"`.
- CORS không thay thế Authentication hoặc Authorization.

---

## 📝 Quiz

### Question 1

CORS là viết tắt của?

A.

Cross-Origin Resource Sharing

B.

Cross-Origin Request Service

C.

Client-Origin Resource Security

D.

Cross Object Request System

**Answer: A**

**Giải thích:** Cross-Origin Resource Sharing. Đây là cơ chế của **trình duyệt**, không phải của server: `curl` hay Postman gọi API vẫn thành công dù CORS chặn. Nói cách khác, CORS bảo vệ người dùng khỏi trang web độc hại, chứ không bảo vệ API khỏi kẻ tấn công.


---

### Question 2

Phương thức nào dùng để bật CORS trong NestJS?

A.

```typescript
app.enableCors()
```

B.

```typescript
app.useCors()
```

C.

```typescript
app.cors()
```

D.

```typescript
app.enableOrigin()
```

**Answer: A**

**Giải thích:** `app.enableCors(options)` gọi trong `main.ts`. Hai lưu ý khi frontend gửi cookie: phải đặt `credentials: true`, và `origin` phải là một origin **cụ thể** — trình duyệt từ chối cặp `credentials` với `Access-Control-Allow-Origin: *`.

