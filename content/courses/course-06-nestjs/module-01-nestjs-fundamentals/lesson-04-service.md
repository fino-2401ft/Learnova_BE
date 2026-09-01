---
id: nest-m1-l4
course: NestJS
module: NestJS Fundamentals
title: Service
order: 4
difficulty: Beginner
estimatedTime: 70
---
# Service

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Service là gì trong NestJS.
- Biết vai trò của `@Injectable()`.
- Tách Business Logic khỏi Controller.
- Tạo Service bằng Nest CLI.
- Sử dụng Dependency Injection để gọi Service.
- Áp dụng Service trong các ứng dụng RESTful API.

---

## 📖 Definition

**Service** là nơi chứa **Business Logic** của ứng dụng.

Controller chỉ có nhiệm vụ:

- Nhận Request.
- Gọi Service.
- Trả Response.

Service sẽ xử lý:

- Truy vấn Database.
- Tính toán dữ liệu.
- Kiểm tra nghiệp vụ.
- Gọi API bên ngoài.
- Xử lý dữ liệu.

Trong NestJS, Service được đánh dấu bằng decorator:

```typescript
@Injectable()
```

để hệ thống Dependency Injection có thể quản lý.

---

# 💻 Create Service

Sử dụng Nest CLI:

```bash
nest generate service users
```

hoặc

```bash
nest g s users
```

Nest CLI sẽ tạo:

```text
src/

└── users/

    └── users.service.ts
```

---

# 💻 Basic Service

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {

    findAll() {

        return [];

    }

}
```

---

## 📝 Example 1 - Hello Service

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

    getHello(): string {

        return "Hello NestJS";

    }

}
```

### Giải thích

Service chứa logic trả về chuỗi `"Hello NestJS"`.

---

## 📝 Example 2 - Controller sử dụng Service

```typescript
import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

    constructor(

        private readonly usersService: UsersService

    ) {}

    @Get()
    findAll() {

        return this.usersService.findAll();

    }

}
```

### Giải thích

NestJS sẽ tự động Inject `UsersService` thông qua Constructor.

---

## 📝 Example 3 - Trả về danh sách User

```typescript
@Injectable()
export class UsersService {

    findAll() {

        return [

            {

                id: 1,

                name: "Alice"

            },

            {

                id: 2,

                name: "Bob"

            }

        ];

    }

}
```

### Giải thích

Service chịu trách nhiệm lấy dữ liệu và trả về cho Controller.

---

## 📝 Example 4 - Tìm User theo ID

```typescript
@Injectable()
export class UsersService {

    findOne(id: number) {

        return {

            id,

            name: "Alice"

        };

    }

}
```

Controller

```typescript
@Get(':id')
findOne(

    @Param('id') id: string

) {

    return this.usersService.findOne(Number(id));

}
```

### Giải thích

Controller lấy `id` từ URL rồi chuyển cho Service xử lý.

---

## 📝 Example 5 - Business Logic

```typescript
@Injectable()
export class OrderService {

    calculateTotal(

        price: number,

        quantity: number

    ) {

        return price * quantity;

    }

}
```

### Giải thích

Các phép tính nghiệp vụ nên được đặt trong Service thay vì Controller.

---

## 📝 Example 6 - Async Service

```typescript
@Injectable()
export class UsersService {

    async findAll() {

        return [

            {

                id: 1,

                name: "Alice"

            }

        ];

    }

}
```

Controller

```typescript
@Get()
async findAll() {

    return await this.usersService.findAll();

}
```

### Giải thích

Khi làm việc với Database hoặc API bên ngoài, Service thường sử dụng `async/await`.

---

## ⚠️ Notes

### 1. @Injectable()

```typescript
@Injectable()
```

Đánh dấu một class là Provider để NestJS có thể quản lý và Inject.

---

### 2. Business Logic

Business Logic nên đặt trong Service.

Ví dụ:

- Tính toán.
- Kiểm tra dữ liệu.
- Truy vấn Database.
- Gửi Email.
- Gọi API.

---

### 3. Controller chỉ điều hướng

Controller nên:

- Nhận Request.
- Gọi Service.
- Trả Response.

Không nên xử lý nghiệp vụ.

---

### 4. Dependency Injection

NestJS sẽ tự động tạo đối tượng Service và Inject vào Controller.

```typescript
constructor(

    private readonly usersService: UsersService

) {}
```

---

### 5. Một Service có thể được nhiều Controller sử dụng

Ví dụ:

```text
UsersService

↓

AdminController

↓

ProfileController
```

Giúp tái sử dụng mã nguồn.

---

## 🌍 Real World Example

Trong hệ thống thương mại điện tử:

```text
UsersController

↓

UsersService

↓

PrismaService

↓

Database
```

Quy trình xử lý:

1. Người dùng gửi yêu cầu `GET /users`.
2. `UsersController` nhận Request.
3. `UsersController` gọi `UsersService.findAll()`.
4. `UsersService` truy vấn cơ sở dữ liệu thông qua Prisma.
5. Kết quả được trả về cho Client.

Kiến trúc này giúp Controller luôn gọn gàng và dễ bảo trì.

---

## ❌ Common Mistakes

### Sai 1 - Viết Business Logic trong Controller

Sai

```typescript
@Get()
findAll() {

    // Truy vấn Database trực tiếp

}
```

Đúng

```typescript
@Get()
findAll() {

    return this.usersService.findAll();

}
```

---

### Sai 2 - Quên @Injectable()

Sai

```typescript
export class UsersService {}
```

Đúng

```typescript
@Injectable()
export class UsersService {}
```

---

### Sai 3 - Không Inject Service

Sai

```typescript
const service = new UsersService();
```

Đúng

```typescript
constructor(

    private readonly usersService: UsersService

) {}
```

---

### Sai 4 - Một Service làm quá nhiều việc

Không nên để một Service xử lý toàn bộ hệ thống.

Ví dụ:

```text
AppService

↓

User

↓

Product

↓

Order

↓

Payment
```

Thay vào đó nên chia thành nhiều Service theo từng nghiệp vụ.

---

## 📚 Summary

- Service là nơi chứa Business Logic của ứng dụng.
- `@Injectable()` giúp NestJS quản lý Service thông qua Dependency Injection.
- Controller nên gọi Service thay vì xử lý trực tiếp.
- Service có thể được nhiều Controller hoặc Module sử dụng.
- Nest CLI hỗ trợ tạo Service nhanh bằng `nest g s`.
- Việc tách Service giúp mã nguồn dễ bảo trì, kiểm thử và mở rộng.

---

## 📝 Quiz

### Question 1

Decorator nào dùng để khai báo một Service trong NestJS?

A.

```typescript
@Controller()
```

B.

```typescript
@Module()
```

C.

```typescript
@Injectable()
```

D.

```typescript
@Provider()
```

**Answer: C**

**Giải thích:** `@Injectable()` cho phép Nest quản lý vòng đời của class và tiêm phụ thuộc vào constructor của nó. Không có decorator này, Nest không đọc được metadata về kiểu tham số và báo lỗi khi cố inject.


---

### Question 2

Nơi nào nên chứa Business Logic trong ứng dụng NestJS?

A.

Controller

B.

Service

C.

Module

D.

main.ts

**Answer: B**

**Giải thích:** Service là nơi chứa nghiệp vụ vì nó độc lập với HTTP. Cùng một service dùng được cho REST controller, cho WebSocket gateway, cho cron job — còn logic nằm trong controller thì chỉ dùng được qua đúng route đó.

