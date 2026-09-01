---
id: nest-m1-l1
course: NestJS
module: NestJS Fundamentals
title: Project Structure
order: 1
difficulty: Beginner
estimatedTime: 60
---
# Project Structure

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu cấu trúc của một dự án NestJS.
- Biết vai trò của từng thư mục và tệp tin.
- Phân biệt `src`, `main.ts`, `app.module.ts` và các thành phần khác.
- Hiểu luồng khởi động của ứng dụng NestJS.
- Áp dụng cấu trúc chuẩn khi xây dựng dự án.

---

## 📖 Definition

NestJS là một framework Node.js được xây dựng trên Express (hoặc Fastify) và sử dụng TypeScript làm ngôn ngữ chính.

Một dự án NestJS được tổ chức theo kiến trúc **Module-based**, giúp mã nguồn rõ ràng, dễ bảo trì và mở rộng.

Sau khi tạo dự án bằng Nest CLI:

```bash
nest new my-app
```

ta sẽ có cấu trúc thư mục chuẩn.

---

# 💻 Default Project Structure

```text
my-app/

├── src/
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts
│
├── test/
│
├── node_modules/
│
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

---

# 💻 Folder Overview

| File/Folder | Purpose |
|-------------|----------|
| src | Chứa mã nguồn |
| main.ts | Điểm khởi động ứng dụng |
| app.module.ts | Module gốc |
| app.controller.ts | Định nghĩa API |
| app.service.ts | Chứa business logic |
| test | Unit Test và E2E Test |
| package.json | Quản lý package |
| tsconfig.json | Cấu hình TypeScript |
| nest-cli.json | Cấu hình Nest CLI |

---

## 📝 Example 1 - main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  await app.listen(3000);

}

bootstrap();
```

### Giải thích

`main.ts` là điểm bắt đầu của ứng dụng.

NestFactory sẽ tạo ứng dụng từ `AppModule`.

---

## 📝 Example 2 - app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({

  imports: [],

  controllers: [AppController],

  providers: [AppService],

})

export class AppModule {}
```

### Giải thích

Đây là Module gốc của ứng dụng.

Mọi Module khác đều được import vào đây.

---

## 📝 Example 3 - app.controller.ts

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {

    return this.appService.getHello();

  }

}
```

### Giải thích

Controller tiếp nhận HTTP Request và gọi Service để xử lý.

---

## 📝 Example 4 - app.service.ts

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  getHello(): string {

    return 'Hello World!';

  }

}
```

### Giải thích

Service chứa business logic của ứng dụng.

---

## 📝 Example 5 - package.json

```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "build": "nest build"
  }
}
```

### Giải thích

Các script thường dùng để chạy và build ứng dụng.

---

## ⚠️ Notes

### 1. src/

Chứa toàn bộ source code của ứng dụng.

---

### 2. main.ts

Là Entry Point của NestJS.

Ứng dụng luôn bắt đầu từ file này.

---

### 3. Module

Module là đơn vị tổ chức chính trong NestJS.

Mỗi tính năng thường có một Module riêng.

---

### 4. Controller

Controller xử lý HTTP Request.

Ví dụ:

- GET
- POST
- PUT
- DELETE

---

### 5. Service

Service chứa business logic.

Controller nên gọi Service thay vì xử lý trực tiếp.

---

### 6. test/

Chứa:

- Unit Test
- End-to-End Test

---

### 7. package.json

Quản lý:

- Dependencies
- Scripts
- Phiên bản dự án

---

## 🌍 Real World Example

Một dự án quản lý sinh viên có thể tổ chức như sau:

```text
src/

├── modules/
│   ├── users/
│   ├── courses/
│   ├── auth/
│   └── students/
│
├── common/
│
├── prisma/
│
├── app.module.ts
└── main.ts
```

Mỗi tính năng được tách thành một Module riêng, giúp dự án dễ mở rộng khi quy mô lớn.

---

## ❌ Common Mistakes

### Sai 1 - Đưa toàn bộ code vào AppModule

Nên tách thành nhiều Module theo từng chức năng.

---

### Sai 2 - Viết business logic trong Controller

Sai

```typescript
@Get()
getUsers() {

  // xử lý logic tại đây

}
```

Đúng

```typescript
@Get()
getUsers() {

  return this.userService.findAll();

}
```

---

### Sai 3 - Không phân chia thư mục

Không nên đặt tất cả Controller và Service trong thư mục `src`.

Hãy tổ chức theo từng Module.

---

### Sai 4 - Chỉnh sửa file trong node_modules

Không bao giờ sửa trực tiếp các package trong `node_modules`.

---

## 📚 Summary

- Dự án NestJS được tổ chức theo kiến trúc Module.
- `main.ts` là điểm khởi động ứng dụng.
- `app.module.ts` là Module gốc.
- Controller xử lý Request.
- Service chứa business logic.
- Thư mục `src` chứa toàn bộ mã nguồn.
- Cấu trúc chuẩn giúp ứng dụng dễ bảo trì và mở rộng.

---

## 📝 Quiz

### Question 1

File nào là điểm khởi động của ứng dụng NestJS?

A.

```text
app.module.ts
```

B.

```text
main.ts
```

C.

```text
package.json
```

D.

```text
app.service.ts
```

**Answer: B**

**Giải thích:** `main.ts` chứa hàm `bootstrap()` gọi `NestFactory.create()` rồi `app.listen()`. Đây cũng là nơi đặt mọi cấu hình cấp ứng dụng: middleware toàn cục, `ValidationPipe`, CORS, exception filter. `app.module.ts` chỉ khai báo cây module, nó không tự khởi động gì cả.


---

### Question 2

Thành phần nào nên chứa business logic?

A.

```text
Controller
```

B.

```text
Module
```

C.

```text
Service
```

D.

```text
main.ts
```

**Answer: C**

**Giải thích:** Controller chỉ nên làm ba việc: đọc dữ liệu từ request, gọi service, dựng response. Nhét nghiệp vụ vào controller khiến logic đó không tái sử dụng được ở nơi khác và không viết unit test được nếu không giả lập cả tầng HTTP.

