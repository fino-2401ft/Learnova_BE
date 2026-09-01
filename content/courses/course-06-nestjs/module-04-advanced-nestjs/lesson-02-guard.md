---
id: nest-m4-l2
course: NestJS
module: Advanced NestJS
title: Guard
order: 2
difficulty: Intermediate
estimatedTime: 80
---
# Guard

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Guard là gì trong NestJS.
- Biết khi nào nên sử dụng Guard.
- Tạo Guard tùy chỉnh.
- Áp dụng Guard cho Route và Controller.
- Sử dụng `ExecutionContext`.
- Phân biệt Guard với Middleware.

---

## 📖 Definition

**Guard** là thành phần chịu trách nhiệm **quyết định Request có được phép tiếp tục xử lý hay không**.

Nếu Guard trả về:

```typescript
true
```

Request sẽ tiếp tục.

Nếu Guard trả về:

```typescript
false
```

NestJS sẽ từ chối Request.

Guard thường được sử dụng để:

- Authentication
- Authorization
- Role-based Access Control (RBAC)
- JWT Authentication
- API Key Validation

---

# 💻 Request Lifecycle

```text
Client

↓

Middleware

↓

Guard

↓

Interceptor (Before)

↓

Controller

↓

Service

↓

Interceptor (After)

↓

Response
```

Guard luôn chạy **sau Middleware** và **trước Controller**.

---

# 💻 Create Guard

Sử dụng Nest CLI

```bash
nest generate guard auth
```

hoặc

```bash
nest g gu auth
```

---

# 💻 Basic Guard

```typescript
import {

    CanActivate,

    ExecutionContext,

    Injectable

} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {

    canActivate(

        context: ExecutionContext

    ): boolean {

        return true;

    }

}
```

---

## 📝 Example 1 - Cho phép mọi Request

```typescript
@Injectable()
export class AuthGuard implements CanActivate {

    canActivate(

        context: ExecutionContext

    ) {

        return true;

    }

}
```

### Giải thích

Mọi Request đều được phép truy cập.

---

## 📝 Example 2 - Kiểm tra Authorization Header

```typescript
@Injectable()
export class AuthGuard implements CanActivate {

    canActivate(

        context: ExecutionContext

    ) {

        const request = context

            .switchToHttp()

            .getRequest();

        return !!request.headers.authorization;

    }

}
```

### Giải thích

Guard chỉ cho phép Request có Header `Authorization`.

---

## 📝 Example 3 - Sử dụng Guard

```typescript
@Controller('users')

@UseGuards(AuthGuard)

export class UsersController {}
```

### Giải thích

Toàn bộ API trong `UsersController` sẽ sử dụng `AuthGuard`.

---

## 📝 Example 4 - Guard cho một API

```typescript
@Get()

@UseGuards(AuthGuard)

findAll() {

    return [];

}
```

### Giải thích

Chỉ API `GET /users` sử dụng Guard.

---

## 📝 Example 5 - ExecutionContext

```typescript
const request = context

    .switchToHttp()

    .getRequest();
```

### Giải thích

`ExecutionContext` cho phép truy cập:

- Request
- Response
- Handler
- Controller

---

## 📝 Example 6 - Từ chối Request

```typescript
canActivate() {

    return false;

}
```

Response

```http
403 Forbidden
```

### Giải thích

Nếu Guard trả về `false`, Request sẽ không đến Controller.

---

## ⚠️ Notes

### 1. Guard dùng để Authentication

Ví dụ:

- JWT
- OAuth
- API Key

---

### 2. Guard dùng để Authorization

Ví dụ:

- Admin
- Teacher
- Student

---

### 3. Guard trả về

```typescript
boolean

Promise<boolean>

Observable<boolean>
```

---

### 4. Có thể áp dụng ở nhiều mức

- Toàn bộ ứng dụng.
- Module.
- Controller.
- Route.

---

### 5. ExecutionContext

Là đối tượng giúp Guard truy cập thông tin Request hiện tại.

---

### 6. Guard không xử lý Business Logic

Guard chỉ quyết định:

"Có được phép truy cập hay không?"

---

## 🌍 Real World Example

API quản lý sản phẩm:

```text
GET /products

↓

Middleware

↓

JwtAuthGuard

↓

ProductsController

↓

ProductsService

↓

Database
```

Khi người dùng gửi Request:

- Nếu JWT hợp lệ → Guard trả về `true`.
- Nếu JWT không hợp lệ → Guard trả về `false` và Request bị từ chối.

---

## ❌ Common Mistakes

### Sai 1 - Dùng Middleware để phân quyền

Middleware chỉ phù hợp cho xử lý chung.

Authorization nên sử dụng Guard.

---

### Sai 2 - Quên @UseGuards()

Sai

```typescript
@Controller('users')
```

Đúng

```typescript
@UseGuards(AuthGuard)

@Controller('users')
```

---

### Sai 3 - Viết Business Logic trong Guard

Guard chỉ nên kiểm tra quyền truy cập.

Không nên xử lý CRUD hoặc truy vấn nghiệp vụ phức tạp.

---

### Sai 4 - Luôn trả về true

Sai

```typescript
return true;
```

Guard cần kiểm tra điều kiện thực tế trước khi cho phép truy cập.

---

## 📚 Summary

- Guard quyết định Request có được phép tiếp tục hay không.
- Guard thực thi sau Middleware và trước Controller.
- `CanActivate` là Interface để tạo Guard.
- `ExecutionContext` cung cấp thông tin về Request hiện tại.
- `@UseGuards()` dùng để áp dụng Guard.
- Guard thường được sử dụng cho Authentication và Authorization.

---

## 📝 Quiz

### Question 1

Guard được thực thi ở giai đoạn nào?

A.

Sau Controller.

B.

Trước Middleware.

C.

Sau Middleware và trước Controller.

D.

Sau Response.

**Answer: C**

**Giải thích:** Thứ tự đầy đủ: middleware → guard → interceptor → pipe → controller. Guard đứng sau middleware nhưng trước controller, và khác biệt then chốt là nó truy cập được `ExecutionContext` — nhờ đó đọc được metadata gắn bằng decorator như `@Roles()`.


---

### Question 2

Interface nào được sử dụng để tạo Guard?

A.

```typescript
NestGuard
```

B.

```typescript
CanActivate
```

C.

```typescript
Middleware
```

D.

```typescript
ExecutionContext
```

**Answer: B**

**Giải thích:** `CanActivate` yêu cầu cài đặt `canActivate()` trả về boolean, Promise hoặc Observable. Trả `false` thì Nest tự ném `ForbiddenException`; muốn mã lỗi khác thì tự ném exception trong thân hàm.

