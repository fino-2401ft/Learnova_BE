---
id: ts-m3-l3
course: TypeScript
module: Advanced TypeScript
title: Decorator
order: 3
difficulty: Intermediate
estimatedTime: 45
---
# Decorator

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Decorator là gì.
- Biết các loại Decorator trong TypeScript.
- Áp dụng Class Decorator và Method Decorator.
- Hiểu cách Decorator hoạt động.
- Biết vai trò của Decorator trong NestJS.

---

## 📖 Definition

Decorator là một tính năng của TypeScript cho phép **thêm hành vi (behavior)** hoặc **metadata** vào Class, Method, Property hoặc Parameter mà **không cần sửa trực tiếp mã nguồn của chúng**.

Có thể hiểu Decorator giống như một lớp "bọc" (wrapper) xung quanh đối tượng.

Ví dụ:

Thay vì sửa trực tiếp hàm

```typescript
login()
```

ta có thể dùng Decorator để:

- Ghi log
- Kiểm tra quyền
- Validate dữ liệu
- Cache kết quả
- Đăng ký Dependency Injection

Trong NestJS, gần như mọi thành phần đều sử dụng Decorator.

Ví dụ:

```typescript
@Controller()

@Get()

@Post()

@Injectable()
```

---

## 💻 Syntax

### Enable Decorator

Trong `tsconfig.json`

```json
{
    "experimentalDecorators": true
}
```

---

### Class Decorator

```typescript
function Logger(target: Function) {

}
```

---

### Method Decorator

```typescript
function Log(

    target: any,

    propertyKey: string,

    descriptor: PropertyDescriptor

) {

}
```

---

## 📝 Example 1 - Class Decorator

```typescript
function Logger(target: Function) {

    console.log("Class Created");

}

@Logger
class Student {

}
```

Output

```text
Class Created
```

### Giải thích

Khi Class được khai báo, Decorator sẽ được thực thi.

Decorator nhận Class làm tham số.

---

## 📝 Example 2 - Method Decorator

```typescript
function Log(

    target: any,

    propertyKey: string,

    descriptor: PropertyDescriptor

) {

    console.log(propertyKey);

}

class User {

    @Log

    login() {

    }

}
```

Output

```text
login
```

### Giải thích

Decorator nhận tên Method thông qua `propertyKey`.

Có thể sử dụng để ghi log hoặc kiểm tra quyền truy cập.

---

## 📝 Example 3 - Decorator trong NestJS

```typescript
@Controller("users")

class UserController {

    @Get()

    getUsers() {

        return [];

    }

}
```

Output

```text
GET /users
```

### Giải thích

Đây là ví dụ phổ biến trong NestJS.

- `@Controller()` đánh dấu một Controller.
- `@Get()` ánh xạ Method với HTTP GET.

---

## ⚠️ Notes

### 1. Class Decorator

Áp dụng cho Class.

```typescript
@Logger

class User {

}
```

---

### 2. Method Decorator

Áp dụng cho Method.

```typescript
class User {

    @Log

    login() {}

}
```

---

### 3. Property Decorator

Áp dụng cho Property.

```typescript
class User {

    @Required

    username: string;

}
```

---

### 4. Parameter Decorator

Áp dụng cho tham số.

```typescript
class User {

    login(

        @Body() body: any

    ) {}

}
```

Được sử dụng rất nhiều trong NestJS.

---

### 5. Decorator Factory

Decorator có thể nhận tham số.

```typescript
function Role(role: string) {

    return function(target: any) {

    }

}
```

Ví dụ

```typescript
@Role("Admin")
```

Đây là cách hoạt động của hầu hết Decorator trong NestJS.

---

## 🌍 Real World Example

```typescript
@Injectable()

class UserService {

}
```

```typescript
@Controller("users")

class UserController {

}
```

```typescript
@Get()

findAll() {

}
```

Các Decorator trên giúp NestJS:

- Đăng ký Dependency Injection.
- Tạo Controller.
- Định nghĩa Route.

Đây là nền tảng của toàn bộ Framework NestJS.

---

## ❌ Common Mistakes

### Sai 1 - Quên bật experimentalDecorators

Sai

```json
{
}
```

Output

```text
Decorators are not valid here.
```

Đúng

```json
{

    "experimentalDecorators": true

}
```

---

### Sai 2 - Quên ký hiệu @

Sai

```typescript
Logger

class User {

}
```

Đúng

```typescript
@Logger

class User {

}
```

---

### Sai 3 - Nhầm Decorator với Function

Decorator là Function đặc biệt được gọi tự động bởi TypeScript.

Không cần gọi:

```typescript
Logger();
```

---

### Sai 4 - Lạm dụng Decorator

Decorator nên dùng để:

- Logging
- Authorization
- Validation
- Metadata

Không nên viết toàn bộ logic nghiệp vụ bên trong Decorator.

---

## 📚 Summary

- Decorator là Function đặc biệt dùng để mở rộng hành vi của Class hoặc Method.
- Decorator được áp dụng bằng ký hiệu `@`.
- Có nhiều loại Decorator: Class, Method, Property và Parameter.
- Phải bật `experimentalDecorators` trong `tsconfig.json`.
- Decorator là nền tảng của NestJS.

---

## 📝 Quiz

### Question 1

Decorator được áp dụng bằng ký hiệu nào?

A.

```text
#
```

B.

```text
@
```

C.

```text
$
```

D.

```text
&
```

**Answer: B**

**Giải thích:** Decorator luôn bắt đầu bằng `@` đặt ngay trước thứ nó gắn vào — class, phương thức, thuộc tính hoặc tham số. Ký hiệu `#` trong JavaScript hiện đại lại mang nghĩa khác hẳn: nó đánh dấu trường riêng tư của class.

---

### Question 2

Decorator nào dưới đây được sử dụng trong NestJS?

A.

```typescript
@Controller()
```

B.

```typescript
@Controller
```

C.

```typescript
@Controller[]
```

D.

```typescript
Controller()
```

**Answer: A**

**Giải thích:** Decorator thực chất là một **lời gọi hàm**, nên cần cặp ngoặc kể cả khi không truyền tham số. `@Controller` thiếu ngoặc nên chỉ tham chiếu tới hàm chứ không gọi nó, và Nest sẽ không nhận được metadata. `Controller()` thiếu `@` thì chỉ là một lời gọi hàm bình thường.
