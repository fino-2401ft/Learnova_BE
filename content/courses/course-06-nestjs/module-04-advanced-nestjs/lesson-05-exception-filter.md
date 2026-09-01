---
id: nest-m4-l5
course: NestJS
module: Advanced NestJS
title: Exception Filter
order: 5
difficulty: Intermediate
estimatedTime: 40
---
# Exception Filter

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Exception Filter là gì.
- Biết khi nào nên sử dụng Exception Filter.
- Tạo Custom Exception Filter.
- Áp dụng Global Exception Filter.
- Chuẩn hóa định dạng lỗi trả về cho Client.

---

## 📖 Definition

Trong quá trình xử lý Request, ứng dụng có thể phát sinh nhiều loại lỗi như:

- Không tìm thấy dữ liệu.
- Người dùng không có quyền truy cập.
- Dữ liệu gửi lên không hợp lệ.
- Lỗi hệ thống.

Nếu không xử lý, NestJS sẽ trả về thông báo lỗi mặc định.

**Exception Filter** cho phép bắt các Exception và tùy chỉnh Response trước khi trả về Client.

Exception Filter là lớp xử lý lỗi tập trung của NestJS.

---

## 💻 Syntax

### Create Exception Filter

```typescript
@Catch()

export class AllExceptionsFilter

implements ExceptionFilter {

}
```

---

### Apply Exception Filter

```typescript
@UseFilters(

    AllExceptionsFilter

)
```

---

## 📝 Example 1 - Throw Exception

```typescript
@Get()

findOne() {

    throw new NotFoundException(

        "User not found"

    );

}
```

Response

```json
{
    "statusCode":404,
    "message":"User not found",
    "error":"Not Found"
}
```

### Giải thích

NestJS cung cấp nhiều Exception có sẵn.

Ví dụ:

- NotFoundException
- BadRequestException
- UnauthorizedException
- ForbiddenException

---

## 📝 Example 2 - Custom Exception Filter

```typescript
@Catch()

export class AllExceptionsFilter

implements ExceptionFilter {

    catch(

        exception: any,

        host: ArgumentsHost

    ) {

        const ctx = host.switchToHttp();

        const response = ctx.getResponse();

        response.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

}
```

Response

```json
{
    "success": false,
    "message": "Internal Server Error"
}
```

### Giải thích

Filter bắt mọi Exception và trả về định dạng lỗi thống nhất.

---

## 📝 Example 3 - Global Exception Filter

```typescript
async function bootstrap() {

    const app =

    await NestFactory.create(AppModule);

    app.useGlobalFilters(

        new AllExceptionsFilter()

    );

    await app.listen(3000);

}
```

### Giải thích

Khi đăng ký Global Filter, mọi Exception trong ứng dụng đều được xử lý bởi Filter này.

---

## ⚠️ Notes

### 1. Built-in Exceptions

NestJS cung cấp nhiều Exception.

Ví dụ

```typescript
BadRequestException

UnauthorizedException

ForbiddenException

NotFoundException

ConflictException

InternalServerErrorException
```

---

### 2. @Catch()

Decorator `@Catch()` dùng để đánh dấu một Exception Filter.

Có thể chỉ định loại Exception cần bắt.

Ví dụ

```typescript
@Catch(

    NotFoundException

)
```

---

### 3. ExceptionFilter

Muốn tạo Filter cần:

```typescript
implements ExceptionFilter
```

và triển khai phương thức

```typescript
catch()
```

---

### 4. Global Filter

```typescript
app.useGlobalFilters(...)
```

Giúp toàn bộ API trả về cùng một định dạng lỗi.

---

### 5. Exception trong Service

Thông thường Exception được throw trong Service.

Ví dụ

```typescript
throw new NotFoundException(

    "User not found"

);
```

Filter sẽ tự động xử lý.

---

## 🌍 Real World Example

Một API tìm người dùng.

```typescript
const user =

await this.userService.findById(id);

if (!user) {

    throw new NotFoundException(

        "User not found"

    );

}
```

Response mặc định

```json
{
    "statusCode":404,
    "message":"User not found"
}
```

Nếu sử dụng Global Exception Filter

```json
{
    "success": false,
    "statusCode": 404,
    "message": "User not found",
    "timestamp": "2026-08-03T10:30:00Z"
}
```

Toàn bộ API sẽ có định dạng lỗi thống nhất.

---

## ❌ Common Mistakes

### Sai 1 - Dùng try...catch trong mọi Controller

Sai

```typescript
try {

}
catch {

}
```

Nên throw Exception và để Filter xử lý.

---

### Sai 2 - Không implements ExceptionFilter

Sai

```typescript
class MyFilter {

}
```

Đúng

```typescript
class MyFilter

implements ExceptionFilter

{

}
```

---

### Sai 3 - Không đăng ký Filter

Nếu không dùng

```typescript
@UseFilters()
```

hoặc

```typescript
app.useGlobalFilters()
```

Filter sẽ không hoạt động.

---

### Sai 4 - Trả về quá nhiều thông tin lỗi

Không nên trả về:

- Stack Trace
- SQL Query
- Password
- Secret Key

Nên chỉ trả về thông tin cần thiết cho Client.

---

## 📚 Summary

- Exception Filter dùng để xử lý lỗi trong NestJS.
- Được tạo bằng cách implements `ExceptionFilter`.
- Phương thức quan trọng là `catch()`.
- Có thể áp dụng cho Route, Controller hoặc toàn bộ ứng dụng.
- Global Exception Filter giúp chuẩn hóa Response khi xảy ra lỗi.

---

## 📝 Quiz

### Question 1

Decorator nào dùng để khai báo Exception Filter?

A.

```typescript
@Filter()
```

B.

```typescript
@Catch()
```

C.

```typescript
@Exception()
```

D.

```typescript
@UseException()
```

**Answer: B**

**Giải thích:** `@Catch()` khai báo filter và nêu loại exception nó bắt: `@Catch(HttpException)` chỉ bắt HTTP exception, còn `@Catch()` để trống thì bắt tất cả. Lưu ý thứ tự đăng ký filter toàn cục bị Nest duyệt **ngược**, nên filter hẹp nhất phải đăng ký sau cùng.


---

### Question 2

Phương thức bắt buộc phải triển khai trong Exception Filter là?

A.

```typescript
handle()
```

B.

```typescript
execute()
```

C.

```typescript
catch()
```

D.

```typescript
filter()
```

**Answer: C**

**Giải thích:** `catch(exception, host)` là phương thức bắt buộc của interface `ExceptionFilter`. `host` là `ArgumentsHost`, từ đó lấy ra được `request` và `response` — cần thiết vì cùng một filter có thể phục vụ cả HTTP, WebSocket và microservice.

