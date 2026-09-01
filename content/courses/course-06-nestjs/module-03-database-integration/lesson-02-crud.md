---
id: nest-m3-l2
course: NestJS
module: Database Integration
title: CRUD
order: 2
difficulty: Intermediate
estimatedTime: 85
---
# CRUD

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Xây dựng CRUD API với NestJS và Prisma.
- Tạo dữ liệu bằng `create()`.
- Truy vấn dữ liệu bằng `findMany()` và `findUnique()`.
- Cập nhật dữ liệu bằng `update()`.
- Xóa dữ liệu bằng `delete()`.
- Tổ chức mã nguồn theo kiến trúc Controller → Service → Prisma.

---

## 📖 Definition

CRUD là bốn thao tác cơ bản trong hầu hết các ứng dụng:

- **Create** - Tạo dữ liệu.
- **Read** - Đọc dữ liệu.
- **Update** - Cập nhật dữ liệu.
- **Delete** - Xóa dữ liệu.

Trong NestJS, luồng xử lý thường là:

```text
Client

↓

Controller

↓

Service

↓

Prisma

↓

Database
```

Controller tiếp nhận Request.

Service xử lý nghiệp vụ.

Prisma thao tác với Database.

---

# 💻 Project Structure

```text
src/

├── users/

│   ├── users.controller.ts

│   ├── users.service.ts

│   └── users.module.ts

├── prisma/

│   └── prisma.service.ts
```

---

## 📝 Example 1 - Create User

UsersService

```typescript
@Injectable()
export class UsersService {

    constructor(

        private readonly prisma: PrismaService

    ) {}

    async create(data: {

        name: string;

        email: string;

    }) {

        return this.prisma.user.create({

            data

        });

    }

}
```

UsersController

```typescript
@Post()
create(

    @Body() body: {

        name: string;

        email: string;

    }

) {

    return this.usersService.create(body);

}
```

### Giải thích

API tạo một User mới bằng Prisma.

---

## 📝 Example 2 - Get All Users

UsersService

```typescript
async findAll() {

    return this.prisma.user.findMany();

}
```

Controller

```typescript
@Get()
findAll() {

    return this.usersService.findAll();

}
```

Request

```http
GET /users
```

### Giải thích

`findMany()` lấy toàn bộ dữ liệu.

---

## 📝 Example 3 - Get User By ID

UsersService

```typescript
async findOne(id: number) {

    return this.prisma.user.findUnique({

        where: {

            id

        }

    });

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

`findUnique()` tìm User theo Primary Key.

---

## 📝 Example 4 - Update User

UsersService

```typescript
async update(

    id: number,

    data: {

        name?: string;

        email?: string;

    }

) {

    return this.prisma.user.update({

        where: {

            id

        },

        data

    });

}
```

Controller

```typescript
@Put(':id')
update(

    @Param('id') id: string,

    @Body() body: any

) {

    return this.usersService.update(

        Number(id),

        body

    );

}
```

### Giải thích

`update()` cập nhật dữ liệu theo ID.

---

## 📝 Example 5 - Delete User

UsersService

```typescript
async remove(id: number) {

    return this.prisma.user.delete({

        where: {

            id

        }

    });

}
```

Controller

```typescript
@Delete(':id')
remove(

    @Param('id') id: string

) {

    return this.usersService.remove(

        Number(id)

    );

}
```

### Giải thích

`delete()` xóa User theo ID.

---

## 📝 Example 6 - API Summary

| Method | Endpoint | Description |
|----------|-----------|-------------|
| GET | `/users` | Lấy danh sách User |
| GET | `/users/:id` | Lấy User theo ID |
| POST | `/users` | Tạo User |
| PUT | `/users/:id` | Cập nhật User |
| DELETE | `/users/:id` | Xóa User |

---

## ⚠️ Notes

### 1. Controller chỉ nhận Request

Không nên viết truy vấn Prisma trong Controller.

---

### 2. Service xử lý nghiệp vụ

Service chịu trách nhiệm:

- Kiểm tra dữ liệu.
- Gọi Prisma.
- Trả kết quả.

---

### 3. Prisma thao tác Database

Ví dụ:

```typescript
this.prisma.user.findMany()
```

---

### 4. Param luôn là string

```typescript
@Param('id') id: string
```

Nên chuyển sang số:

```typescript
Number(id)
```

hoặc sử dụng `ParseIntPipe` (sẽ học ở Module 4).

---

### 5. Async/Await

Các phương thức Prisma đều trả về Promise.

Luôn sử dụng:

```typescript
await
```

hoặc trả trực tiếp Promise.

---

### 6. DTO

Trong thực tế không nên dùng:

```typescript
@Body() body: any
```

Mà nên sử dụng DTO để kiểm tra dữ liệu đầu vào.

---

## 🌍 Real World Example

API quản lý người dùng:

```text
POST /users

↓

UsersController

↓

UsersService

↓

PrismaService

↓

MySQL
```

Khi người dùng gửi:

```json
{
    "name": "Alice",
    "email": "alice@example.com"
}
```

Service sẽ gọi:

```typescript
this.prisma.user.create()
```

để lưu dữ liệu vào Database.

---

## ❌ Common Mistakes

### Sai 1 - Truy vấn Prisma trong Controller

Sai

```typescript
@Get()
findAll() {

    return this.prisma.user.findMany();

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

### Sai 2 - Không chuyển đổi ID

Sai

```typescript
findOne(id)
```

Đúng

```typescript
findOne(Number(id))
```

---

### Sai 3 - Dùng any cho mọi dữ liệu

Sai

```typescript
@Body() body: any
```

Đúng

Sử dụng DTO để định nghĩa kiểu dữ liệu.

---

### Sai 4 - Không xử lý lỗi

Nếu User không tồn tại:

```typescript
update()
```

hoặc

```typescript
delete()
```

Prisma sẽ phát sinh Exception.

Nên xử lý bằng Exception Filter hoặc `try...catch`.

---

## 📚 Summary

- CRUD gồm Create, Read, Update và Delete.
- Controller nhận Request và gọi Service.
- Service sử dụng Prisma để thao tác Database.
- `create()` tạo dữ liệu.
- `findMany()` lấy danh sách.
- `findUnique()` lấy một bản ghi.
- `update()` cập nhật dữ liệu.
- `delete()` xóa dữ liệu.
- Nên sử dụng DTO và Validation cho dữ liệu đầu vào.

---

## 📝 Quiz

### Question 1

Phương thức Prisma nào dùng để lấy tất cả User?

A.

```typescript
findOne()
```

B.

```typescript
findUnique()
```

C.

```typescript
findMany()
```

D.

```typescript
select()
```

**Answer: C**

**Giải thích:** `findMany()` trả về mảng, rỗng nếu không khớp dòng nào. `findUnique()` tìm theo khoá duy nhất và trả về object hoặc `null`. `findOne()` và `select()` không tồn tại trong API của Prisma.


---

### Question 2

Trong kiến trúc NestJS, thành phần nào nên trực tiếp gọi Prisma?

A.

Controller

B.

Module

C.

Service

D.

Middleware

**Answer: C**

**Giải thích:** Controller nên mỏng và không biết gì về database. Gọi Prisma thẳng từ controller trộn lẫn tầng HTTP với tầng dữ liệu: logic đó không dùng lại được ngoài route hiện tại, và muốn test phải dựng cả request giả.

