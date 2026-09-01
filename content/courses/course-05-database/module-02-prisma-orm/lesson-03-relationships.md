---
id: db-m2-l3
course: Database
module: Prisma ORM
title: Relationships
order: 3
difficulty: Intermediate
estimatedTime: 75
---
# Relationships

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Relationship trong cơ sở dữ liệu.
- Khai báo quan hệ trong Prisma Schema.
- Xây dựng quan hệ One-to-One.
- Xây dựng quan hệ One-to-Many.
- Xây dựng quan hệ Many-to-Many.
- Truy vấn dữ liệu liên quan bằng Prisma Client.

---

## 📖 Definition

Trong cơ sở dữ liệu, **Relationship (Mối quan hệ)** mô tả cách các bảng liên kết với nhau.

Prisma hỗ trợ ba loại quan hệ chính:

- One-to-One (1:1)
- One-to-Many (1:N)
- Many-to-Many (N:N)

Relationship giúp:

- Giảm trùng lặp dữ liệu.
- Dễ quản lý dữ liệu.
- Đảm bảo tính toàn vẹn của cơ sở dữ liệu.

---

# 💻 One-to-One

Ví dụ:

Một người dùng chỉ có một hồ sơ.

```text
User

↓

Profile
```

---

### Schema

```prisma
model User {

    id      Int      @id @default(autoincrement())

    name    String

    profile Profile?

}

model Profile {

    id      Int     @id @default(autoincrement())

    bio     String

    userId  Int     @unique

    user    User    @relation(fields: [userId], references: [id])

}
```

### Giải thích

- Một User có một Profile.
- `userId` là Foreign Key.
- `@unique` đảm bảo mỗi User chỉ có một Profile.

---

# 💻 One-to-Many

Ví dụ:

Một người dùng có nhiều đơn hàng.

```text
User

↓

Orders
```

---

### Schema

```prisma
model User {

    id      Int      @id @default(autoincrement())

    name    String

    orders  Order[]

}

model Order {

    id      Int      @id @default(autoincrement())

    total   Float

    userId  Int

    user    User     @relation(fields: [userId], references: [id])

}
```

### Giải thích

- Một User có nhiều Order.
- Mỗi Order chỉ thuộc về một User.

---

# 💻 Many-to-Many

Ví dụ:

Sinh viên học nhiều môn học.

Mỗi môn học có nhiều sinh viên.

---

### Schema

```prisma
model Student {

    id       Int       @id @default(autoincrement())

    name     String

    courses  Course[]

}

model Course {

    id        Int        @id @default(autoincrement())

    title     String

    students  Student[]

}
```

### Giải thích

Prisma sẽ tự động tạo bảng trung gian (Join Table).

---

## 📝 Example 1 - Tạo User cùng Order

```javascript
const user = await prisma.user.create({

    data: {

        name: "Alice",

        orders: {

            create: [

                {

                    total: 200

                },

                {

                    total: 350

                }

            ]

        }

    }

});
```

### Giải thích

Prisma hỗ trợ **Nested Write** để tạo nhiều bản ghi liên quan trong một lần.

---

## 📝 Example 2 - Include Relationship

```javascript
const users = await prisma.user.findMany({

    include: {

        orders: true

    }

});
```

Output

```text
[
    {
        id: 1,
        name: "Alice",
        orders: [
            {
                id: 1,
                total: 200
            },
            {
                id: 2,
                total: 350
            }
        ]
    }
]
```

### Giải thích

`include` dùng để lấy dữ liệu liên quan.

---

## 📝 Example 3 - Select Relationship

```javascript
const users = await prisma.user.findMany({

    select: {

        name: true,

        orders: true

    }

});
```

### Giải thích

`select` cho phép lấy một số trường cùng với Relationship.

---

## 📝 Example 4 - Connect

```javascript
await prisma.order.create({

    data: {

        total: 500,

        user: {

            connect: {

                id: 1

            }

        }

    }

});
```

### Giải thích

`connect` liên kết bản ghi mới với dữ liệu đã tồn tại.

---

## 📝 Example 5 - Disconnect

```javascript
await prisma.user.update({

    where: {

        id: 1

    },

    data: {

        profile: {

            disconnect: true

        }

    }

});
```

### Giải thích

`disconnect` ngắt liên kết giữa hai bản ghi nhưng không xóa dữ liệu.

---

## ⚠️ Notes

### 1. One-to-One

```text
User

↓

Profile
```

Một bản ghi chỉ liên kết với một bản ghi khác.

---

### 2. One-to-Many

```text
User

↓

Orders
```

Một User có nhiều Order.

---

### 3. Many-to-Many

```text
Students

↔

Courses
```

Hai bảng đều có thể chứa nhiều bản ghi liên quan đến nhau.

---

### 4. include

```javascript
include: {

    orders: true

}
```

Lấy toàn bộ dữ liệu của Relationship.

---

### 5. select

```javascript
select: {

    name: true

}
```

Chỉ lấy các trường cần thiết.

---

### 6. connect

Liên kết bản ghi hiện có.

---

### 7. disconnect

Hủy liên kết nhưng không xóa dữ liệu.

---

## 🌍 Real World Example

Hệ thống thương mại điện tử.

```text
User

↓

Orders

↓

OrderItems

↓

Product
```

Khi lấy thông tin đơn hàng:

```javascript
const orders = await prisma.order.findMany({

    include: {

        user: true,

        items: true

    }

});
```

Prisma sẽ tự động trả về dữ liệu của cả User và OrderItems.

---

## ❌ Common Mistakes

### Sai 1 - Quên Foreign Key

Sai

```prisma
model Order {

    id Int @id
}
```

Đúng

```prisma
userId Int
```

---

### Sai 2 - Không khai báo @relation

Sai

```prisma
user User
```

Đúng

```prisma
user User @relation(fields: [userId], references: [id])
```

---

### Sai 3 - Không dùng include

Sai

```javascript
await prisma.user.findMany();
```

Không lấy được dữ liệu Order.

Đúng

```javascript
await prisma.user.findMany({

    include: {

        orders: true

    }

});
```

---

### Sai 4 - Nhầm connect với create

```javascript
connect
```

Liên kết bản ghi đã tồn tại.

```javascript
create
```

Tạo bản ghi mới.

---

## 📚 Summary

- Prisma hỗ trợ ba loại Relationship:
  - One-to-One
  - One-to-Many
  - Many-to-Many
- `@relation` dùng để định nghĩa mối quan hệ.
- `include` lấy dữ liệu liên quan.
- `select` chỉ lấy các trường cần thiết.
- `connect` liên kết dữ liệu đã có.
- `disconnect` hủy liên kết giữa các bản ghi.
- Nested Write cho phép tạo nhiều bản ghi liên quan trong một thao tác.

---

## 📝 Quiz

### Question 1

Annotation nào được sử dụng để khai báo mối quan hệ trong Prisma?

A.

```prisma
@connect
```

B.

```prisma
@join
```

C.

```prisma
@relation
```

D.

```prisma
@reference
```

**Answer: C**

**Giải thích:** `@relation` nêu rõ khoá ngoại trỏ tới đâu: `@relation(fields: [userId], references: [userId])`. Nó cũng là chỗ khai `onDelete` — quyết định chuyện gì xảy ra với bản ghi con khi bản ghi cha bị xoá.


---

### Question 2

Tùy chọn nào dùng để lấy dữ liệu của bảng liên quan khi truy vấn?

A.

```javascript
join
```

B.

```javascript
include
```

C.

```javascript
relation
```

D.

```javascript
expand
```

**Answer: B**

**Giải thích:** `include` nạp luôn dữ liệu của bảng liên quan trong cùng một lần gọi. Đây là cách tránh bài toán N+1: lấy 20 khoá học rồi lặp qua từng khoá để truy vấn mentor sẽ tốn 21 lượt đi database, còn `include: { mentor: true }` chỉ tốn một.

