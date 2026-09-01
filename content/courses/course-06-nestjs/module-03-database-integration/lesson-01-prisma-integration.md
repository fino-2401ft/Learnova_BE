---
id: nest-m3-l1
course: NestJS
module: Database Integration
title: Prisma Integration
order: 1
difficulty: Intermediate
estimatedTime: 80
---
# Prisma Integration

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu cách tích hợp Prisma vào NestJS.
- Cài đặt Prisma và Prisma Client.
- Khởi tạo Prisma trong dự án NestJS.
- Tạo `PrismaService`.
- Đăng ký `PrismaModule`.
- Sử dụng Prisma trong Service để truy cập Database.

---

## 📖 Definition

**Prisma** là một ORM (Object Relational Mapping) hiện đại dành cho Node.js và TypeScript.

Trong NestJS, Prisma thường được sử dụng để:

- Kết nối Database.
- Thực hiện CRUD.
- Quản lý Migration.
- Truy vấn dữ liệu an toàn với TypeScript.

Thông thường, Prisma sẽ được đóng gói thành một **PrismaService** để các Module khác có thể sử dụng thông qua Dependency Injection.

---

# 💻 Installation

Cài đặt Prisma

```bash
npm install prisma --save-dev

npm install @prisma/client
```

Khởi tạo Prisma

```bash
npx prisma init
```

Sau khi khởi tạo

```text
prisma/

├── schema.prisma

.env
```

---

# 💻 Configure Database

Ví dụ sử dụng MySQL

```env
DATABASE_URL="mysql://root:password@localhost:3306/nestdb"
```

---

# 💻 Prisma Schema

```prisma
generator client {

    provider = "prisma-client-js"

}

datasource db {

    provider = "mysql"

    url = env("DATABASE_URL")

}
```

---

## 📝 Example 1 - PrismaService

```typescript
import {

    Injectable,

    OnModuleInit

} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService

extends PrismaClient

implements OnModuleInit {

    async onModuleInit() {

        await this.$connect();

    }

}
```

### Giải thích

`PrismaService` kế thừa từ `PrismaClient` và tự động kết nối Database khi Module được khởi tạo.

---

## 📝 Example 2 - PrismaModule

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({

    providers: [

        PrismaService

    ],

    exports: [

        PrismaService

    ]

})

export class PrismaModule {}
```

### Giải thích

`PrismaModule` export `PrismaService` để các Module khác có thể sử dụng.

---

## 📝 Example 3 - Import PrismaModule

```typescript
@Module({

    imports: [

        PrismaModule

    ]

})

export class UsersModule {}
```

### Giải thích

`UsersModule` có thể Inject `PrismaService`.

---

## 📝 Example 4 - Inject PrismaService

```typescript
@Injectable()
export class UsersService {

    constructor(

        private readonly prisma: PrismaService

    ) {}

}
```

### Giải thích

NestJS sẽ tự động Inject `PrismaService`.

---

## 📝 Example 5 - Query Database

```typescript
@Injectable()
export class UsersService {

    constructor(

        private readonly prisma: PrismaService

    ) {}

    async findAll() {

        return this.prisma.user.findMany();

    }

}
```

### Giải thích

Sử dụng Prisma Client để truy vấn bảng `User`.

---

## 📝 Example 6 - Project Structure

```text
src/

├── prisma/

│   ├── prisma.module.ts

│   └── prisma.service.ts

├── users/

├── auth/

└── app.module.ts
```

### Giải thích

Trong các dự án NestJS, Prisma thường được đặt trong một Module riêng để dễ tái sử dụng.

---

## ⚠️ Notes

### 1. PrismaClient

```typescript
PrismaClient
```

Là lớp chính dùng để thao tác với Database.

---

### 2. PrismaService

`PrismaService` thường kế thừa `PrismaClient`.

Điều này giúp sử dụng trực tiếp các phương thức như:

```typescript
this.prisma.user.findMany()
```

---

### 3. $connect()

```typescript
await this.$connect();
```

Thiết lập kết nối tới Database.

---

### 4. exports

```typescript
exports: [

    PrismaService

]
```

Cho phép Module khác sử dụng `PrismaService`.

---

### 5. Dependency Injection

`PrismaService` là một Provider nên có thể Inject vào bất kỳ Service nào.

---

### 6. Một PrismaService duy nhất

Thông thường, toàn bộ ứng dụng chỉ cần **một** `PrismaService` dùng chung.

---

## 🌍 Real World Example

Trong một hệ thống quản lý người dùng:

```text
UsersController

↓

UsersService

↓

PrismaService

↓

MySQL
```

Khi Client gửi yêu cầu:

```http
GET /users
```

Quy trình xử lý:

1. `UsersController` nhận Request.
2. `UsersService` gọi `PrismaService`.
3. `PrismaService` truy vấn MySQL.
4. Dữ liệu được trả về cho Client.

---

## ❌ Common Mistakes

### Sai 1 - Tạo nhiều PrismaClient

Sai

```typescript
const prisma = new PrismaClient();
```

ở nhiều nơi trong dự án.

Đúng

Sử dụng một `PrismaService` duy nhất và Inject khi cần.

---

### Sai 2 - Quên export PrismaService

Nếu không export:

```typescript
exports: [

]
```

các Module khác sẽ không thể sử dụng `PrismaService`.

---

### Sai 3 - Không import PrismaModule

Sai

```typescript
imports: []
```

Đúng

```typescript
imports: [

    PrismaModule

]
```

---

### Sai 4 - Quên kết nối Database

Sai

```typescript
extends PrismaClient
```

nhưng không gọi:

```typescript
await this.$connect();
```

Điều này có thể khiến ứng dụng không thiết lập kết nối đúng cách.

---

## 📚 Summary

- Prisma là ORM phổ biến cho NestJS.
- `PrismaClient` cung cấp API để thao tác với Database.
- `PrismaService` thường kế thừa `PrismaClient`.
- `PrismaModule` quản lý và export `PrismaService`.
- Các Service khác có thể Inject `PrismaService` thông qua Dependency Injection.
- Nên chỉ sử dụng một `PrismaService` duy nhất trong toàn bộ ứng dụng.

---

## 📝 Quiz

### Question 1

Lớp nào được kế thừa để tạo `PrismaService`?

A.

```typescript
DatabaseClient
```

B.

```typescript
PrismaClient
```

C.

```typescript
MysqlClient
```

D.

```typescript
ORMClient
```

**Answer: B**

**Giải thích:** `PrismaService extends PrismaClient` để kế thừa toàn bộ API truy vấn, đồng thời gắn thêm `@Injectable()` và các hook vòng đời. Nhờ vậy Prisma trở thành một provider bình thường trong hệ thống DI của Nest.


---

### Question 2

Tại sao `PrismaService` thường được export trong `PrismaModule`?

A.

Để tăng tốc Migration.

B.

Để các Module khác có thể Inject và sử dụng.

C.

Để tự động tạo Database.

D.

Để thay thế Controller.

**Answer: B**

**Giải thích:** Không `exports` thì `PrismaService` chỉ dùng được bên trong `PrismaModule`. Cách làm phổ biến là đánh dấu `PrismaModule` bằng `@Global()` để mọi module dùng được mà không phải `imports` lặp đi lặp lại.

