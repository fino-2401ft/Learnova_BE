---
id: auth-m1-l2
course: Authentication & Security
module: Authentication
title: JWT
order: 2
difficulty: Intermediate
estimatedTime: 50
---
# JWT (JSON Web Token)

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu JWT là gì.
- Biết cấu trúc của JWT.
- Tạo và xác minh JWT trong NestJS.
- Hiểu Access Token hoạt động như thế nào.
- Biết các lưu ý khi sử dụng JWT trong ứng dụng thực tế.

---

## 📖 Definition

JWT (JSON Web Token) là một chuẩn mở (RFC 7519) dùng để truyền thông tin giữa Client và Server một cách an toàn.

Sau khi người dùng đăng nhập thành công:

1. Server xác thực tài khoản.
2. Server tạo JWT.
3. JWT được gửi về Client.
4. Client lưu JWT.
5. Những Request tiếp theo sẽ gửi JWT để chứng minh đã đăng nhập.

Ví dụ

```text
Login

↓

JWT

↓

Client

↓

Authorization: Bearer Token

↓

Server
```

JWT giúp Server không cần lưu Session của người dùng.

---

## 💻 Syntax

### Cài đặt

```bash
npm install @nestjs/jwt
```

---

### Đăng ký JwtModule

```typescript
JwtModule.register({

    secret: "your-secret-key",

    signOptions: {

        expiresIn: "1h"

    }

});
```

---

### Tạo Token

```typescript
this.jwtService.sign(payload);
```

---

### Xác minh Token

```typescript
this.jwtService.verify(token);
```

---

## 📝 Example 1 - Generate JWT

```typescript
const payload = {

    id: 1,

    username: "alice"

};

const token = this.jwtService.sign(payload);

console.log(token);
```

Output

```text
eyJhbGciOiJIUzI1NiIsInR5cCI...
```

### Giải thích

JWT được tạo từ Payload và Secret Key.

Token này sẽ được gửi về Client sau khi đăng nhập.

---

## 📝 Example 2 - Verify JWT

```typescript
const payload = this.jwtService.verify(token);

console.log(payload);
```

Output

```text
{

    id: 1,

    username: "alice",

    iat: 1722650000,

    exp: 1722653600

}
```

### Giải thích

Nếu Token hợp lệ, NestJS sẽ trả về Payload đã giải mã.

Nếu Token hết hạn hoặc không hợp lệ sẽ phát sinh Exception.

---

## 📝 Example 3 - Protect API

```typescript
@UseGuards(

    JwtAuthGuard

)

@Get("profile")

getProfile() {

    return "Profile";

}
```

Request

```http
GET /profile

Authorization:

Bearer eyJhbGc...
```

Response

```text
Profile
```

Nếu không có Token

```text
401 Unauthorized
```

### Giải thích

JwtAuthGuard sẽ kiểm tra Token trước khi Controller được thực thi.

---

## ⚠️ Notes

### 1. JWT gồm 3 phần

```text
Header

↓

Payload

↓

Signature
```

Ví dụ

```text
xxxxx.yyyyy.zzzzz
```

---

### 2. Header

Chứa thông tin thuật toán mã hóa.

Ví dụ

```json
{

    "alg":"HS256",

    "typ":"JWT"

}
```

---

### 3. Payload

Chứa thông tin người dùng.

Ví dụ

```json
{

    "id":1,

    "username":"alice"

}
```

Không nên lưu:

- Password
- API Key
- Secret
- Thông tin nhạy cảm

---

### 4. Signature

Được tạo bằng Secret Key.

Server sử dụng Signature để kiểm tra Token có bị chỉnh sửa hay không.

---

### 5. Authorization Header

JWT thường được gửi bằng Header.

```http
Authorization:

Bearer <token>
```

Đây là chuẩn phổ biến của REST API.

---

## 🌍 Real World Example

Quy trình đăng nhập

```text
Client

↓

POST /login

↓

Verify Password

↓

Generate JWT

↓

Client lưu Token

↓

Authorization: Bearer Token

↓

JwtAuthGuard

↓

Controller
```

Đây là mô hình xác thực phổ biến trong các ứng dụng Node.js và NestJS.

---

## ❌ Common Mistakes

### Sai 1 - Lưu Password trong Payload

Sai

```json
{

    "password":"123456"

}
```

Payload có thể được giải mã.

Chỉ lưu thông tin cần thiết.

---

### Sai 2 - Secret Key quá đơn giản

Sai

```text
secret
```

Đúng

```text
my-super-secret-key
```

Hoặc lưu trong file `.env`.

---

### Sai 3 - Không đặt thời gian hết hạn

Sai

```typescript
sign(payload)
```

Nên

```typescript
sign(payload, {

    expiresIn: "1h"

})
```

---

### Sai 4 - Không Verify Token

Không nên chỉ tạo Token.

Mọi Request cần được kiểm tra bằng JwtAuthGuard hoặc `jwtService.verify()`.

---

## 📚 Summary

- JWT là chuẩn xác thực Stateless.
- JWT gồm Header, Payload và Signature.
- Sau khi đăng nhập thành công, Server tạo JWT và gửi về Client.
- Client gửi JWT trong Authorization Header.
- NestJS sử dụng `JwtModule` và `JwtService` để tạo và xác minh Token.

---

## 📝 Quiz

### Question 1

JWT gồm bao nhiêu phần?

A.

```text
2
```

B.

```text
3
```

C.

```text
4
```

D.

```text
5
```

**Answer: B**

**Giải thích:** Ba phần ngăn bằng dấu chấm: header, payload và signature. Điều quan trọng hơn con số: header và payload chỉ được **mã hoá Base64URL**, không phải mã hoá bí mật — ai cũng đọc được nội dung. Đừng bao giờ đặt dữ liệu nhạy cảm vào payload.


---

### Question 2

JWT thường được gửi trong Header nào?

A.

```text
Content-Type
```

B.

```text
Authorization
```

C.

```text
Accept
```

D.

```text
Origin
```

**Answer: B**

**Giải thích:** `Authorization: Bearer <token>`. Chữ `Bearer` nghĩa là "ai cầm token này thì được coi là chủ nhân" — nên token bị lộ là bị mạo danh ngay. Đó là lý do access token phải sống ngắn, thường 15 phút.

