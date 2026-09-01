---
id: nest-m1-l2
course: NestJS
module: NestJS Fundamentals
title: Module
order: 2
difficulty: Beginner
estimatedTime: 65
---
# Module

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Module là gì trong NestJS.
- Biết vai trò của `@Module()`.
- Tạo Module bằng Nest CLI.
- Khai báo Controllers, Providers và Imports.
- Chia ứng dụng thành nhiều Module.
- Hiểu cách các Module giao tiếp với nhau.

---

## 📖 Definition

Trong NestJS, **Module** là đơn vị tổ chức cơ bản của ứng dụng.

Mỗi Module sẽ nhóm các thành phần liên quan như:

- Controller
- Service
- Provider

Việc chia ứng dụng thành nhiều Module giúp:

- Dễ bảo trì.
- Dễ mở rộng.
- Dễ tái sử dụng.
- Giảm sự phụ thuộc giữa các thành phần.

Thông thường, mỗi tính năng sẽ được đặt trong một Module riêng.

Ví dụ:

```text
User Module

Product Module

Auth Module

Order Module
```

---

# 💻 Create Module

Sử dụng Nest CLI:

```bash
nest generate module users
```

hoặc

```bash
nest g mo users
```

Nest CLI sẽ tạo:

```text
src/

└── users/

    └── users.module.ts
```

---

# 💻 Basic Module

```typescript
import { Module } from '@nestjs/common';

@Module({

})

export class UsersModule {}
```

---

# 💻 Module Metadata

```typescript
@Module({

    imports: [],

    controllers: [],

    providers: [],

    exports: []

})
```

| Property | Purpose |
|----------|----------|
| imports | Import Module khác |
| controllers | Danh sách Controller |
| providers | Danh sách Service/Provider |
| exports | Cho phép Module khác sử dụng Provider |

---

## 📝 Example 1 - Users Module

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({

    controllers: [UsersController],

    providers: [UsersService]

})

export class UsersModule {}
```

### Giải thích

UsersModule quản lý toàn bộ chức năng liên quan đến User.

---

## 📝 Example 2 - App Module

```typescript
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';

@Module({

    imports: [UsersModule]

})

export class AppModule {}
```

### Giải thích

AppModule import UsersModule để sử dụng.

---

## 📝 Example 3 - Export Provider

```typescript
@Module({

    providers: [UsersService],

    exports: [UsersService]

})

export class UsersModule {}
```

### Giải thích

`exports` cho phép Module khác sử dụng `UsersService`.

---

## 📝 Example 4 - Import Module

```typescript
@Module({

    imports: [UsersModule]

})

export class AuthModule {}
```

### Giải thích

AuthModule có thể sử dụng UsersService nếu UsersModule đã export Provider.

---

## 📝 Example 5 - Project Structure

```text
src/

├── app.module.ts

├── users/

│   ├── users.module.ts

│   ├── users.controller.ts

│   └── users.service.ts

├── auth/

│   ├── auth.module.ts

│   ├── auth.controller.ts

│   └── auth.service.ts

└── products/

    ├── products.module.ts

    ├── products.controller.ts

    └── products.service.ts
```

### Giải thích

Mỗi tính năng được tổ chức thành một Module riêng.

---

## ⚠️ Notes

### 1. Một Module đại diện cho một tính năng

Ví dụ:

```text
Users

Products

Orders

Payments
```

---

### 2. imports

```typescript
imports: []
```

Cho phép sử dụng Module khác.

---

### 3. controllers

```typescript
controllers: []
```

Đăng ký các Controller thuộc Module.

---

### 4. providers

```typescript
providers: []
```

Đăng ký Service và các Provider khác.

---

### 5. exports

```typescript
exports: []
```

Cho phép Module khác sử dụng Provider.

---

### 6. AppModule

```typescript
AppModule
```

Là Module gốc của ứng dụng.

Tất cả Module khác thường được import vào đây.

---

## 🌍 Real World Example

Một hệ thống thương mại điện tử.

```text
src/

├── auth/

├── users/

├── products/

├── orders/

├── payments/

├── categories/

├── reviews/

└── app.module.ts
```

Mỗi Module chịu trách nhiệm cho một chức năng riêng.

Ví dụ:

- UsersModule quản lý người dùng.
- ProductsModule quản lý sản phẩm.
- OrdersModule quản lý đơn hàng.
- PaymentsModule quản lý thanh toán.

Điều này giúp dự án dễ mở rộng khi số lượng tính năng tăng lên.

---

## ❌ Common Mistakes

### Sai 1 - Chỉ sử dụng AppModule

Sai

```text
AppModule

↓

Tất cả Controller

↓

Tất cả Service
```

Ứng dụng sẽ rất khó bảo trì.

---

### Sai 2 - Quên import Module

Sai

```typescript
imports: []
```

Trong khi cần sử dụng UsersModule.

---

### Sai 3 - Quên export Provider

Sai

```typescript
providers: [UsersService]
```

Nhưng không export.

Module khác sẽ không thể sử dụng UsersService.

---

### Sai 4 - Module quá lớn

Không nên đặt quá nhiều chức năng trong cùng một Module.

Nên chia theo từng nghiệp vụ.

---

## 📚 Summary

- Module là đơn vị tổ chức cơ bản của NestJS.
- Mỗi Module thường đại diện cho một tính năng.
- `@Module()` dùng để khai báo Module.
- `imports` dùng để nhập Module khác.
- `controllers` đăng ký Controller.
- `providers` đăng ký Service và Provider.
- `exports` cho phép chia sẻ Provider cho Module khác.
- `AppModule` là Module gốc của ứng dụng.

---

## 📝 Quiz

### Question 1

Decorator nào được sử dụng để khai báo Module trong NestJS?

A.

```typescript
@Controller()
```

B.

```typescript
@Service()
```

C.

```typescript
@Module()
```

D.

```typescript
@Injectable()
```

**Answer: C**

**Giải thích:** `@Module()` gom controller và provider thành một khối. Mỗi ứng dụng Nest có ít nhất một module gốc, và cây module chính là thứ Nest dùng để dựng container dependency injection.


---

### Question 2

Thuộc tính nào của `@Module()` dùng để chia sẻ Provider cho Module khác?

A.

```typescript
imports
```

B.

```typescript
controllers
```

C.

```typescript
providers
```

D.

```typescript
exports
```

**Answer: D**

**Giải thích:** `exports` công khai provider ra ngoài module. Đây là chỗ hay nhầm nhất trong bốn thuộc tính: `providers` **đăng ký** provider để dùng nội bộ, còn `exports` mới cho module khác inject được. Thiếu `exports`, module khác `imports` vào vẫn nhận lỗi "can't resolve dependency".

