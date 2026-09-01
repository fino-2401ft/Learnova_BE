---
id: nest-m4-l3
course: NestJS
module: Advanced NestJS
title: Pipe
order: 3
difficulty: Intermediate
estimatedTime: 45
---
# Pipe

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Pipe là gì.
- Biết vai trò của Pipe trong NestJS.
- Sử dụng Built-in Pipes.
- Tạo Custom Pipe.
- Hiểu thứ tự hoạt động của Pipe trong vòng đời một Request.

---

## 📖 Definition

**Pipe** là một thành phần trong NestJS dùng để:

- Chuyển đổi (Transform) dữ liệu đầu vào.
- Kiểm tra dữ liệu (Validation) trước khi dữ liệu được truyền vào Controller.

Pipe hoạt động **sau Guard** và **trước Controller**.

Ví dụ:

Client gửi

```http
GET /users/1
```

Tham số `id` nhận được là:

```typescript
"1"
```

Nhưng Controller mong muốn:

```typescript
number
```

Pipe sẽ tự động chuyển đổi:

```typescript
"1"
↓

1
```

---

## 💻 Syntax

### Built-in Pipe

```typescript
@Get(':id')
findOne(

    @Param('id', ParseIntPipe)

    id: number,

) {

}
```

---

### Custom Pipe

```typescript
@Injectable()

class CustomPipe

implements PipeTransform {

}
```

---

## 📝 Example 1 - ParseIntPipe

```typescript
@Get(':id')

findOne(

    @Param(

        'id',

        ParseIntPipe

    )

    id: number,

) {

    return id;

}
```

Request

```http
GET /users/10
```

Response

```json
10
```

### Giải thích

Pipe chuyển:

```text
"10"

↓

10
```

Nếu không chuyển được sẽ trả về lỗi 400.

---

## 📝 Example 2 - ParseUUIDPipe

```typescript
@Get(':id')

findOne(

    @Param(

        'id',

        ParseUUIDPipe

    )

    id: string,

) {

    return id;

}
```

Request

```http
GET /users/123
```

Response

```json
400 Bad Request
```

Request

```http
GET /users/550e8400-e29b-41d4-a716-446655440000
```

Response

```json
{
    "id":"550e8400-e29b-41d4-a716-446655440000"
}
```

### Giải thích

Pipe kiểm tra dữ liệu có đúng định dạng UUID hay không.

---

## 📝 Example 3 - Custom Pipe

```typescript
@Injectable()

export class TrimPipe

implements PipeTransform {

    transform(value: string) {

        return value.trim();

    }

}
```

Controller

```typescript
@Post()

create(

    @Body(

        'name',

        TrimPipe

    )

    name: string,

) {

    return name;

}
```

Request

```json
{

    "name":"   Alice   "

}
```

Response

```json
"Alice"
```

### Giải thích

Pipe tự động loại bỏ khoảng trắng đầu và cuối chuỗi.

---

## ⚠️ Notes

### 1. Built-in Pipes

NestJS cung cấp nhiều Pipe sẵn có.

Ví dụ

- ParseIntPipe
- ParseBoolPipe
- ParseUUIDPipe
- ParseArrayPipe
- ValidationPipe
- DefaultValuePipe

---

### 2. ValidationPipe

Đây là Pipe được sử dụng nhiều nhất.

```typescript
app.useGlobalPipes(

    new ValidationPipe()

);
```

Kết hợp với:

- class-validator
- class-transformer

để kiểm tra DTO.

---

### 3. ParseIntPipe

```typescript
@Param(

    "id",

    ParseIntPipe

)
```

Chuyển

```text
string

↓

number
```

---

### 4. Custom Pipe

Muốn tạo Pipe mới cần:

```typescript
implements PipeTransform
```

và định nghĩa phương thức

```typescript
transform()
```

---

### 5. Thứ tự Request Lifecycle

```text
Request

↓

Middleware

↓

Guard

↓

Pipe

↓

Controller

↓

Service

↓

Interceptor

↓

Response
```

Pipe luôn chạy trước Controller.

---

## 🌍 Real World Example

DTO

```typescript
export class CreateUserDto {

    @IsEmail()

    email: string;

}
```

main.ts

```typescript
app.useGlobalPipes(

    new ValidationPipe()

);
```

Request

```json
{

    "email":"abc"

}
```

Response

```json
400 Bad Request
```

ValidationPipe sẽ tự động kiểm tra dữ liệu trước khi Controller được gọi.

---

## ❌ Common Mistakes

### Sai 1 - Không bật ValidationPipe

Sai

```typescript
@Post()

create(

    @Body()

    dto: CreateUserDto

){}
```

DTO sẽ không được kiểm tra.

Đúng

```typescript
app.useGlobalPipes(

    new ValidationPipe()

);
```

---

### Sai 2 - Quên implements PipeTransform

Sai

```typescript
class TrimPipe {

}
```

Đúng

```typescript
class TrimPipe

implements PipeTransform

{

}
```

---

### Sai 3 - Không return trong transform()

Sai

```typescript
transform(value){

}
```

Đúng

```typescript
transform(value){

    return value;

}
```

---

### Sai 4 - Validation trong Controller

Không nên

```typescript
if(name===""){

}
```

Nên để ValidationPipe xử lý.

---

## 📚 Summary

- Pipe dùng để Validation và Transform dữ liệu.
- Pipe chạy sau Guard và trước Controller.
- NestJS cung cấp nhiều Built-in Pipes.
- Có thể tạo Custom Pipe bằng `PipeTransform`.
- ValidationPipe là Pipe được sử dụng nhiều nhất trong NestJS.

---

## 📝 Quiz

### Question 1

Pipe chạy ở giai đoạn nào?

A.

Sau Controller

B.

Trước Middleware

C.

Sau Guard và trước Controller

D.

Sau Response

**Answer: C**

**Giải thích:** Pipe chạy ngay trước khi controller nhận tham số, sau guard. Vị trí này là có lý do: không việc gì phải kiểm tra và chuyển đổi dữ liệu cho một request rồi mới phát hiện người gọi không có quyền.


---

### Question 2

Pipe nào dùng để chuyển String thành Number?

A.

ValidationPipe

B.

ParseArrayPipe

C.

ParseIntPipe

D.

ParseUUIDPipe

**Answer: C**

**Giải thích:** `ParseIntPipe` chuyển chuỗi thành số và ném `BadRequestException` nếu không chuyển được. Cần thiết vì `@Param()` và `@Query()` luôn trả về chuỗi. `ValidationPipe` thì làm việc khác: nó kiểm tra cả một DTO dựa trên các decorator của class-validator.

