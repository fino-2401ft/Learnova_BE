---
id: auth-m3-l6
course: Authentication & Security
module: Security Best Practices
title: Security Checklist
order: 6
difficulty: Intermediate
estimatedTime: 35
---
# Security Checklist

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Kiểm tra mức độ bảo mật của ứng dụng trước khi triển khai.
- Hiểu các hạng mục cần kiểm tra trong Authentication và Authorization.
- Biết những lỗi bảo mật phổ biến cần tránh.
- Áp dụng Security Checklist vào dự án NestJS thực tế.

---

## 📖 Definition

Việc ứng dụng hoạt động đúng chức năng **không đồng nghĩa với việc ứng dụng an toàn**.

Trước khi triển khai lên môi trường Production, cần kiểm tra lại toàn bộ các thành phần liên quan đến bảo mật.

Security Checklist là danh sách các hạng mục cần kiểm tra nhằm giảm thiểu rủi ro và đảm bảo hệ thống đáp ứng các yêu cầu bảo mật cơ bản.

---

## ⚙️ Syntax

Danh sách kiểm tra chỉ có giá trị khi nó được **chạy tự động**. Phần lớn các hạng mục
dưới đây kiểm tra được bằng một script chạy trong CI.

### Example 1 - Script kiểm tra trước khi triển khai

```bash
#!/usr/bin/env bash
# scripts/preflight.sh — chạy trong CI, chặn deploy nếu có hạng mục nào hỏng.
set -euo pipefail

fail() { echo "THIẾU: $1" >&2; exit 1; }

# 1. Không có secret nào bị commit vào mã nguồn.
if git grep -qnE "(JWT_SECRET|PASSWORD|API_KEY)=.{8,}" -- ':!*.example' ':!*.md'; then
  fail "secret nằm trong mã nguồn"
fi

# 2. Mọi biến môi trường bắt buộc đều có mặt.
for v in NODE_ENV DATABASE_URL JWT_ACCESS_SECRET CORS_ORIGIN; do
  [ -n "${!v:-}" ] || fail "biến môi trường $v"
done

# 3. Khoá ký đủ dài cho HMAC-SHA256.
[ "${#JWT_ACCESS_SECRET}" -ge 32 ] || fail "JWT_ACCESS_SECRET ngắn hơn 32 ký tự"

# 4. Không còn phụ thuộc nào có lỗ hổng nghiêm trọng.
npm audit --audit-level=high

echo "Tất cả hạng mục đều đạt."
```

Điểm mấu chốt là dòng `set -e` và `exit 1`: script phải **làm hỏng bản build** khi
có hạng mục không đạt. Một checklist chỉ in cảnh báo rồi vẫn cho deploy thì chẳng
khác gì không có.

### Example 2 - Kiểm tra header bảo mật của bản đã triển khai

```bash
curl -sI https://api.learnova.dev/api/v1/health | grep -iE   'strict-transport-security|x-content-type-options|content-security-policy'
```

Thiếu header nào nghĩa là `helmet` chưa được gắn, hoặc bị một proxy phía trước gỡ mất.

---

## 📌 Notes

Dưới đây là toàn bộ hạng mục cần rà trước khi đưa lên Production.

# 📋 Authentication Checklist

## Password

✔ Password được Hash bằng bcrypt hoặc Argon2.

✔ Không lưu Plain Text Password.

✔ Password có độ dài tối thiểu.

✔ Password được xác minh bằng hàm compare.

---

## JWT

✔ JWT Secret được lưu trong Environment Variables.

✔ Có thời gian hết hạn.

✔ Không lưu thông tin nhạy cảm trong Payload.

✔ Access Token và Refresh Token được tách riêng.

---

## Refresh Token

✔ Có thời gian hết hạn.

✔ Được lưu an toàn.

✔ Bị thu hồi khi Logout.

✔ Có thể Rotation Refresh Token.

---

# 📋 Authorization Checklist

## RBAC

✔ Người dùng được gán Role.

✔ API được kiểm tra Role.

✔ Không cấp quyền mặc định quá rộng.

---

## Permission

✔ Permission được định nghĩa rõ ràng.

✔ API quan trọng đều kiểm tra Permission.

✔ Không Hard-code Permission.

---

## Guard

✔ JwtAuthGuard hoạt động.

✔ RolesGuard hoạt động.

✔ PermissionGuard hoạt động.

✔ Route nhạy cảm đều được bảo vệ.

---

# 📋 API Security Checklist

## Validation

✔ Sử dụng DTO.

✔ ValidationPipe được bật.

✔ whitelist = true

✔ Không chấp nhận dữ liệu ngoài DTO.

---

## Rate Limiting

✔ API Login có Rate Limiting.

✔ API Register có Rate Limiting.

✔ API Forgot Password có Rate Limiting.

---

## CORS

✔ Chỉ cho phép Origin cần thiết.

✔ Không sử dụng

```text
origin: "*"
```

trong Production.

---

## Helmet

✔ Helmet đã được cấu hình.

✔ CSP được cấu hình phù hợp.

✔ Security Headers đã được bật.

---

# 📋 Configuration Checklist

## Environment Variables

✔ JWT Secret trong file `.env`.

✔ Database URL trong `.env`.

✔ API Key trong `.env`.

✔ SMTP Password trong `.env`.

---

## Git

✔ File `.env` nằm trong `.gitignore`.

✔ Không commit Secret lên GitHub.

✔ Không Hard-code Password.

---

# 📋 Database Checklist

✔ Sử dụng ORM (Prisma, TypeORM).

✔ Không viết SQL bằng cách nối chuỗi.

✔ Kiểm tra dữ liệu đầu vào.

✔ Sử dụng Transaction khi cần.

✔ Không trả về Password trong API Response.

---

# 📋 Logging Checklist

✔ Ghi log lỗi.

✔ Ghi log đăng nhập.

✔ Ghi log hành động quan trọng.

✔ Không ghi Password vào Log.

✔ Không ghi JWT Secret vào Log.

---

# 📋 Deployment Checklist

Trước khi triển khai Production, hãy kiểm tra:

✔ HTTPS đã được bật.

✔ Environment Variables đầy đủ.

✔ JWT Secret đủ mạnh.

✔ CORS đúng cấu hình.

✔ Helmet hoạt động.

✔ Rate Limiting hoạt động.

✔ ValidationPipe hoạt động.

✔ Guard hoạt động.

✔ Không còn dữ liệu test.

✔ Không còn tài khoản mặc định.

✔ Backup Database.

✔ Monitoring hoạt động.

---

## 🌍 Real World Example

Một dự án NestJS trước khi triển khai.

```text
Authentication

✔ Password Hashing

✔ JWT

✔ Refresh Token
```

↓

```text
Authorization

✔ RBAC

✔ Permission

✔ Guard
```

↓

```text
Security

✔ Helmet

✔ CORS

✔ Validation

✔ Rate Limiting
```

↓

```text
Deployment

✔ HTTPS

✔ Environment Variables

✔ Logging

✔ Monitoring
```

Sau khi hoàn thành toàn bộ Checklist, ứng dụng đã sẵn sàng để triển khai Production.

---

## ❌ Common Mistakes

### Sai 1 - Chỉ kiểm thử chức năng

Ứng dụng chạy đúng nhưng chưa được kiểm tra về bảo mật.

---

### Sai 2 - Hard-code Secret

Sai

```typescript
secret: "123456"
```

Nên sử dụng

```text
JWT_SECRET
```

trong Environment Variables.

---

### Sai 3 - Không bật HTTPS

Dữ liệu có thể bị nghe lén trong quá trình truyền.

---

### Sai 4 - Quên xóa dữ liệu thử nghiệm

Ví dụ

```text
admin/admin123
```

hoặc

```text
test@test.com
```

Những tài khoản này cần được xóa trước khi triển khai.

---

### Sai 5 - Không theo dõi hệ thống sau khi triển khai

Ứng dụng Production nên có:

- Logging
- Monitoring
- Error Tracking
- Backup

---

## 📚 Summary

- Security Checklist giúp kiểm tra toàn diện hệ thống trước khi triển khai.
- Authentication, Authorization và API Security đều cần được đánh giá.
- Không nên Hard-code thông tin nhạy cảm hoặc commit file `.env`.
- HTTPS, Logging và Monitoring là những thành phần quan trọng trong môi trường Production.
- Checklist giúp giảm thiểu rủi ro nhưng cần được cập nhật thường xuyên theo sự phát triển của ứng dụng.

---

## 📝 Quiz

### Question 1

Thông tin nào **không nên** lưu trực tiếp trong source code?

A.

JWT Secret

B.

Database Password

C.

API Key

D.

Tất cả các đáp án trên

**Answer: D**

**Giải thích:** Mọi bí mật đều phải ra khỏi mã nguồn. Lý do không chỉ là repo công khai: một khoá đã commit thì nằm mãi trong lịch sử Git, và xoá ở commit sau không hề gỡ nó đi. Lỡ commit rồi thì việc bắt buộc là **thu hồi khoá đó**, không phải xoá dòng code.


---

### Question 2

Mục đích chính của Security Checklist là gì?

A.

Tăng tốc độ ứng dụng.

B.

Kiểm tra các hạng mục bảo mật trước khi triển khai.

C.

Tạo thêm API.

D.

Thay thế Unit Test.

**Answer: B**

**Giải thích:** Checklist biến những việc dễ quên thành danh sách phải tick trước khi triển khai. Giá trị của nó nằm ở chỗ bảo mật hỏng do sót một bước nhỏ, chứ hiếm khi do thiếu kiến thức — và con người thì luôn quên khi đang vội.

