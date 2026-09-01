---
id: auth-m2-l1
course: Authentication & Security
module: Authorization
title: RBAC
order: 1
difficulty: Intermediate
estimatedTime: 40
---
# RBAC (Role-Based Access Control)

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu RBAC là gì.
- Phân biệt Authentication và Authorization.
- Hiểu khái niệm Role.
- Áp dụng RBAC trong NestJS.
- Thiết kế hệ thống phân quyền theo Role.

---

## 📖 Definition

Sau khi người dùng đăng nhập thành công, hệ thống cần xác định **người dùng được phép thực hiện những hành động nào**.

Quá trình này gọi là **Authorization (Phân quyền).**

Một trong những mô hình phân quyền phổ biến nhất là **RBAC (Role-Based Access Control)**.

RBAC là mô hình cấp quyền dựa trên **Role (Vai trò)** của người dùng.

Ví dụ:

```text
Admin

↓

Có toàn quyền
```

```text
Teacher

↓

Quản lý khóa học
```

```text
Student

↓

Xem và học khóa học
```

Mỗi người dùng được gán một hoặc nhiều Role.

Hệ thống sẽ quyết định quyền truy cập dựa trên Role đó.

---

## 💻 Syntax

### Enum Role

```typescript
export enum Role {

    ADMIN = "ADMIN",

    TEACHER = "TEACHER",

    STUDENT = "STUDENT"

}
```

---

### Roles Decorator

```typescript
@Roles(

    Role.ADMIN

)
```

---

### Guard

```typescript
@UseGuards(

    JwtAuthGuard,

    RolesGuard

)
```

---

## 📝 Example 1 - Define Role

```typescript
export enum Role {

    ADMIN = "ADMIN",

    TEACHER = "TEACHER",

    STUDENT = "STUDENT"

}
```

Output

```text
Role Enum Created
```

### Giải thích

Role được định nghĩa bằng Enum để tránh lỗi khi sử dụng chuỗi (String).

---

## 📝 Example 2 - Protect Route

```typescript
@Roles(

    Role.ADMIN

)

@Get()

findAllUsers() {

    return [];

}
```

Request

```text
Role = ADMIN
```

Response

```json
[]
```

Nếu

```text
Role = STUDENT
```

Response

```text
403 Forbidden
```

### Giải thích

Chỉ người dùng có Role ADMIN mới được phép truy cập API.

---

## 📝 Example 3 - Multiple Roles

```typescript
@Roles(

    Role.ADMIN,

    Role.TEACHER

)

@Get()

findCourses() {

    return [];

}
```

Response

```text
ADMIN → Allow

TEACHER → Allow

STUDENT → Forbidden
```

### Giải thích

Một API có thể cho phép nhiều Role truy cập.

---

## ⚠️ Notes

### 1. Authentication ≠ Authorization

Authentication

```text
Bạn là ai?
```

Authorization

```text
Bạn được phép làm gì?
```

---

### 2. Role

Role là nhóm quyền.

Ví dụ

```text
ADMIN

TEACHER

STUDENT
```

---

### 3. Một User có thể có nhiều Role

Ví dụ

```text
ADMIN

+

TEACHER
```

---

### 4. RBAC phù hợp với hệ thống lớn

Ví dụ

- LMS
- CRM
- ERP
- E-commerce

---

### 5. RBAC thường kết hợp Guard

Trong NestJS

```typescript
JwtAuthGuard
```

↓

```typescript
RolesGuard
```

Guard sẽ kiểm tra Role trước khi Controller được thực thi.

---

## 🌍 Real World Example

Một hệ thống học trực tuyến.

```text
Student

↓

Xem khóa học

Làm bài kiểm tra
```

```text
Teacher

↓

Tạo khóa học

Quản lý bài học
```

```text
Admin

↓

Quản lý toàn bộ hệ thống
```

RBAC giúp giới hạn quyền truy cập của từng nhóm người dùng.

---

## ❌ Common Mistakes

### Sai 1 - Không kiểm tra Role

Sai

```text
Chỉ kiểm tra JWT.
```

Người dùng đã đăng nhập vẫn có thể truy cập mọi API.

---

### Sai 2 - So sánh Role bằng String

Sai

```typescript
if(role=="admin")
```

Đúng

```typescript
Role.ADMIN
```

---

### Sai 3 - Quá nhiều Role

Ví dụ

```text
Admin1

Admin2

Admin3

Admin4
```

Nên giữ số lượng Role ở mức hợp lý.

---

### Sai 4 - Dùng RBAC cho mọi trường hợp

RBAC phù hợp với phân quyền theo vai trò.

Nếu cần phân quyền chi tiết hơn nên kết hợp Permission.

---

## 📚 Summary

- RBAC là mô hình phân quyền dựa trên Role.
- Authentication xác thực danh tính, Authorization kiểm tra quyền truy cập.
- Role thường được định nghĩa bằng Enum.
- RBAC thường được triển khai cùng Guard trong NestJS.
- Một Route có thể cho phép một hoặc nhiều Role truy cập.

---

## 📝 Quiz

### Question 1

RBAC là viết tắt của?

A.

Role-Based Access Control

B.

Remote Basic Access Control

C.

Role Binding Access Class

D.

Resource-Based Authentication Control

**Answer: A**

**Giải thích:** Role-Based Access Control: quyền gắn vào **vai trò**, người dùng nhận vai trò. Nhờ đó thêm một mentor mới không phải cấp lại từng quyền, và đổi quyền của cả nhóm chỉ cần sửa một chỗ.


---

### Question 2

Authentication trả lời câu hỏi nào?

A.

Bạn được phép làm gì?

B.

Bạn là ai?

C.

Bạn có bao nhiêu quyền?

D.

Bạn thuộc phòng ban nào?

**Answer: B**

**Giải thích:** Authentication trả lời "bạn là ai", Authorization trả lời "bạn được làm gì". Thứ tự luôn là xác thực trước rồi mới phân quyền. Ánh xạ sang mã HTTP: chưa xác thực được là `401`, xác thực rồi nhưng không đủ quyền là `403`.

