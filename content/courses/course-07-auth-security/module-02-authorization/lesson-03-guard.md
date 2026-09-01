---
id: auth-m2-l3
course: Authentication & Security
module: Authorization
title: Guard
order: 3
difficulty: Intermediate
estimatedTime: 50
---
# Guard

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Guard là gì.
- Biết vai trò của Guard trong Authorization.
- Hiểu interface `CanActivate`.
- Tạo Custom Guard.
- Áp dụng Guard để kiểm tra Role và Permission.

---

## 📖 Definition

Sau khi người dùng đã được xác thực (Authentication), hệ thống cần quyết định người dùng **có được phép truy cập tài nguyên hay không**.

Trong NestJS, **Guard** là thành phần chịu trách nhiệm thực hiện việc này.

Guard sẽ được thực thi trước khi Controller hoặc Route Handler chạy.

Nếu Guard trả về:

```text
true
```

Request được phép tiếp tục.

Nếu Guard trả về:

```text
false
```

NestJS sẽ trả về:

```text
403 Forbidden
```

Guard thường được sử dụng để:

- Kiểm tra JWT.
- Kiểm tra Role.
- Kiểm tra Permission.
- Kiểm tra quyền truy cập API.

---

## 💻 Syntax

### Create Guard

```typescript
@Injectable()

export class RolesGuard

implements CanActivate {

    canActivate(

        context: ExecutionContext

    ): boolean {

        return true;

    }

}
```

---

### Apply Guard

```typescript
@UseGuards(

    JwtAuthGuard,

    RolesGuard

)
```

---

## 📝 Example 1 - Custom Guard

```typescript
@Injectable()

export class AuthGuard

implements CanActivate {

    canActivate(

        context: ExecutionContext

    ) {

        return true;

    }

}
```

Output

```text
Request Allowed
```

### Giải thích

Nếu `canActivate()` trả về `true`, Request sẽ được chuyển đến Controller.

---

## 📝 Example 2 - Check User Role

```typescript
canActivate(

    context: ExecutionContext

) {

    const request =

    context.switchToHttp().getRequest();

    return request.user.role === "ADMIN";

}
```

Request

```text
Role = ADMIN
```

Response

```text
200 OK
```

Request

```text
Role = STUDENT
```

Response

```text
403 Forbidden
```

### Giải thích

Guard kiểm tra Role của người dùng trước khi cho phép truy cập API.

---

## 📝 Example 3 - Apply Guard

```typescript
@UseGuards(

    JwtAuthGuard,

    RolesGuard

)

@Get("users")

findAll() {

    return [];

}
```

Response

```json
[]
```

### Giải thích

Trước khi `findAll()` được gọi:

- JwtAuthGuard xác thực người dùng.
- RolesGuard kiểm tra Role.

Nếu một trong hai thất bại, Controller sẽ không được thực thi.

---

## ⚠️ Notes

### 1. implements CanActivate

Muốn tạo Guard cần:

```typescript
implements CanActivate
```

---

### 2. canActivate()

Đây là phương thức bắt buộc.

```typescript
canActivate(

    context: ExecutionContext

)
```

Trả về:

```text
true

↓

Cho phép Request
```

```text
false

↓

403 Forbidden
```

---

### 3. ExecutionContext

ExecutionContext cho phép truy cập:

- Request
- Response
- User
- Headers
- Route

Ví dụ

```typescript
const request =

context.switchToHttp().getRequest();
```

---

### 4. Multiple Guards

Có thể sử dụng nhiều Guard.

```typescript
@UseGuards(

    JwtAuthGuard,

    RolesGuard,

    PermissionGuard

)
```

Các Guard sẽ được thực thi theo thứ tự khai báo.

---

### 5. Guard và Middleware

Middleware

- Chạy trước Guard.
- Không biết Route đang được gọi.

Guard

- Chạy sau Middleware.
- Biết Route và Metadata.
- Phù hợp cho Authentication và Authorization.

---

## 🌍 Real World Example

API

```http
DELETE /users/5
```

Luồng xử lý

```text
Request

↓

Middleware

↓

JwtAuthGuard

↓

RolesGuard

↓

Controller

↓

Delete User
```

Nếu người dùng không có Role ADMIN:

```text
403 Forbidden
```

Controller sẽ không được thực thi.

---

## ❌ Common Mistakes

### Sai 1 - Viết Business Logic trong Guard

Sai

```text
Create User

Delete User

Update Database
```

Guard chỉ nên kiểm tra quyền truy cập.

Business Logic nên đặt trong Service.

---

### Sai 2 - Không sử dụng ExecutionContext

Sai

```typescript
return true;
```

Không kiểm tra Request.

Nên lấy thông tin User từ Request để xác thực hoặc phân quyền.

---

### Sai 3 - Chỉ dùng JwtAuthGuard

Sai

```text
Đã đăng nhập

↓

Được truy cập tất cả API
```

Nên kết hợp:

```text
JwtAuthGuard

↓

RolesGuard

↓

PermissionGuard
```

---

### Sai 4 - Không sử dụng @UseGuards()

Nếu không đăng ký Guard, Guard sẽ không được thực thi.

---

## 📚 Summary

- Guard kiểm tra quyền truy cập trước khi Controller chạy.
- Muốn tạo Guard cần implements `CanActivate`.
- Phương thức quan trọng là `canActivate()`.
- Guard thường được dùng để kiểm tra JWT, Role và Permission.
- Có thể kết hợp nhiều Guard trong một Route.

---

## 📝 Quiz

### Question 1

Interface nào dùng để tạo Guard?

A.

```typescript
CanExecute
```

B.

```typescript
CanActivate
```

C.

```typescript
GuardInterface
```

D.

```typescript
RequestGuard
```

**Answer: B**

**Giải thích:** `CanActivate` yêu cầu cài đặt `canActivate(context)`. Tham số `context` là `ExecutionContext` — từ đó lấy được request, và quan trọng hơn là đọc được metadata gắn lên route bằng decorator như `@Roles()`.


---

### Question 2

Nếu `canActivate()` trả về `false`, điều gì sẽ xảy ra?

A.

Controller vẫn được thực thi.

B.

Server khởi động lại.

C.

Request bị từ chối.

D.

Database bị rollback.

**Answer: C**

**Giải thích:** Trả `false` thì Nest chặn request và tự ném `ForbiddenException` (403). Nếu muốn mã lỗi hoặc thông điệp khác, hãy tự ném exception trong thân `canActivate` thay vì trả `false` — ví dụ `401` cho trường hợp thiếu token.

