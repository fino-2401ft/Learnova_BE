---
id: auth-m3-l3
course: Authentication & Security
module: Security Best Practices
title: Rate Limiting
order: 3
difficulty: Intermediate
estimatedTime: 40
---
# Rate Limiting

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Rate Limiting là gì.
- Biết tại sao cần giới hạn số lượng Request.
- Cấu hình Rate Limiting trong NestJS.
- Áp dụng Rate Limiting cho từng API.
- Hiểu các trường hợp sử dụng trong thực tế.

---

## 📖 Definition

**Rate Limiting** là kỹ thuật giới hạn số lượng Request mà một Client có thể gửi đến Server trong một khoảng thời gian nhất định.

Ví dụ:

```text
100 Request

↓

1 phút
```

Nếu Client gửi quá số lượng cho phép, Server sẽ từ chối các Request tiếp theo.

Rate Limiting giúp:

- Giảm Brute Force Attack.
- Hạn chế Spam Request.
- Giảm nguy cơ DDoS ở mức ứng dụng.
- Bảo vệ tài nguyên của Server.

Trong NestJS, Rate Limiting thường được triển khai bằng package:

```text
@nestjs/throttler
```

---

## 💻 Syntax

### Cài đặt

```bash
npm install @nestjs/throttler
```

---

### Đăng ký ThrottlerModule

```typescript
ThrottlerModule.forRoot({

    ttl: 60,

    limit: 10

})
```

---

### Global Guard

```typescript
providers: [

    {

        provide: APP_GUARD,

        useClass: ThrottlerGuard

    }

]
```

---

## 📝 Example 1 - Configure Rate Limiting

```typescript
ThrottlerModule.forRoot({

    ttl: 60,

    limit: 10

});
```

Output

```text
10 Requests

↓

60 Seconds
```

### Giải thích

Một Client chỉ được gửi tối đa **10 Request trong 60 giây**.

---

## 📝 Example 2 - Apply to Controller

```typescript
@Controller("users")

@UseGuards(

    ThrottlerGuard

)

export class UserController {}
```

Output

```text
Rate Limiting Enabled
```

### Giải thích

Mọi API trong Controller sẽ được giới hạn số lượng Request.

---

## 📝 Example 3 - Exceeded Limit

Client gửi:

```text
11 Requests

↓

60 Seconds
```

Response

```http
429 Too Many Requests
```

Response Body

```json
{

    "statusCode":429,

    "message":"Too Many Requests"

}
```

### Giải thích

Khi vượt quá giới hạn, Server trả về mã lỗi **429 Too Many Requests**.

---

## ⚠️ Notes

### 1. ttl

`ttl` là khoảng thời gian tính bằng giây.

Ví dụ

```typescript
ttl: 60
```

↓

```text
60 giây
```

---

### 2. limit

`limit` là số lượng Request tối đa.

Ví dụ

```typescript
limit: 100
```

↓

```text
100 Requests
```

---

### 3. HTTP Status 429

Nếu vượt quá giới hạn.

Server trả về

```http
429 Too Many Requests
```

Đây là mã trạng thái chuẩn của HTTP.

---

### 4. API cần Rate Limiting

Nên áp dụng cho:

- Login
- Register
- Forgot Password
- OTP
- Verify Email

Những API này thường là mục tiêu của Brute Force Attack.

---

### 5. Rate Limiting không thay thế Authentication

Rate Limiting chỉ giới hạn số lượng Request.

Vẫn cần:

- JWT
- RBAC
- Validation
- Helmet

để xây dựng hệ thống an toàn.

---

## 🌍 Real World Example

Một API đăng nhập.

```http
POST /login
```

Cấu hình

```text
5 Requests

↓

1 Minute
```

Nếu Hacker thử:

```text
123456

123457

123458

123459

123460

123461
```

Request thứ 6 sẽ bị từ chối.

Response

```http
429 Too Many Requests
```

Điều này giúp giảm nguy cơ Brute Force Attack.

---

## ❌ Common Mistakes

### Sai 1 - Không giới hạn API Login

API Login rất dễ bị tấn công bằng Brute Force.

Nên luôn áp dụng Rate Limiting.

---

### Sai 2 - Giới hạn quá thấp

Ví dụ

```text
1 Request

↓

1 Minute
```

Người dùng hợp lệ cũng khó sử dụng hệ thống.

---

### Sai 3 - Giới hạn quá cao

Ví dụ

```text
10000 Requests

↓

1 Minute
```

Hầu như không còn ý nghĩa bảo mật.

---

### Sai 4 - Nghĩ Rate Limiting chống được DDoS hoàn toàn

Rate Limiting chỉ giảm tải ở mức ứng dụng.

Để chống DDoS quy mô lớn cần kết hợp:

- Reverse Proxy
- CDN
- Firewall
- WAF

---

## 📚 Summary

- Rate Limiting giới hạn số lượng Request trong một khoảng thời gian.
- NestJS hỗ trợ thông qua `@nestjs/throttler`.
- Khi vượt giới hạn, Server trả về HTTP **429 Too Many Requests**.
- Nên áp dụng cho các API nhạy cảm như Login và Register.
- Rate Limiting là một lớp bảo vệ bổ sung, không thay thế Authentication hoặc Authorization.

---

## 📝 Quiz

### Question 1

Mã trạng thái HTTP nào được trả về khi vượt quá giới hạn Request?

A.

```text
401
```

B.

```text
403
```

C.

```text
404
```

D.

```text
429
```

**Answer: D**

**Giải thích:** `429 Too Many Requests`. Đừng dùng `403` cho trường hợp này — `403` nghĩa là không có quyền, còn `429` nói rõ "thử lại sau", và client thư viện biết cách xử lý khác nhau với hai mã đó.


---

### Question 2

Package nào thường được sử dụng để triển khai Rate Limiting trong NestJS?

A.

```text
@nestjs/passport
```

B.

```text
@nestjs/throttler
```

C.

```text
helmet
```

D.

```text
bcrypt
```

**Answer: B**

**Giải thích:** `@nestjs/throttler` cho phép đặt giới hạn toàn cục và ghi đè cho từng route bằng `@Throttle()`. Thực tế nên siết riêng endpoint đăng nhập chặt hơn nhiều so với mức chung — đó là chỗ đáng để dò mật khẩu nhất.

