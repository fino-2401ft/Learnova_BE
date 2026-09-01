---
id: auth-m1-l4
course: Authentication & Security
module: Authentication
title: Authentication Flow
order: 4
difficulty: Intermediate
estimatedTime: 50
---
# Authentication Flow

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu toàn bộ quy trình xác thực trong một ứng dụng.
- Biết luồng Register, Login và Logout.
- Hiểu cách Access Token và Refresh Token phối hợp với nhau.
- Hiểu vai trò của Password Hashing, JWT và Guard.
- Áp dụng quy trình xác thực trong dự án NestJS.

---

## 📖 Definition

Authentication Flow là toàn bộ quy trình xác minh danh tính của người dùng từ khi đăng ký tài khoản cho đến khi đăng xuất.

Một hệ thống xác thực hiện đại thường gồm các bước:

- Đăng ký tài khoản (Register)
- Đăng nhập (Login)
- Xác thực người dùng bằng Access Token
- Làm mới Access Token bằng Refresh Token
- Đăng xuất (Logout)

Đây là quy trình được sử dụng trong hầu hết các ứng dụng Web và Mobile hiện nay.

---

# 💻 Authentication Flow

```text
Register

↓

Hash Password

↓

Save User

↓

Login

↓

Verify Password

↓

Generate Access Token

↓

Generate Refresh Token

↓

Client lưu Token

↓

Request API

↓

JwtAuthGuard

↓

Controller

↓

Access Token hết hạn

↓

Refresh Token

↓

Generate Access Token mới

↓

Logout

↓

Xóa Refresh Token
```

---

## 📝 Example 1 - Register

```typescript
const hashedPassword = await bcrypt.hash(

    dto.password,

    10

);

await prisma.user.create({

    data: {

        username: dto.username,

        password: hashedPassword

    }

});
```

Output

```text
User created successfully.
```

### Giải thích

Khi người dùng đăng ký:

- Hash Password.
- Lưu Password đã Hash vào Database.

Không bao giờ lưu Plain Text Password.

---

## 📝 Example 2 - Login

```typescript
const user =

await prisma.user.findUnique({

    where: {

        username: dto.username

    }

});

const isMatch = await bcrypt.compare(

    dto.password,

    user.password

);

if (!isMatch) {

    throw new UnauthorizedException();

}

const accessToken =

this.jwtService.sign({

    id: user.id

});
```

Output

```json
{

    "accessToken":"eyJhbGc..."

}
```

### Giải thích

Quy trình Login:

- Tìm User.
- So sánh Password.
- Nếu đúng → tạo JWT.

---

## 📝 Example 3 - Refresh Token

```typescript
@Post("refresh")

refresh(

    @Body()

    dto: RefreshTokenDto

){

    const payload =

    this.jwtService.verify(

        dto.refreshToken

    );

    return {

        accessToken:

        this.jwtService.sign({

            id: payload.id

        })

    };

}
```

Output

```json
{

    "accessToken":"eyJhbGc..."

}
```

### Giải thích

Khi Access Token hết hạn:

- Client gửi Refresh Token.
- Server kiểm tra Refresh Token.
- Nếu hợp lệ sẽ tạo Access Token mới.

---

## ⚠️ Notes

### 1. Register

Các bước:

```text
Receive User

↓

Hash Password

↓

Save Database
```

---

### 2. Login

Các bước:

```text
Find User

↓

Compare Password

↓

Generate JWT
```

---

### 3. Protected API

Client gửi

```http
Authorization:

Bearer AccessToken
```

JwtAuthGuard sẽ xác minh Token trước khi Controller được thực thi.

---

### 4. Refresh Token

Không cần đăng nhập lại.

Refresh Token sẽ cấp Access Token mới.

---

### 5. Logout

Các bước:

```text
Delete Refresh Token

↓

Client xóa Token
```

Sau khi Logout, người dùng phải đăng nhập lại.

---

## 🌍 Real World Example

Một ứng dụng thương mại điện tử.

### Register

```text
Khách hàng tạo tài khoản.
```

↓

### Login

```text
Nhập Email và Password.
```

↓

### Server

```text
Hash Password

↓

Compare Password

↓

Generate JWT
```

↓

### Client

```text
Lưu Access Token
```

↓

### Request API

```http
Authorization:

Bearer eyJhbGc...
```

↓

### Access Token hết hạn

```text
POST /refresh
```

↓

### Server

```text
Verify Refresh Token

↓

Generate Access Token mới
```

↓

### Logout

```text
Delete Refresh Token
```

Đây là quy trình xác thực phổ biến trong các hệ thống hiện đại.

---

## ❌ Common Mistakes

### Sai 1 - Lưu Password dạng Plain Text

Sai

```text
123456
```

Đúng

```text
bcrypt.hash()
```

---

### Sai 2 - Không Verify Password

Sai

```text
Login

↓

Generate JWT
```

Đúng

```text
Login

↓

Compare Password

↓

Generate JWT
```

---

### Sai 3 - Không sử dụng Refresh Token

Người dùng phải đăng nhập lại sau khi Access Token hết hạn.

---

### Sai 4 - Không xóa Refresh Token khi Logout

Refresh Token vẫn có thể được sử dụng để tạo Access Token mới.

---

## 📚 Summary

- Authentication Flow gồm Register, Login, Authenticate, Refresh Token và Logout.
- Password phải được Hash trước khi lưu.
- Login sử dụng `bcrypt.compare()` để xác minh mật khẩu.
- Access Token dùng để xác thực Request.
- Refresh Token dùng để cấp Access Token mới.
- Logout cần thu hồi Refresh Token để tăng tính bảo mật.

---

## 📝 Quiz

### Question 1

Sau khi người dùng đăng nhập thành công, Server sẽ làm gì?

A.

Xóa User

B.

Hash Password lần nữa

C.

Tạo Access Token và Refresh Token

D.

Đóng kết nối

**Answer: C**

**Giải thích:** Server kiểm tra mật khẩu, rồi phát hai token: access token trả trong body, refresh token đặt vào cookie `httpOnly`. Lưu ý server **không** lưu access token ở đâu cả — JWT là stateless, chữ ký đã đủ để xác minh.


---

### Question 2

Khi Access Token hết hạn, Client nên làm gì?

A.

Đăng ký tài khoản mới

B.

Gọi API Refresh Token để lấy Access Token mới

C.

Tạo JWT trên Client

D.

Gửi lại Password trong mọi Request

**Answer: B**

**Giải thích:** Client gọi endpoint refresh, kèm refresh token, nhận access token mới. Cách làm gọn nhất là để interceptor của HTTP client tự bắt lỗi `401`, gọi refresh rồi chạy lại request cũ — người dùng không hề thấy gì. Chỉ cần bảo đảm nhiều request cùng lỗi `401` chỉ kích hoạt đúng **một** lần refresh.

