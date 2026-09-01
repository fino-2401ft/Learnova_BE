---
id: auth-m3-l5
course: Authentication & Security
module: Security Best Practices
title: Input Validation
order: 5
difficulty: Intermediate
estimatedTime: 45
---
# Input Validation

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Input Validation là gì.
- Biết tại sao Validation là một lớp bảo mật quan trọng.
- Hiểu các rủi ro khi không kiểm tra dữ liệu đầu vào.
- Áp dụng Validation trong NestJS.
- Thực hiện các Best Practices khi xử lý dữ liệu từ người dùng.

---

## 📖 Definition

Mọi dữ liệu gửi từ Client đều **không đáng tin cậy**.

Người dùng có thể gửi:

- Sai kiểu dữ liệu.
- Thiếu dữ liệu.
- Dữ liệu quá dài.
- Dữ liệu độc hại.
- Script tấn công.

Nếu Server xử lý trực tiếp những dữ liệu này, ứng dụng có thể gặp nhiều lỗ hổng bảo mật.

**Input Validation** là quá trình kiểm tra dữ liệu đầu vào trước khi xử lý.

Validation giúp:

- Đảm bảo dữ liệu đúng định dạng.
- Ngăn dữ liệu không hợp lệ.
- Giảm nguy cơ khai thác lỗ hổng bảo mật.

---

## 💻 Syntax

### DTO

```typescript
export class CreateUserDto {

    @IsEmail()

    email: string;

    @Length(8, 20)

    password: string;

}
```

---

### ValidationPipe

```typescript
app.useGlobalPipes(

    new ValidationPipe()

);
```

---

### Whitelist

```typescript
new ValidationPipe({

    whitelist: true

})
```

---

## 📝 Example 1 - Validate Email

```typescript
export class LoginDto {

    @IsEmail()

    email: string;

}
```

Request

```json
{

    "email":"admin@gmail.com"

}
```

Response

```text
Validation Passed
```

Request

```json
{

    "email":"abc"

}
```

Response

```text
400 Bad Request
```

### Giải thích

Email phải đúng định dạng trước khi Controller xử lý Request.

---

## 📝 Example 2 - Validate Password

```typescript
export class RegisterDto {

    @Length(8,20)

    password: string;

}
```

Request

```json
{

    "password":"123456"

}
```

Response

```text
400 Bad Request
```

Request

```json
{

    "password":"12345678"

}
```

Response

```text
Validation Passed
```

### Giải thích

Validation giúp đảm bảo Password đáp ứng yêu cầu tối thiểu.

---

## 📝 Example 3 - Remove Unexpected Fields

```typescript
new ValidationPipe({

    whitelist: true

});
```

Request

```json
{

    "username":"alice",

    "password":"12345678",

    "isAdmin":true

}
```

Response

```json
{

    "username":"alice",

    "password":"12345678"

}
```

### Giải thích

`whitelist: true` sẽ tự động loại bỏ các thuộc tính không được định nghĩa trong DTO.

Điều này giúp giảm nguy cơ **Mass Assignment**.

---

## ⚠️ Notes

### 1. Không tin tưởng dữ liệu từ Client

Mọi Request đều có thể bị chỉnh sửa.

Ngay cả khi Frontend đã kiểm tra dữ liệu, Backend vẫn phải Validation.

---

### 2. Validation ≠ Authentication

Validation

```text
Kiểm tra dữ liệu hợp lệ
```

Authentication

```text
Xác thực người dùng
```

Hai cơ chế này phục vụ những mục đích hoàn toàn khác nhau.

---

### 3. Chống Mass Assignment

Ví dụ

Request

```json
{

    "username":"alice",

    "password":"123456",

    "role":"ADMIN"

}
```

Nếu không Validation, người dùng có thể tự thêm thuộc tính mà hệ thống không mong muốn.

Nên sử dụng

```typescript
whitelist: true
```

---

### 4. Giảm nguy cơ SQL Injection

Validation không thể ngăn hoàn toàn SQL Injection.

Tuy nhiên, việc kiểm tra dữ liệu đầu vào kết hợp với ORM như Prisma hoặc TypeORM sẽ giúp giảm đáng kể rủi ro.

---

### 5. Validation là lớp bảo vệ đầu tiên

Một hệ thống an toàn thường kết hợp:

- Validation
- Authentication
- Authorization
- Rate Limiting
- Logging

Validation chỉ là một phần trong chiến lược bảo mật tổng thể.

---

## 🌍 Real World Example

API đăng ký tài khoản.

Request

```json
{

    "email":"abc",

    "password":"123",

    "role":"ADMIN"

}
```

Validation

↓

```text
Email không hợp lệ

Password quá ngắn

Loại bỏ trường role
```

↓

Response

```http
400 Bad Request
```

Server sẽ từ chối Request trước khi dữ liệu được lưu vào Database.

---

## ❌ Common Mistakes

### Sai 1 - Chỉ Validation ở Frontend

Frontend có thể bị bỏ qua bằng:

- Postman
- curl
- Script

Backend luôn phải Validation lại.

---

### Sai 2 - Không sử dụng DTO

Sai

```typescript
create(

    @Body()

    body: any

)
```

Đúng

```typescript
create(

    @Body()

    dto: CreateUserDto

)
```

---

### Sai 3 - Không bật whitelist

Nếu không bật

```typescript
whitelist: true
```

Người dùng có thể gửi thêm những trường ngoài dự kiến.

---

### Sai 4 - Nghĩ Validation đủ để chống Hacker

Validation giúp giảm rủi ro nhưng không thay thế:

- JWT
- RBAC
- Helmet
- CORS
- Rate Limiting

---

## 📚 Summary

- Input Validation kiểm tra dữ liệu trước khi xử lý.
- Backend luôn phải Validation dù Frontend đã kiểm tra.
- DTO và ValidationPipe là cách phổ biến để Validation trong NestJS.
- `whitelist: true` giúp loại bỏ các trường không mong muốn.
- Validation là một lớp bảo vệ quan trọng trong hệ thống bảo mật.

---

## 📝 Quiz

### Question 1

Mục đích chính của Input Validation là gì?

A.

Tạo JWT

B.

Kiểm tra dữ liệu đầu vào

C.

Hash Password

D.

Kết nối Database

**Answer: B**

**Giải thích:** Kiểm tra dữ liệu đầu vào ngay ở biên của hệ thống. Kiểm tra ở frontend chỉ để người dùng đỡ khó chịu — bất kỳ ai cũng gọi thẳng API bằng `curl`, nên chỉ kiểm tra ở backend mới thật sự bảo đảm dữ liệu đúng.


---

### Question 2

Tùy chọn nào của ValidationPipe giúp loại bỏ các thuộc tính không được định nghĩa trong DTO?

A.

```typescript
transform: true
```

B.

```typescript
forbidUnknownValues: true
```

C.

```typescript
whitelist: true
```

D.

```typescript
validateCustomDecorators: true
```

**Answer: C**

**Giải thích:** `whitelist: true` loại bỏ mọi thuộc tính không khai trong DTO. Nên đi kèm `forbidNonWhitelisted: true` để **từ chối** request thay vì âm thầm bỏ trường thừa — một field lạ thường có nghĩa hai bên đang hiểu khác nhau về hợp đồng API, và giấu đi làm lỗi lộ ra muộn hơn nhiều.

