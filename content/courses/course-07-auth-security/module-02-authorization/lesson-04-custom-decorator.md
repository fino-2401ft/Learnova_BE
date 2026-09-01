---
id: auth-m2-l4
course: Authentication & Security
module: Authorization
title: Custom Decorator
order: 4
difficulty: Intermediate
estimatedTime: 45
---
# Custom Decorator

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Custom Decorator là gì.
- Biết lợi ích của Custom Decorator trong NestJS.
- Tạo Roles Decorator.
- Tạo Permissions Decorator.
- Tạo CurrentUser Decorator để lấy thông tin người dùng.

---

## 📖 Definition

NestJS cung cấp **Decorator** để gắn Metadata hoặc trích xuất dữ liệu từ Request.

Ngoài các Decorator có sẵn như:

```typescript
@Get()

@Post()

@Controller()

@Inject()

@Body()

@Param()
```

NestJS còn cho phép chúng ta tạo **Custom Decorator**.

Custom Decorator giúp:

- Giảm lặp code.
- Tăng khả năng tái sử dụng.
- Làm Controller ngắn gọn và dễ đọc.
- Kết hợp với Guard để xây dựng hệ thống Authorization.

---

## 💻 Syntax

### Create Decorator

```typescript
export const Roles =

(...roles: string[]) =>

SetMetadata(

    "roles",

    roles

);
```

---

### Use Decorator

```typescript
@Roles(

    "ADMIN"

)
```

---

## 📝 Example 1 - Roles Decorator

```typescript
import {

    SetMetadata

} from "@nestjs/common";

export const Roles =

(...roles: string[]) =>

SetMetadata(

    "roles",

    roles

);
```

Controller

```typescript
@Roles(

    "ADMIN"

)

@Get()

findAll() {

    return [];

}
```

Output

```text
Metadata

roles = ["ADMIN"]
```

### Giải thích

Decorator lưu Metadata vào Route.

RolesGuard sẽ đọc Metadata này để kiểm tra quyền truy cập.

---

## 📝 Example 2 - Permissions Decorator

```typescript
export const Permissions =

(...permissions: string[]) =>

SetMetadata(

    "permissions",

    permissions

);
```

Controller

```typescript
@Permissions(

    "DELETE_USER"

)

@Delete(":id")

remove() {

    return "Deleted";

}
```

Output

```text
Permission Metadata Created
```

### Giải thích

PermissionGuard sẽ đọc Metadata để xác định người dùng có quyền thực hiện hành động hay không.

---

## 📝 Example 3 - CurrentUser Decorator

```typescript
import {

    createParamDecorator,

    ExecutionContext

} from "@nestjs/common";

export const CurrentUser =

createParamDecorator(

    (

        data,

        context: ExecutionContext

    ) => {

        const request =

        context.switchToHttp().getRequest();

        return request.user;

    }

);
```

Controller

```typescript
@Get("profile")

getProfile(

    @CurrentUser()

    user: any

) {

    return user;

}
```

Response

```json
{

    "id":1,

    "username":"alice",

    "role":"ADMIN"

}
```

### Giải thích

Decorator giúp lấy thông tin người dùng từ Request mà không cần viết lại cùng một đoạn code ở nhiều Controller.

---

## ⚠️ Notes

### 1. SetMetadata()

`SetMetadata()` dùng để lưu Metadata vào Route hoặc Controller.

Ví dụ

```typescript
SetMetadata(

    "roles",

    ["ADMIN"]

);
```

Metadata sẽ được Guard đọc thông qua `Reflector`.

---

### 2. createParamDecorator()

Được sử dụng để tạo Decorator lấy dữ liệu từ Request.

Ví dụ

```typescript
@CurrentUser()
```

```typescript
@ClientIp()
```

```typescript
@CurrentRole()
```

---

### 3. Kết hợp với Guard

Thông thường:

```text
Decorator

↓

Metadata

↓

Guard

↓

Controller
```

Guard đọc Metadata để quyết định có cho phép Request tiếp tục hay không.

---

### 4. Không chứa Business Logic

Decorator chỉ nên:

- Lưu Metadata.
- Trích xuất dữ liệu từ Request.

Không nên:

- Truy vấn Database.
- Gọi Service.
- Xử lý nghiệp vụ.

---

### 5. Tái sử dụng

Một Custom Decorator có thể được sử dụng ở nhiều Controller khác nhau.

Điều này giúp giảm lặp code và dễ bảo trì.

---

## 🌍 Real World Example

API quản lý người dùng.

```typescript
@Roles("ADMIN")

@Permissions("DELETE_USER")

@Delete(":id")

deleteUser() {}
```

Luồng xử lý

```text
Request

↓

Decorator

↓

Metadata

↓

RolesGuard

↓

PermissionGuard

↓

Controller
```

Nếu người dùng không có Role hoặc Permission phù hợp:

```text
403 Forbidden
```

---

## ❌ Common Mistakes

### Sai 1 - Viết Business Logic trong Decorator

Sai

```text
Query Database

Update User

Delete User
```

Decorator chỉ nên tạo Metadata hoặc lấy dữ liệu từ Request.

---

### Sai 2 - Không sử dụng Guard

Decorator chỉ lưu Metadata.

Nếu không có Guard đọc Metadata thì Decorator sẽ không có tác dụng.

---

### Sai 3 - Hard-code Role

Sai

```typescript
@Roles(

    "admin"
)
```

Nên sử dụng Enum.

```typescript
@Roles(

    Role.ADMIN
)
```

---

### Sai 4 - Lặp lại code lấy User

Sai

```typescript
const request =

context.switchToHttp()

.getRequest();

const user = request.user;
```

ở nhiều Controller.

Nên tạo:

```typescript
@CurrentUser()
```

để tái sử dụng.

---

## 📚 Summary

- Custom Decorator giúp mở rộng khả năng của NestJS.
- `SetMetadata()` được dùng để tạo Decorator cho Role và Permission.
- `createParamDecorator()` được dùng để lấy dữ liệu từ Request.
- Decorator thường kết hợp với Guard để xây dựng hệ thống Authorization.
- Không nên đặt Business Logic trong Decorator.

---

## 📝 Quiz

### Question 1

Hàm nào được sử dụng để tạo Metadata trong NestJS?

A.

```typescript
SetValue()
```

B.

```typescript
SetMetadata()
```

C.

```typescript
SetDecorator()
```

D.

```typescript
SetGuard()
```

**Answer: B**

**Giải thích:** `SetMetadata(key, value)` gắn dữ liệu lên route hoặc controller, còn guard đọc lại bằng `Reflector`. Cặp này là cách `@Roles('ADMIN')` hoạt động: decorator chỉ ghi metadata, toàn bộ việc kiểm tra nằm ở guard.


---

### Question 2

Decorator nào thường được dùng để lấy thông tin người dùng từ Request?

A.

```typescript
@CurrentUser()
```

B.

```typescript
@GetUser()
```

C.

```typescript
@User()
```

D.

```typescript
@RequestUser()
```

**Answer: A**

**Giải thích:** `@CurrentUser()` là decorator tham số do bạn tự tạo bằng `createParamDecorator`, lấy `request.user` mà `JwtStrategy` đã gắn vào. Đây không phải decorator có sẵn của Nest — tên gọi do dự án tự đặt, và ba phương án còn lại đều là tên hợp lệ nếu bạn chọn chúng.

