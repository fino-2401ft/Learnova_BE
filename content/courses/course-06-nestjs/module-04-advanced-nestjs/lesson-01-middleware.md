---
id: nest-m4-l1
course: NestJS
module: Advanced NestJS
title: Middleware
order: 1
difficulty: Intermediate
estimatedTime: 75
---
# Middleware

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Middleware là gì trong NestJS.
- Tạo Middleware tùy chỉnh.
- Đăng ký Middleware trong Module.
- Áp dụng Middleware cho Route cụ thể.
- Hiểu vòng đời của Request trong NestJS.
- Phân biệt Middleware với Guard và Interceptor.

---

## 📖 Definition

**Middleware** là một hàm hoặc class được thực thi **trước khi Request đến Controller**.

Middleware thường được sử dụng để:

- Ghi log Request.
- Kiểm tra Header.
- Kiểm tra Token.
- Thêm dữ liệu vào Request.
- Xử lý CORS.
- Đo thời gian xử lý Request.

Luồng xử lý:

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

Middleware chỉ có quyền:

- Đọc Request.
- Chỉnh sửa Request.
- Kết thúc Request.
- Chuyển tiếp Request.

---

# 💻 Create Middleware

Sử dụng Nest CLI

```bash
nest generate middleware logger
```

hoặc

```bash
nest g mi logger
```

Nest CLI sẽ tạo

```text
logger.middleware.ts
```

---

# 💻 Basic Middleware

```typescript
import {

    Injectable,

    NestMiddleware

} from '@nestjs/common';

import {

    Request,

    Response,

    NextFunction

} from 'express';

@Injectable()
export class LoggerMiddleware

implements NestMiddleware {

    use(

        req: Request,

        res: Response,

        next: NextFunction

    ) {

        console.log(req.method, req.url);

        next();

    }

}
```

---

## 📝 Example 1 - Logging Request

```typescript
@Injectable()
export class LoggerMiddleware

implements NestMiddleware {

    use(

        req: Request,

        res: Response,

        next: NextFunction

    ) {

        console.log(

            `[${req.method}] ${req.originalUrl}`

        );

        next();

    }

}
```

### Giải thích

Middleware ghi lại Method và URL của Request trước khi chuyển sang bước tiếp theo.

---

## 📝 Example 2 - Register Middleware

```typescript
import {

    MiddlewareConsumer,

    Module,

    NestModule

} from '@nestjs/common';

@Module({})
export class AppModule

implements NestModule {

    configure(

        consumer: MiddlewareConsumer

    ) {

        consumer

            .apply(LoggerMiddleware)

            .forRoutes('*');

    }

}
```

### Giải thích

Middleware được áp dụng cho toàn bộ Route.

---

## 📝 Example 3 - Middleware cho một Controller

```typescript
consumer

    .apply(LoggerMiddleware)

    .forRoutes(UsersController);
```

### Giải thích

Chỉ các API thuộc `UsersController` mới chạy Middleware.

---

## 📝 Example 4 - Middleware cho Route cụ thể

```typescript
consumer

    .apply(LoggerMiddleware)

    .forRoutes('users');
```

### Giải thích

Middleware chỉ áp dụng cho Route `/users`.

---

## 📝 Example 5 - Thêm dữ liệu vào Request

```typescript
use(

    req: Request,

    res: Response,

    next: NextFunction

) {

    req['requestTime'] = new Date();

    next();

}
```

### Giải thích

Middleware có thể thêm thông tin vào Request để Controller hoặc Service sử dụng sau này.

---

## 📝 Example 6 - Kết thúc Request

```typescript
use(

    req: Request,

    res: Response,

    next: NextFunction

) {

    if (!req.headers.authorization) {

        return res.status(401).json({

            message: 'Unauthorized'

        });

    }

    next();

}
```

### Giải thích

Middleware có thể kết thúc Request mà không chuyển đến Controller nếu điều kiện không thỏa mãn.

---

## ⚠️ Notes

### 1. Luôn gọi `next()`

```typescript
next();
```

Nếu không gọi `next()`, Request sẽ không được chuyển tiếp và Client sẽ không nhận được phản hồi.

---

### 2. Middleware chạy trước Controller

Middleware luôn được thực thi trước khi Request đến Controller.

---

### 3. Có thể áp dụng cho nhiều Route

```typescript
consumer

    .apply(LoggerMiddleware)

    .forRoutes('*');
```

Hoặc cho từng Controller hoặc Route cụ thể.

---

### 4. Middleware không nên chứa Business Logic

Middleware chỉ nên xử lý các tác vụ chung như:

- Logging.
- Authentication sơ bộ.
- Kiểm tra Header.
- Thêm dữ liệu vào Request.

---

### 5. Function Middleware

Ngoài Class Middleware, NestJS còn hỗ trợ Function Middleware.

```typescript
export function logger(

    req,

    res,

    next

) {

    console.log(req.url);

    next();

}
```

---

### 6. Middleware và Express

NestJS Middleware hoạt động dựa trên Middleware của Express hoặc Fastify tùy Adapter được sử dụng.

---

## 🌍 Real World Example

Một API quản lý người dùng:

```text
Client

↓

LoggerMiddleware

↓

AuthGuard

↓

UsersController

↓

UsersService

↓

Database
```

Khi Client gửi:

```http
GET /users
```

`LoggerMiddleware` sẽ ghi log Request, sau đó chuyển tiếp cho `AuthGuard` để kiểm tra quyền truy cập trước khi đến Controller.

---

## ❌ Common Mistakes

### Sai 1 - Quên gọi `next()`

Sai

```typescript
use(req, res, next) {

    console.log(req.url);

}
```

Đúng

```typescript
use(req, res, next) {

    console.log(req.url);

    next();

}
```

---

### Sai 2 - Đặt Business Logic trong Middleware

Middleware không nên xử lý:

- CRUD.
- Truy vấn Database.
- Tính toán nghiệp vụ.

---

### Sai 3 - Đăng ký Middleware sai Module

Middleware chỉ hoạt động khi được đăng ký trong `configure()` của Module.

---

### Sai 4 - Dùng Middleware để phân quyền

Middleware chỉ phù hợp với kiểm tra cơ bản.

Các tác vụ phân quyền nên sử dụng **Guard**.

---

## 📚 Summary

- Middleware được thực thi trước Controller.
- Middleware có thể đọc, chỉnh sửa hoặc kết thúc Request.
- `NestMiddleware` là Interface dùng để tạo Middleware.
- Luôn gọi `next()` để chuyển Request sang bước tiếp theo.
- Middleware phù hợp cho Logging, Header, CORS và Authentication sơ bộ.
- Middleware được đăng ký thông qua `MiddlewareConsumer`.

---

## 📝 Quiz

### Question 1

Middleware được thực thi ở giai đoạn nào?

A.

Sau Controller.

B.

Sau Service.

C.

Trước Controller.

D.

Sau Response.

**Answer: C**

**Giải thích:** Middleware chạy sớm nhất trong chuỗi xử lý, trước cả guard. Vì vậy nó phù hợp cho những việc không cần biết route nào sẽ xử lý: ghi log, gắn request id, parse cookie. Còn kiểm tra quyền thì nên để guard, vì guard đọc được metadata của route.


---

### Question 2

Phương thức nào phải được gọi để chuyển Request sang bước tiếp theo?

A.

```typescript
continue();
```

B.

```typescript
forward();
```

C.

```typescript
next();
```

D.

```typescript
run();
```

**Answer: C**

**Giải thích:** `next()` chuyển quyền cho bước kế tiếp. Không gọi nó và cũng không gửi phản hồi thì request treo cho tới khi client timeout — và không có lỗi nào trong log, nên đây là loại lỗi rất khó truy vết.

