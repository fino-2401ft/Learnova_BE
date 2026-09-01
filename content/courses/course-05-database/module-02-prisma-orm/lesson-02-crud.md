---
id: db-m2-l2
course: Database
module: Prisma ORM
title: CRUD
order: 2
difficulty: Intermediate
estimatedTime: 70
---
# CRUD với Prisma ORM

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu cách thực hiện CRUD bằng Prisma.
- Tạo dữ liệu mới với `create()`.
- Truy vấn dữ liệu với `findMany()` và `findUnique()`.
- Cập nhật dữ liệu với `update()`.
- Xóa dữ liệu với `delete()`.
- Áp dụng CRUD trong ứng dụng Node.js.

---

## 📖 Definition

Sau khi tạo **Prisma Schema** và sinh **Prisma Client**, chúng ta có thể thao tác với Database thông qua Prisma Client.

CRUD gồm bốn thao tác cơ bản:

- **Create**: Tạo dữ liệu.
- **Read**: Đọc dữ liệu.
- **Update**: Cập nhật dữ liệu.
- **Delete**: Xóa dữ liệu.

Prisma giúp thực hiện các thao tác này bằng JavaScript/TypeScript mà không cần viết SQL trực tiếp.

---

# 💻 Setup

Khởi tạo Prisma Client

```javascript
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
```

---

# 💻 Sample Model

```prisma
model User {

    id    Int    @id @default(autoincrement())

    name  String

    email String @unique

}
```

---

## 💻 Syntax

### Create

```javascript
await prisma.user.create({

    data: {

    }

});
```

---

### Find Many

```javascript
await prisma.user.findMany();
```

---

### Find Unique

```javascript
await prisma.user.findUnique({

    where: {

    }

});
```

---

### Update

```javascript
await prisma.user.update({

    where: {

    },

    data: {

    }

});
```

---

### Delete

```javascript
await prisma.user.delete({

    where: {

    }

});
```

---

## 📝 Example 1 - Create

```javascript
const user = await prisma.user.create({

    data: {

        name: "Alice",

        email: "alice@example.com"

    }

});

console.log(user);
```

Output

```text
{
    id: 1,
    name: "Alice",
    email: "alice@example.com"
}
```

### Giải thích

`create()` tạo một bản ghi mới trong bảng `User`.

---

## 📝 Example 2 - Read

```javascript
const users = await prisma.user.findMany();

console.log(users);
```

Output

```text
[
    {
        id: 1,
        name: "Alice",
        email: "alice@example.com"
    }
]
```

### Giải thích

`findMany()` lấy tất cả dữ liệu trong bảng.

---

## 📝 Example 3 - Find Unique

```javascript
const user = await prisma.user.findUnique({

    where: {

        id: 1

    }

});

console.log(user);
```

### Giải thích

`findUnique()` lấy đúng một bản ghi dựa trên khóa chính hoặc trường `@unique`.

---

## 📝 Example 4 - Update

```javascript
const user = await prisma.user.update({

    where: {

        id: 1

    },

    data: {

        name: "Anna"

    }

});

console.log(user);
```

Output

```text
{
    id: 1,
    name: "Anna",
    email: "alice@example.com"
}
```

### Giải thích

`update()` cập nhật dữ liệu của bản ghi được chỉ định.

---

## 📝 Example 5 - Delete

```javascript
await prisma.user.delete({

    where: {

        id: 1

    }

});
```

### Giải thích

`delete()` xóa bản ghi có `id = 1`.

---

## 📝 Example 6 - Find First

```javascript
const user = await prisma.user.findFirst({

    where: {

        name: "Alice"

    }

});
```

### Giải thích

`findFirst()` trả về bản ghi đầu tiên thỏa mãn điều kiện.

---

## 📝 Example 7 - Điều kiện WHERE

```javascript
const users = await prisma.user.findMany({

    where: {

        name: "Alice"

    }

});
```

### Giải thích

Chỉ lấy những người dùng có tên là Alice.

---

## 📝 Example 8 - Chọn một số cột

```javascript
const users = await prisma.user.findMany({

    select: {

        id: true,

        name: true

    }

});
```

Output

```text
[
    {
        id: 1,
        name: "Alice"
    }
]
```

### Giải thích

`select` giúp chỉ lấy những trường cần thiết, tăng hiệu năng truy vấn.

---

## ⚠️ Notes

### 1. create()

```javascript
await prisma.user.create()
```

Tạo một bản ghi mới.

---

### 2. findMany()

```javascript
await prisma.user.findMany()
```

Lấy nhiều bản ghi.

---

### 3. findUnique()

```javascript
await prisma.user.findUnique()
```

Chỉ tìm kiếm theo khóa chính hoặc trường có `@unique`.

---

### 4. update()

Nếu không tìm thấy bản ghi cần cập nhật, Prisma sẽ phát sinh lỗi.

---

### 5. delete()

Nếu bản ghi không tồn tại, Prisma cũng sẽ phát sinh lỗi.

---

### 6. where

```javascript
where: {

    id: 1

}
```

Dùng để xác định dữ liệu cần thao tác.

---

### 7. select

```javascript
select: {

    id: true,

    name: true

}
```

Giúp giảm lượng dữ liệu trả về.

---

## 🌍 Real World Example

API lấy danh sách người dùng.

```javascript
app.get("/users", async (req, res) => {

    const users = await prisma.user.findMany();

    res.json(users);

});
```

API tạo người dùng.

```javascript
app.post("/users", async (req, res) => {

    const user = await prisma.user.create({

        data: req.body

    });

    res.status(201).json(user);

});
```

Đây là cách Prisma thường được sử dụng trong các REST API với Express.js hoặc NestJS.

---

## ❌ Common Mistakes

### Sai 1 - Quên await

Sai

```javascript
const users = prisma.user.findMany();
```

Đúng

```javascript
const users = await prisma.user.findMany();
```

---

### Sai 2 - Dùng findUnique() với trường không unique

Sai

```javascript
await prisma.user.findUnique({

    where: {

        name: "Alice"

    }

});
```

Đúng

```javascript
await prisma.user.findFirst({

    where: {

        name: "Alice"

    }

});
```

---

### Sai 3 - Không xử lý lỗi

Sai

```javascript
await prisma.user.update({

    where: {

        id: 999

    }

});
```

Nếu bản ghi không tồn tại sẽ phát sinh lỗi.

Nên sử dụng `try...catch` để xử lý.

---

### Sai 4 - Lấy toàn bộ dữ liệu khi không cần

Sai

```javascript
await prisma.user.findMany();
```

Đúng

```javascript
await prisma.user.findMany({

    select: {

        id: true,

        name: true

    }

});
```

---

## 📚 Summary

- Prisma Client cung cấp các phương thức CRUD mạnh mẽ.
- `create()` dùng để tạo dữ liệu.
- `findMany()` lấy nhiều bản ghi.
- `findUnique()` lấy một bản ghi theo khóa chính hoặc trường `@unique`.
- `update()` cập nhật dữ liệu.
- `delete()` xóa dữ liệu.
- `where` dùng để xác định dữ liệu cần thao tác.
- `select` giúp chỉ lấy các trường cần thiết.

---

## 📝 Quiz

### Question 1

Phương thức nào dùng để lấy tất cả bản ghi trong bảng?

A.

```javascript
findUnique()
```

B.

```javascript
findMany()
```

C.

```javascript
findAll()
```

D.

```javascript
select()
```

**Answer: B**

**Giải thích:** `findMany()` trả về **mảng**, rỗng nếu không có dòng nào khớp. Khác với `findUnique()` — nó tìm theo khoá duy nhất và trả về một object hoặc `null`, nên phải kiểm tra `null` trước khi dùng.


---

### Question 2

Phương thức nào dùng để tạo một bản ghi mới?

A.

```javascript
insert()
```

B.

```javascript
save()
```

C.

```javascript
create()
```

D.

```javascript
add()
```

**Answer: C**

**Giải thích:** `create()` chèn một bản ghi và trả về chính bản ghi vừa tạo, kèm những giá trị do database sinh ra như `id` và `createdAt`. Cần chèn nhiều dòng một lúc thì dùng `createMany()`, nhưng nó không trả về dữ liệu đã tạo.

