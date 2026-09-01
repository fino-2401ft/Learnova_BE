---
id: auth-m2-l2
course: Authentication & Security
module: Authorization
title: Permission
order: 2
difficulty: Intermediate
estimatedTime: 45
---
# Permission

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Permission là gì.
- Phân biệt Role và Permission.
- Thiết kế hệ thống phân quyền theo Permission.
- Kết hợp RBAC và Permission trong NestJS.
- Áp dụng Permission vào các API thực tế.

---

## 📖 Definition

**Permission (Quyền)** là quyền thực hiện một hành động cụ thể trong hệ thống.

Khác với **Role**, Permission mô tả **người dùng được phép làm gì**.

Ví dụ:

```text
CREATE_USER
```

```text
UPDATE_USER
```

```text
DELETE_USER
```

```text
VIEW_REPORT
```

Thông thường:

```text
Role

↓

Chứa nhiều Permission
```

Ví dụ

```text
ADMIN

↓

CREATE_USER

UPDATE_USER

DELETE_USER

VIEW_REPORT
```

Trong khi

```text
TEACHER

↓

CREATE_COURSE

UPDATE_COURSE

VIEW_STUDENT
```

---

## 💻 Syntax

### Define Permission

```typescript
export enum Permission {

    CREATE_USER = "CREATE_USER",

    UPDATE_USER = "UPDATE_USER",

    DELETE_USER = "DELETE_USER"

}
```

---

### Permission Decorator

```typescript
@Permissions(

    Permission.CREATE_USER

)
```

---

### Permission Guard

```typescript
@UseGuards(

    JwtAuthGuard,

    PermissionGuard

)
```

---

## 📝 Example 1 - Define Permission

```typescript
export enum Permission {

    CREATE_USER = "CREATE_USER",

    UPDATE_USER = "UPDATE_USER",

    DELETE_USER = "DELETE_USER"

}
```

Output

```text
Permission Enum Created
```

### Giải thích

Permission nên được định nghĩa bằng Enum để tránh sai chính tả và dễ bảo trì.

---

## 📝 Example 2 - Protect API

```typescript
@Permissions(

    Permission.DELETE_USER

)

@Delete(":id")

remove() {

    return "Deleted";

}
```

Request

```text
Permission

DELETE_USER
```

Response

```text
Deleted
```

Nếu người dùng không có quyền

```text
403 Forbidden
```

### Giải thích

Permission Guard sẽ kiểm tra xem người dùng có quyền `DELETE_USER` hay không.

---

## 📝 Example 3 - Multiple Permissions

```typescript
@Permissions(

    Permission.CREATE_USER,

    Permission.UPDATE_USER

)
```

Response

```text
Có CREATE_USER

↓

Allow
```

```text
Có UPDATE_USER

↓

Allow
```

```text
Không có cả hai

↓

Forbidden
```

### Giải thích

Một API có thể yêu cầu một hoặc nhiều Permission tùy theo thiết kế hệ thống.

---

## ⚠️ Notes

### 1. Role và Permission

Role

```text
Admin

Teacher

Student
```

Permission

```text
CREATE_USER

UPDATE_USER

DELETE_USER
```

Role là nhóm người dùng.

Permission là hành động được phép thực hiện.

---

### 2. Một Role chứa nhiều Permission

Ví dụ

```text
ADMIN

↓

CREATE_USER

UPDATE_USER

DELETE_USER
```

Điều này giúp quản lý quyền dễ dàng hơn.

---

### 3. Một User có thể có nhiều Permission

Ví dụ

```text
VIEW_REPORT

CREATE_COURSE
```

Không nhất thiết phải thuộc cùng một Role.

---

### 4. Permission linh hoạt hơn Role

Role phù hợp khi hệ thống đơn giản.

Permission phù hợp với hệ thống lớn có nhiều chức năng.

---

### 5. NestJS thường kết hợp Guard

Luồng xử lý

```text
JwtAuthGuard

↓

PermissionGuard

↓

Controller
```

PermissionGuard sẽ kiểm tra quyền trước khi Controller được gọi.

---

## 🌍 Real World Example

Hệ thống quản lý nhân sự.

```text
HR

↓

CREATE_EMPLOYEE

UPDATE_EMPLOYEE
```

```text
Manager

↓

VIEW_REPORT

APPROVE_LEAVE
```

```text
Admin

↓

Tất cả Permission
```

Mỗi API sẽ yêu cầu Permission tương ứng thay vì chỉ kiểm tra Role.

---

## ❌ Common Mistakes

### Sai 1 - Chỉ sử dụng Role

Ví dụ

```text
Admin
```

Có thể quá nhiều quyền.

Permission giúp phân quyền chi tiết hơn.

---

### Sai 2 - Đặt tên Permission không thống nhất

Sai

```text
CreateUser

create-user

CREATEUSER
```

Đúng

```text
CREATE_USER
```

---

### Sai 3 - Hard-code Permission

Sai

```typescript
if(permission=="DELETE_USER")
```

Đúng

```typescript
Permission.DELETE_USER
```

---

### Sai 4 - Một Permission cho quá nhiều chức năng

Ví dụ

```text
MANAGE_SYSTEM
```

Nên chia nhỏ

```text
CREATE_USER

DELETE_USER

UPDATE_USER

VIEW_REPORT
```

Giúp hệ thống dễ mở rộng hơn.

---

## 📚 Summary

- Permission là quyền thực hiện một hành động cụ thể.
- Role thường bao gồm nhiều Permission.
- Permission giúp phân quyền chi tiết hơn RBAC.
- Permission thường được kiểm tra bằng Guard.
- Enum giúp quản lý Permission an toàn và dễ bảo trì.

---

## 📝 Quiz

### Question 1

Permission dùng để xác định điều gì?

A.

Danh tính người dùng

B.

Vai trò của người dùng

C.

Hành động người dùng được phép thực hiện

D.

Mật khẩu của người dùng

**Answer: C**

**Giải thích:** Permission mô tả một hành động cụ thể, thường đặt tên dạng `course:publish` hay `user:delete`. Nó chi tiết hơn role — cùng vai trò MENTOR nhưng có thể người được duyệt khoá, người thì không.


---

### Question 2

Role thường có mối quan hệ như thế nào với Permission?

A.

Role chứa nhiều Permission

B.

Permission chứa nhiều Role

C.

Role và Permission không liên quan

D.

Permission thay thế hoàn toàn Role

**Answer: A**

**Giải thích:** Một role gom nhiều permission, và một người có thể mang nhiều role. Mô hình này linh hoạt hơn kiểm tra role trực tiếp: khi cần siết một hành động, bạn sửa danh sách permission của role thay vì đi sửa từng chỗ kiểm tra `if (role === 'ADMIN')` rải rác trong code.

