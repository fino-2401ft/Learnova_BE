---
id: nest-m1-l3
course: NestJS
module: NestJS Fundamentals
title: Controller
order: 3
difficulty: Beginner
estimatedTime: 70
---
# Controller

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Controller là gì trong NestJS.
- Sử dụng decorator `@Controller()`.
- Xây dựng các API với `@Get()`, `@Post()`, `@Put()`, `@Delete()`.
- Nhận dữ liệu từ URL và Request.
- Trả về dữ liệu cho Client.
- Áp dụng Controller trong các ứng dụng RESTful API.

---

## 📖 Definition

**Controller** là thành phần chịu trách nhiệm **nhận HTTP Request** từ Client và **trả về HTTP Response**.

Controller đóng vai trò là cầu nối giữa Client và Service.

Luồng xử lý:

```text
Client

↓

Controller

↓

Service

↓

Database
```

Trong NestJS, Controller được khai báo bằng decorator:

```typescript
@Controller()
```

---

# 💻 Create Controller

Sử dụng Nest CLI:

```bash
nest generate controller users
```

hoặc

```bash
nest g co users
```

Nest CLI sẽ tạo:

```text
src/

└── users/

    └── users.controller.ts
```

---

# 💻 Basic Controller

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {

    @Get()
    findAll() {

        return "All Users";

    }

}
```

---

## 📝 Example 1 - GET Request

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {

    @Get()
    findAll() {

        return ["Alice", "Bob"];

    }

}
```

Request

```http
GET /users
```

Response

```json
[
    "Alice",
    "Bob"
]
```

### Giải thích

`@Get()` xử lý các HTTP GET Request.

---

## 📝 Example 2 - POST Request

```typescript
import { Controller, Post } from '@nestjs/common';

@Controller('users')
export class UsersController {

    @Post()
    create() {

        return "User Created";

    }

}
```

Request

```http
POST /users
```

### Giải thích

`@Post()` xử lý yêu cầu tạo dữ liệu mới.

---

## 📝 Example 3 - Route Parameters

```typescript
import { Controller, Get, Param } from '@nestjs/common';

@Controller('users')
export class UsersController {

    @Get(':id')
    findOne(

        @Param('id') id: string

    ) {

        return id;

    }

}
```

Request

```http
GET /users/5
```

Response

```text
5
```

### Giải thích

`@Param()` lấy dữ liệu từ URL.

---

## 📝 Example 4 - Query Parameters

```typescript
import { Controller, Get, Query } from '@nestjs/common';

@Controller('users')
export class UsersController {

    @Get()
    search(

        @Query('name') name: string

    ) {

        return name;

    }

}
```

Request

```http
GET /users?name=Alice
```

Response

```text
Alice
```

### Giải thích

`@Query()` lấy dữ liệu từ Query String.

---

## 📝 Example 5 - Request Body

```typescript
import { Controller, Post, Body } from '@nestjs/common';

@Controller('users')
export class UsersController {

    @Post()
    create(

        @Body() body: any

    ) {

        return body;

    }

}
```

Request

```json
POST /users

{
    "name": "Alice"
}
```

Response

```json
{
    "name": "Alice"
}
```

### Giải thích

`@Body()` lấy dữ liệu gửi lên trong HTTP Body.

---

## 📝 Example 6 - HTTP Status Code

```typescript
import { Controller, Post, HttpCode } from '@nestjs/common';

@Controller('users')
export class UsersController {

    @Post()
    @HttpCode(201)
    create() {

        return "Created";

    }

}
```

### Giải thích

`@HttpCode()` thay đổi mã trạng thái HTTP trả về.

---

## ⚠️ Notes

### 1. @Controller()

```typescript
@Controller('users')
```

Định nghĩa tiền tố (prefix) cho tất cả Route trong Controller.

Ví dụ:

```text
/users
```

---

### 2. @Get()

```typescript
@Get()
```

Xử lý HTTP GET.

---

### 3. @Post()

```typescript
@Post()
```

Xử lý HTTP POST.

---

### 4. @Put()

```typescript
@Put(':id')
```

Cập nhật dữ liệu.

---

### 5. @Delete()

```typescript
@Delete(':id')
```

Xóa dữ liệu.

---

### 6. Decorator thường dùng

| Decorator | Chức năng |
|-----------|-----------|
| `@Param()` | Lấy Route Parameter |
| `@Query()` | Lấy Query Parameter |
| `@Body()` | Lấy dữ liệu Body |
| `@Headers()` | Lấy Header |
| `@Req()` | Truy cập Request |
| `@Res()` | Truy cập Response |

---

## 🌍 Real World Example

API quản lý người dùng:

```text
GET     /users

GET     /users/1

POST    /users

PUT     /users/1

DELETE  /users/1
```

Controller:

```typescript
@Controller('users')
export class UsersController {}
```

Service sẽ xử lý toàn bộ business logic, còn Controller chỉ tiếp nhận Request và trả Response.

---

## ❌ Common Mistakes

### Sai 1 - Viết Business Logic trong Controller

Sai

```typescript
@Get()
findAll() {

    // xử lý truy vấn Database

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

### Sai 2 - Không sử dụng Decorator phù hợp

Sai

```typescript
@Get()
createUser()
```

Đúng

```typescript
@Post()
createUser()
```

---

### Sai 3 - Không kiểm tra dữ liệu đầu vào

Không nên sử dụng trực tiếp dữ liệu từ `@Body()`.

Nên sử dụng DTO và Validation Pipe (sẽ học ở các bài sau).

---

### Sai 4 - Đặt quá nhiều API trong một Controller

Mỗi Controller nên quản lý một nhóm tài nguyên.

Ví dụ:

- UsersController
- ProductsController
- OrdersController

---

## 📚 Summary

- Controller tiếp nhận HTTP Request và trả về HTTP Response.
- `@Controller()` định nghĩa Route Prefix.
- `@Get()`, `@Post()`, `@Put()`, `@Delete()` ánh xạ tới các HTTP Method.
- `@Param()` lấy dữ liệu từ URL.
- `@Query()` lấy dữ liệu từ Query String.
- `@Body()` lấy dữ liệu từ Request Body.
- Controller nên gọi Service để xử lý business logic.

---

## 📝 Quiz

### Question 1

Decorator nào dùng để định nghĩa một Controller trong NestJS?

A.

```typescript
@Module()
```

B.

```typescript
@Controller()
```

C.

```typescript
@Injectable()
```

D.

```typescript
@Service()
```

**Answer: B**

**Giải thích:** `@Controller('users')` vừa đánh dấu class là controller vừa đặt tiền tố đường dẫn cho mọi route bên trong. Đổi tiền tố chỉ phải sửa một chỗ.


---

### Question 2

Decorator nào dùng để lấy dữ liệu từ URL, ví dụ `/users/:id`?

A.

```typescript
@Body()
```

B.

```typescript
@Query()
```

C.

```typescript
@Param()
```

D.

```typescript
@Headers()
```

**Answer: C**

**Giải thích:** `@Param()` lấy phần động của đường dẫn. Ba decorator còn lại lấy từ nguồn khác: `@Body()` từ thân request, `@Query()` từ chuỗi sau dấu `?`, `@Headers()` từ header. Điểm chung: mọi giá trị từ `@Param()` và `@Query()` đều là **chuỗi**, cần `ParseIntPipe` nếu muốn số.

