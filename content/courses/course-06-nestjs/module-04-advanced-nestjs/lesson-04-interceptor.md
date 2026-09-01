---
id: nest-m4-l4
course: NestJS
module: Advanced NestJS
title: Interceptor
order: 4
difficulty: Intermediate
estimatedTime: 45
---
# Interceptor

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Interceptor là gì.
- Biết vị trí của Interceptor trong Request Lifecycle.
- Tạo Custom Interceptor.
- Thay đổi dữ liệu Response.
- Áp dụng Interceptor để Logging, đo thời gian thực thi và xử lý dữ liệu trả về.

---

## 📖 Definition

**Interceptor** là thành phần cho phép can thiệp **trước và sau khi Controller hoặc Route Handler được thực thi**.

Interceptor thường được sử dụng để:

- Logging
- Đo thời gian xử lý Request
- Chuyển đổi dữ liệu Response
- Cache dữ liệu
- Thống nhất định dạng Response

Khác với Middleware và Guard, Interceptor có thể xử lý **cả Request và Response**.

---

## 💻 Syntax

### Create Interceptor

```typescript
@Injectable()

export class LoggingInterceptor

implements NestInterceptor {

}
```

---

### Apply Interceptor

```typescript
@UseInterceptors(

    LoggingInterceptor

)
```

---

## 📝 Example 1 - Logging Interceptor

```typescript
@Injectable()

export class LoggingInterceptor

implements NestInterceptor {

    intercept(

        context: ExecutionContext,

        next: CallHandler

    ) {

        console.log("Before...");

        return next.handle();

    }

}
```

Controller

```typescript
@UseInterceptors(

    LoggingInterceptor

)

@Get()

findAll() {

    return [];

}
```

Output

```text
Before...
```

### Giải thích

Interceptor được thực thi trước khi Controller chạy.

---

## 📝 Example 2 - Measure Execution Time

```typescript
@Injectable()

export class TimeInterceptor

implements NestInterceptor {

    intercept(

        context: ExecutionContext,

        next: CallHandler

    ) {

        const now = Date.now();

        return next.handle().pipe(

            tap(() => {

                console.log(

                    Date.now() - now,

                    "ms"

                );

            }),

        );

    }

}
```

Output

```text
12 ms
```

### Giải thích

Interceptor ghi lại thời gian xử lý của Request.

Đây là cách thường dùng để theo dõi hiệu năng của API.

---

## 📝 Example 3 - Transform Response

```typescript
@Injectable()

export class TransformInterceptor

implements NestInterceptor {

    intercept(

        context: ExecutionContext,

        next: CallHandler

    ) {

        return next.handle().pipe(

            map(data => ({

                success: true,

                data

            })),

        );

    }

}
```

Controller

```typescript
@Get()

findAll() {

    return [

        "Alice",

        "Bob"

    ];

}
```

Response

```json
{
    "success": true,
    "data": [
        "Alice",
        "Bob"
    ]
}
```

### Giải thích

Interceptor thay đổi định dạng dữ liệu trước khi gửi về Client.

---

## ⚠️ Notes

### 1. implements NestInterceptor

Muốn tạo Interceptor cần:

```typescript
implements NestInterceptor
```

---

### 2. intercept()

Phương thức bắt buộc:

```typescript
intercept(

    context,

    next

)
```

Đây là nơi xử lý Request và Response.

---

### 3. next.handle()

```typescript
return next.handle();
```

Cho phép Request tiếp tục đến Controller.

Nếu không gọi `next.handle()`, Controller sẽ không được thực thi.

---

### 4. RxJS Operators

Interceptor thường kết hợp với RxJS.

Ví dụ:

```typescript
map()

tap()

catchError()
```

để xử lý dữ liệu trả về.

---

### 5. Global Interceptor

Có thể áp dụng cho toàn bộ ứng dụng.

```typescript
app.useGlobalInterceptors(

    new LoggingInterceptor()

);
```

Mọi Request đều đi qua Interceptor này.

---

## 🌍 Real World Example

Một API trả về:

```json
[
    {
        "id":1,
        "name":"Alice"
    }
]
```

Sử dụng Transform Interceptor:

```json
{
    "success": true,
    "message": "Success",
    "data": [
        {
            "id":1,
            "name":"Alice"
        }
    ]
}
```

Nhờ đó toàn bộ API trong hệ thống đều có cùng định dạng Response.

---

## ❌ Common Mistakes

### Sai 1 - Không gọi next.handle()

Sai

```typescript
intercept() {

}
```

Controller sẽ không được thực thi.

Đúng

```typescript
return next.handle();
```

---

### Sai 2 - Không implements NestInterceptor

Sai

```typescript
class LoggingInterceptor {

}
```

Đúng

```typescript
class LoggingInterceptor

implements NestInterceptor

{

}
```

---

### Sai 3 - Viết Business Logic trong Interceptor

Không nên

```typescript
Tạo User

Xóa User

Cập nhật Database
```

Interceptor chỉ nên xử lý:

- Logging
- Cache
- Response Mapping
- Performance
- Error Handling

Business Logic nên đặt trong Service.

---

### Sai 4 - Nhầm Interceptor với Middleware

Middleware chỉ xử lý Request.

Interceptor xử lý cả Request và Response.

---

## 📚 Summary

- Interceptor cho phép xử lý trước và sau Controller.
- Được tạo bằng cách implements `NestInterceptor`.
- Phương thức quan trọng nhất là `intercept()`.
- Có thể dùng để Logging, đo thời gian thực thi và thay đổi Response.
- Có thể đăng ký cho từng Route, Controller hoặc toàn bộ ứng dụng.

---

## 📝 Quiz

### Question 1

Interceptor có thể xử lý thành phần nào?

A.

Chỉ Request

B.

Chỉ Response

C.

Cả Request và Response

D.

Chỉ Database

**Answer: C**

**Giải thích:** Interceptor bọc quanh lời gọi controller nên chạm được cả hai đầu: sửa dữ liệu trước khi vào, và biến đổi kết quả trước khi ra. Đó là cách một `TransformInterceptor` bọc mọi phản hồi vào `{ success: true, data }` mà không controller nào phải biết.


---

### Question 2

Phương thức nào bắt buộc phải triển khai trong một Interceptor?

A.

```typescript
execute()
```

B.

```typescript
handle()
```

C.

```typescript
intercept()
```

D.

```typescript
run()
```

**Answer: C**

**Giải thích:** `intercept(context, next)` là phương thức bắt buộc. Nó phải trả về `next.handle()` — một Observable — thường kèm toán tử RxJS như `map()` để đổi kết quả hoặc `tap()` để ghi log. Quên `return` thì request treo.

