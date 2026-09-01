---
id: nest-m2-l1
course: NestJS
module: Dependency Injection
title: Provider
order: 1
difficulty: Intermediate
estimatedTime: 70
---
# Provider

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Provider là gì trong NestJS.
- Biết vai trò của Provider trong Dependency Injection.
- Phân biệt Provider và Service.
- Đăng ký Provider trong Module.
- Sử dụng Custom Provider.
- Áp dụng Provider vào các ứng dụng thực tế.

---

## 📖 Definition

Trong NestJS, **Provider** là bất kỳ class nào có thể được **Dependency Injection (DI) Container** quản lý và cung cấp cho các thành phần khác.

Các loại Provider phổ biến gồm:

- Service
- Repository
- Factory
- Helper
- Logger
- Config Service

Trong thực tế, **Service chính là loại Provider được sử dụng nhiều nhất**.

Một Provider được khai báo bằng decorator:

```typescript
@Injectable()
```

và được đăng ký trong thuộc tính `providers` của `@Module()`.

---

# 💻 Provider Flow

```text
Controller

↓

Provider (Service)

↓

Database
```

NestJS sẽ tự động tạo và quản lý Provider khi ứng dụng khởi động.

---

# 💻 Register Provider

```typescript
@Module({

    providers: [

        UsersService

    ]

})

export class UsersModule {}
```

---

## 📝 Example 1 - Service là Provider

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {

    findAll() {

        return [];

    }

}
```

### Giải thích

`UsersService` là một Provider vì được đánh dấu bằng `@Injectable()`.

---

## 📝 Example 2 - Đăng ký Provider

```typescript
@Module({

    controllers: [

        UsersController

    ],

    providers: [

        UsersService

    ]

})

export class UsersModule {}
```

### Giải thích

Provider phải được đăng ký trong `providers` để NestJS quản lý.

---

## 📝 Example 3 - Sử dụng Provider

```typescript
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

NestJS tự động Inject `UsersService` vào Controller.

---

## 📝 Example 4 - Custom Provider

```typescript
@Module({

    providers: [

        {

            provide: 'APP_NAME',

            useValue: 'NestJS Course'

        }

    ]

})
export class AppModule {}
```

### Giải thích

`useValue` tạo một Provider từ giá trị cố định.

---

## 📝 Example 5 - Factory Provider

```typescript
@Module({

    providers: [

        {

            provide: 'API_URL',

            useFactory: () => {

                return 'https://api.example.com';

            }

        }

    ]

})
export class AppModule {}
```

### Giải thích

`useFactory` tạo Provider thông qua một hàm.

---

## 📝 Example 6 - Existing Provider

```typescript
@Module({

    providers: [

        UsersService,

        {

            provide: 'USER_SERVICE',

            useExisting: UsersService

        }

    ]

})
export class UsersModule {}
```

### Giải thích

`useExisting` tạo một tên khác (alias) cho Provider đã tồn tại.

---

## ⚠️ Notes

### 1. Provider không chỉ là Service

Provider có thể là:

- Service
- Config
- Logger
- Repository
- Factory

---

### 2. Injectable

```typescript
@Injectable()
```

Cho phép NestJS quản lý vòng đời của Provider.

---

### 3. providers

```typescript
@Module({

    providers: []

})
```

Là nơi đăng ký Provider của Module.

---

### 4. Một Provider chỉ được tạo một lần

Mặc định, Provider có **Singleton Scope**.

Toàn bộ ứng dụng sẽ dùng chung một instance.

---

### 5. Export Provider

```typescript
@Module({

    providers: [

        UsersService

    ],

    exports: [

        UsersService

    ]

})
```

Module khác có thể sử dụng Provider này thông qua `imports`.

---

## 🌍 Real World Example

Trong một hệ thống thương mại điện tử:

```text
AuthController

↓

AuthService

↓

JwtService

↓

PrismaService

↓

Database
```

Trong sơ đồ trên:

- `AuthService` là Provider.
- `JwtService` là Provider.
- `PrismaService` là Provider.

NestJS tự động quản lý và Inject các Provider khi cần sử dụng.

---

## ❌ Common Mistakes

### Sai 1 - Quên đăng ký Provider

Sai

```typescript
@Module({

    providers: []

})
```

Trong khi Controller sử dụng `UsersService`.

Đúng

```typescript
providers: [

    UsersService

]
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

### Sai 3 - Tự tạo Provider bằng new

Sai

```typescript
const service = new UsersService();
```

Đúng

Để NestJS tự Inject thông qua Dependency Injection.

---

### Sai 4 - Nhầm Provider và Module

Module dùng để tổ chức ứng dụng.

Provider dùng để cung cấp các chức năng hoặc dịch vụ cho ứng dụng.

---

## 📚 Summary

- Provider là thành phần được NestJS quản lý thông qua Dependency Injection.
- Service là loại Provider phổ biến nhất.
- `@Injectable()` đánh dấu một class là Provider.
- Provider được đăng ký trong `providers` của `@Module()`.
- NestJS mặc định tạo Provider theo mô hình Singleton.
- Có thể tạo Custom Provider bằng `useValue`, `useFactory` và `useExisting`.

---

## 📝 Quiz

### Question 1

Decorator nào đánh dấu một class là Provider?

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
@Inject()
```

**Answer: C**

**Giải thích:** `@Injectable()` đánh dấu class có thể được container quản lý. Không chỉ service — repository, guard, interceptor, pipe đều là provider và đều cần decorator này.


---

### Question 2

Thuộc tính nào của `@Module()` dùng để đăng ký Provider?

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

**Answer: C**

**Giải thích:** `providers` đăng ký provider vào container của module. Phân biệt với `exports`: `providers` là "tôi có cái này", `exports` là "tôi cho module khác dùng cái này". Module nào cần dùng thì phải `imports` module chứa nó.

