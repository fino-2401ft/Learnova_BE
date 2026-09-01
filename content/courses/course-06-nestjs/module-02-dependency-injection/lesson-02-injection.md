---
id: nest-m2-l2
course: NestJS
module: Dependency Injection
title: Injection
order: 2
difficulty: Intermediate
estimatedTime: 70
---
# Injection

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Dependency Injection (DI) là gì.
- Biết cách NestJS thực hiện Injection.
- Inject Service vào Controller.
- Inject Provider vào Provider khác.
- Hiểu Constructor Injection.
- Áp dụng Dependency Injection vào các ứng dụng NestJS.

---

## 📖 Definition

**Dependency Injection (DI)** là một kỹ thuật thiết kế phần mềm trong đó **đối tượng không tự tạo các dependency của mình**, mà sẽ được cung cấp từ bên ngoài.

NestJS sử dụng **IoC (Inversion of Control) Container** để quản lý và tự động Inject các Provider.

Thay vì:

```typescript
const userService = new UsersService();
```

NestJS sẽ tự tạo và cung cấp đối tượng cần thiết.

Điều này giúp:

- Giảm sự phụ thuộc giữa các class.
- Dễ kiểm thử (Testing).
- Dễ mở rộng.
- Dễ bảo trì.

---

# 💻 Dependency Injection Flow

```text
NestJS Container

↓

Create UsersService

↓

Inject UsersService

↓

UsersController
```

---

# 💻 Constructor Injection

```typescript
constructor(

    private readonly usersService: UsersService

) {}
```

Đây là cách phổ biến nhất để thực hiện Dependency Injection trong NestJS.

---

## 📝 Example 1 - Inject Service vào Controller

UsersService

```typescript
@Injectable()
export class UsersService {

    findAll() {

        return ["Alice", "Bob"];

    }

}
```

UsersController

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

NestJS tự động Inject `UsersService` vào `UsersController`.

---

## 📝 Example 2 - Inject Provider vào Provider

```typescript
@Injectable()
export class EmailService {

    sendEmail() {

        return "Email Sent";

    }

}
```

```typescript
@Injectable()
export class UsersService {

    constructor(

        private readonly emailService: EmailService

    ) {}

    register() {

        return this.emailService.sendEmail();

    }

}
```

### Giải thích

Provider cũng có thể phụ thuộc vào Provider khác.

---

## 📝 Example 3 - Multiple Injection

```typescript
constructor(

    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService

) {}
```

### Giải thích

Một class có thể Inject nhiều Provider cùng lúc.

---

## 📝 Example 4 - Inject Custom Provider

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

Inject Provider

```typescript
import { Inject } from '@nestjs/common';

constructor(

    @Inject('APP_NAME')

    private readonly appName: string

) {}
```

### Giải thích

Decorator `@Inject()` dùng để Inject các Custom Provider.

---

## 📝 Example 5 - Inject Repository

```typescript
@Injectable()
export class UsersService {

    constructor(

        private readonly prismaService: PrismaService

    ) {}

}
```

### Giải thích

Trong thực tế, Service thường Inject `PrismaService` để thao tác với Database.

---

## 📝 Example 6 - Dependency Chain

```text
UsersController

↓

UsersService

↓

PrismaService

↓

Database
```

### Giải thích

Dependency Injection có thể tạo thành chuỗi phụ thuộc giữa nhiều thành phần.

---

## ⚠️ Notes

### 1. Constructor Injection

Đây là cách Injection được khuyến nghị trong NestJS.

```typescript
constructor(

    private readonly usersService: UsersService

) {}
```

---

### 2. Không sử dụng new

Sai

```typescript
const service = new UsersService();
```

Đúng

Để NestJS tự tạo và Inject.

---

### 3. @Inject()

```typescript
@Inject('APP_NAME')
```

Được sử dụng khi Inject Custom Provider hoặc Injection Token.

---

### 4. Một Provider có thể được Inject nhiều nơi

Ví dụ:

```text
UsersService

↓

UsersController

↓

AuthService

↓

ProfileService
```

Tất cả đều dùng chung một instance (Singleton).

---

### 5. Dependency Chain

Một Provider có thể phụ thuộc vào Provider khác.

Ví dụ:

```text
AuthService

↓

JwtService

↓

ConfigService
```

---

### 6. Circular Dependency

Không nên để hai Provider phụ thuộc lẫn nhau.

Ví dụ:

```text
A

↓

B

↓

A
```

Điều này gây ra **Circular Dependency** và có thể làm ứng dụng không khởi động được.

---

## 🌍 Real World Example

Trong hệ thống xác thực người dùng:

```text
AuthController

↓

AuthService

↓

UsersService

↓

PrismaService

↓

Database
```

Khi người dùng gửi yêu cầu đăng nhập:

1. `AuthController` nhận Request.
2. `AuthController` gọi `AuthService`.
3. `AuthService` Inject `UsersService` để tìm người dùng.
4. `UsersService` Inject `PrismaService` để truy vấn Database.
5. Kết quả được trả về cho Client.

Nhờ Dependency Injection, mỗi thành phần chỉ tập trung vào một nhiệm vụ cụ thể.

---

## ❌ Common Mistakes

### Sai 1 - Tự tạo đối tượng bằng new

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

### Sai 2 - Quên đăng ký Provider

Nếu Provider chưa được khai báo trong `providers`, NestJS sẽ không thể Inject.

---

### Sai 3 - Circular Dependency

Sai

```text
UsersService

↓

AuthService

↓

UsersService
```

Điều này dẫn đến lỗi phụ thuộc vòng.

---

### Sai 4 - Không sử dụng @Inject() cho Custom Provider

Sai

```typescript
constructor(

    private readonly appName: string

) {}
```

Đúng

```typescript
constructor(

    @Inject('APP_NAME')

    private readonly appName: string

) {}
```

---

## 📚 Summary

- Dependency Injection là cơ chế cung cấp dependency từ bên ngoài thay vì tự khởi tạo.
- NestJS sử dụng IoC Container để quản lý và Inject Provider.
- Constructor Injection là cách phổ biến nhất để thực hiện DI.
- `@Inject()` dùng để Inject Custom Provider hoặc Injection Token.
- Không nên tạo Provider bằng từ khóa `new`.
- Tránh tạo Circular Dependency giữa các Provider.

---

## 📝 Quiz

### Question 1

Cách phổ biến nhất để thực hiện Dependency Injection trong NestJS là gì?

A.

Property Injection

B.

Constructor Injection

C.

Method Injection

D.

Static Injection

**Answer: B**

**Giải thích:** Constructor injection là cách được khuyến nghị vì phụ thuộc trở nên hiển nhiên ngay ở chữ ký constructor — đọc là biết class này cần gì. Nó cũng cho phép khai `private readonly`, và trong unit test chỉ việc truyền đối tượng giả vào.


---

### Question 2

Decorator nào được sử dụng để Inject một Custom Provider?

A.

```typescript
@Injectable()
```

B.

```typescript
@Inject()
```

C.

```typescript
@Controller()
```

D.

```typescript
@Module()
```

**Answer: B**

**Giải thích:** `@Inject(TOKEN)` dùng khi không thể suy ra kiểu từ constructor — điển hình là inject theo interface hoặc theo giá trị cấu hình, vì interface của TypeScript biến mất sau khi biên dịch. Với class thường thì Nest tự suy được nên không cần decorator này.

