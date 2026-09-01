---
id: auth-m1-l3
course: Authentication & Security
module: Authentication
title: Refresh Token
order: 3
difficulty: Intermediate
estimatedTime: 45
---
# Refresh Token

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Refresh Token là gì.
- Phân biệt Access Token và Refresh Token.
- Hiểu quy trình Refresh Token hoạt động.
- Biết cách triển khai Refresh Token trong NestJS.
- Hiểu các lưu ý bảo mật khi sử dụng Refresh Token.

---

## 📖 Definition

Access Token thường có thời gian sống ngắn (ví dụ: 15 phút hoặc 1 giờ).

Khi Access Token hết hạn, người dùng sẽ không thể tiếp tục gửi Request.

Nếu yêu cầu người dùng đăng nhập lại mỗi lần Token hết hạn sẽ làm giảm trải nghiệm sử dụng.

Để giải quyết vấn đề này, hệ thống sử dụng **Refresh Token**.

Refresh Token là một Token có thời gian sống dài hơn, được dùng để tạo Access Token mới mà không cần người dùng đăng nhập lại.

Luồng hoạt động:

```text
Login

↓

Access Token (15 phút)

+

Refresh Token (7 ngày)

↓

Access Token hết hạn

↓

POST /refresh-token

↓

Access Token mới
```

---

## 💻 Syntax

### Generate Access Token

```typescript
const accessToken = this.jwtService.sign(

    payload,

    {

        expiresIn: "15m"

    }

);
```

---

### Generate Refresh Token

```typescript
const refreshToken = this.jwtService.sign(

    payload,

    {

        expiresIn: "7d"

    }

);
```

---

### Verify Refresh Token

```typescript
this.jwtService.verify(refreshToken);
```

---

## 📝 Example 1 - Generate Tokens

```typescript
const payload = {

    id: 1,

    username: "alice"

};

const accessToken = this.jwtService.sign(

    payload,

    {

        expiresIn: "15m"

    }

);

const refreshToken = this.jwtService.sign(

    payload,

    {

        expiresIn: "7d"

    }

);

console.log(accessToken);

console.log(refreshToken);
```

Output

```text
Access Token

eyJhbGc...

Refresh Token

eyJhbGc...
```

### Giải thích

Sau khi đăng nhập thành công, Server tạo đồng thời Access Token và Refresh Token.

---

## 📝 Example 2 - Refresh Access Token

```typescript
@Post("refresh")

refresh(

    @Body()

    body: RefreshTokenDto

) {

    const payload =

    this.jwtService.verify(

        body.refreshToken

    );

    return {

        accessToken:

        this.jwtService.sign(

            {

                id: payload.id

            },

            {

                expiresIn: "15m"

            }

        )

    };

}
```

Response

```json
{

    "accessToken":"eyJhbGc..."

}
```

### Giải thích

Refresh Token hợp lệ sẽ được dùng để tạo Access Token mới.

---

## 📝 Example 3 - Access Protected API

Request

```http
GET /users/profile

Authorization:

Bearer eyJhbGc...
```

Nếu Access Token hết hạn

```http
401 Unauthorized
```

Client sẽ gọi

```http
POST /refresh
```

Sau đó nhận Access Token mới và tiếp tục gửi Request.

---

## ⚠️ Notes

### 1. Access Token

Đặc điểm:

- Thời gian sống ngắn.
- Gửi trong Authorization Header.
- Dùng để xác thực Request.

Ví dụ

```text
15 phút

30 phút

1 giờ
```

---

### 2. Refresh Token

Đặc điểm:

- Thời gian sống dài.
- Chỉ dùng để cấp Access Token mới.
- Không dùng để truy cập API.

Ví dụ

```text
7 ngày

30 ngày
```

---

### 3. Lưu Refresh Token

Có thể lưu:

- Database
- Redis
- HTTP Only Cookie

Không nên lưu dưới dạng Plain Text trong cơ sở dữ liệu.

---

### 4. Rotation Refresh Token

Sau mỗi lần Refresh thành công:

- Sinh Refresh Token mới.
- Hủy Refresh Token cũ.

Giúp giảm nguy cơ Token bị đánh cắp.

---

### 5. Logout

Khi người dùng đăng xuất:

- Xóa Refresh Token khỏi Database hoặc Redis.
- Client xóa Access Token và Refresh Token.

---

## 🌍 Real World Example

Quy trình xác thực

```text
Login

↓

Generate Access Token

↓

Generate Refresh Token

↓

Client lưu Token

↓

Request API

↓

Access Token hết hạn

↓

POST /refresh

↓

Verify Refresh Token

↓

Generate Access Token mới

↓

Tiếp tục sử dụng API
```

Đây là mô hình xác thực được sử dụng trong hầu hết các ứng dụng hiện đại.

---

## ❌ Common Mistakes

### Sai 1 - Chỉ sử dụng Access Token

Người dùng phải đăng nhập lại sau khi Token hết hạn.

Nên sử dụng Refresh Token để cải thiện trải nghiệm.

---

### Sai 2 - Refresh Token có thời gian sống quá dài

Sai

```text
365 ngày
```

Khuyến nghị

```text
7 - 30 ngày
```

---

### Sai 3 - Dùng Refresh Token để truy cập API

Sai

```http
Authorization:

Bearer RefreshToken
```

Refresh Token chỉ dùng để tạo Access Token mới.

---

### Sai 4 - Không thu hồi Refresh Token khi Logout

Nếu Refresh Token vẫn còn hiệu lực, người khác có thể tiếp tục tạo Access Token mới.

---

## 📚 Summary

- Refresh Token dùng để tạo Access Token mới.
- Access Token có thời gian sống ngắn.
- Refresh Token có thời gian sống dài hơn.
- Refresh Token không dùng để truy cập API.
- Khi đăng xuất nên thu hồi Refresh Token để tăng tính bảo mật.

---

## 📝 Quiz

### Question 1

Refresh Token dùng để làm gì?

A.

Đăng ký tài khoản

B.

Mã hóa mật khẩu

C.

Tạo Access Token mới

D.

Truy cập trực tiếp API

**Answer: C**

**Giải thích:** Refresh token chỉ dùng để đổi lấy access token mới, không dùng để gọi API nghiệp vụ. Chia hai loại token như vậy để access token sống ngắn (giảm thiệt hại khi lộ) mà người dùng vẫn không phải đăng nhập lại mỗi mười lăm phút.


---

### Question 2

Token nào thường được gửi trong Header `Authorization`?

A.

Refresh Token

B.

Access Token

C.

Password

D.

Session ID

**Answer: B**

**Giải thích:** Access token đi trong header vì nó được gửi kèm hầu như mọi request. Refresh token thì ngược lại — nên nằm trong cookie `httpOnly` để JavaScript không đọc được, và chỉ gửi tới đúng endpoint refresh. Để cả hai cùng một chỗ là mất hẳn lợi ích của việc tách đôi.

