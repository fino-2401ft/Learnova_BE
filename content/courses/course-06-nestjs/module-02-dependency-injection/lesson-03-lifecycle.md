---
id: nest-m2-l3
course: NestJS
module: Dependency Injection
title: Lifecycle
order: 3
difficulty: Intermediate
estimatedTime: 70
---
# Lifecycle

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Lifecycle trong NestJS là gì.
- Biết các Lifecycle Hook phổ biến.
- Sử dụng `OnModuleInit`.
- Sử dụng `OnApplicationBootstrap`.
- Sử dụng `OnModuleDestroy`.
- Áp dụng Lifecycle Hook để khởi tạo và giải phóng tài nguyên.

---

## 📖 Definition

Trong NestJS, **Lifecycle** mô tả vòng đời của ứng dụng và các Provider.

NestJS cung cấp các **Lifecycle Hook** để cho phép thực thi một đoạn mã tại những thời điểm nhất định, chẳng hạn như:

- Khi Module được khởi tạo.
- Khi ứng dụng khởi động.
- Khi ứng dụng kết thúc.
- Khi Module bị hủy.

Lifecycle Hook thường được sử dụng để:

- Kết nối Database.
- Khởi tạo Cache.
- Đọc cấu hình.
- Giải phóng tài nguyên.
- Đóng kết nối.

---

# 💻 Application Lifecycle

```text
Application Start

↓

Module Created

↓

OnModuleInit

↓

OnApplicationBootstrap

↓

Application Running

↓

Shutdown Signal

↓

OnModuleDestroy

↓

OnApplicationShutdown
```

---

# 💻 Lifecycle Interfaces

| Interface | Thời điểm thực thi |
|------------|--------------------|
| OnModuleInit | Sau khi Module được khởi tạo |
| OnApplicationBootstrap | Sau khi toàn bộ ứng dụng khởi động |
| OnModuleDestroy | Trước khi Module bị hủy |
| BeforeApplicationShutdown | Trước khi ứng dụng tắt |
| OnApplicationShutdown | Khi ứng dụng đang tắt |

---

## 📝 Example 1 - OnModuleInit

```typescript
import {

    Injectable,

    OnModuleInit

} from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit {

    onModuleInit() {

        console.log('UsersService initialized');

    }

}
```

### Giải thích

`onModuleInit()` được gọi ngay sau khi Provider được khởi tạo.

---

## 📝 Example 2 - OnApplicationBootstrap

```typescript
import {

    Injectable,

    OnApplicationBootstrap

} from '@nestjs/common';

@Injectable()
export class AppService implements OnApplicationBootstrap {

    onApplicationBootstrap() {

        console.log('Application started');

    }

}
```

### Giải thích

Hook này được gọi sau khi tất cả Module đã được khởi tạo.

---

## 📝 Example 3 - OnModuleDestroy

```typescript
import {

    Injectable,

    OnModuleDestroy

} from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleDestroy {

    async onModuleDestroy() {

        console.log('Disconnect Database');

    }

}
```

### Giải thích

Hook này thường được dùng để đóng kết nối Database hoặc giải phóng tài nguyên.

---

## 📝 Example 4 - OnApplicationShutdown

```typescript
import {

    Injectable,

    OnApplicationShutdown

} from '@nestjs/common';

@Injectable()
export class AppService implements OnApplicationShutdown {

    onApplicationShutdown() {

        console.log('Application shutdown');

    }

}
```

### Giải thích

Được gọi khi ứng dụng nhận tín hiệu tắt như `SIGINT` hoặc `SIGTERM`.

---

## 📝 Example 5 - Prisma Service

```typescript
@Injectable()
export class PrismaService

implements OnModuleInit {

    async onModuleInit() {

        console.log('Connected to Database');

    }

}
```

### Giải thích

Trong thực tế, `PrismaService` thường sử dụng Lifecycle Hook để khởi tạo kết nối tới cơ sở dữ liệu.

---

## 📝 Example 6 - Enable Shutdown Hooks

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

    const app = await NestFactory.create(AppModule);

    app.enableShutdownHooks();

    await app.listen(3000);

}

bootstrap();
```

### Giải thích

`enableShutdownHooks()` cho phép NestJS lắng nghe tín hiệu tắt ứng dụng và kích hoạt các Lifecycle Hook liên quan.

---

## ⚠️ Notes

### 1. OnModuleInit

```typescript
onModuleInit()
```

Được gọi sau khi Provider hoặc Module được khởi tạo.

---

### 2. OnApplicationBootstrap

```typescript
onApplicationBootstrap()
```

Được gọi sau khi toàn bộ ứng dụng đã sẵn sàng.

---

### 3. OnModuleDestroy

```typescript
onModuleDestroy()
```

Được gọi trước khi Module bị hủy.

---

### 4. OnApplicationShutdown

```typescript
onApplicationShutdown()
```

Được gọi khi ứng dụng đang tắt.

---

### 5. enableShutdownHooks()

Nếu không gọi:

```typescript
app.enableShutdownHooks();
```

một số Lifecycle Hook liên quan đến việc tắt ứng dụng sẽ không được kích hoạt.

---

### 6. Thời điểm sử dụng

Lifecycle Hook phù hợp để:

- Kết nối Database.
- Khởi tạo Redis.
- Tải cấu hình.
- Khởi tạo Scheduler.
- Đóng kết nối khi ứng dụng kết thúc.

---

## 🌍 Real World Example

Trong một hệ thống sử dụng Prisma:

```text
Application Start

↓

PrismaService

↓

Connect Database

↓

Application Running

↓

Shutdown

↓

Disconnect Database
```

Ví dụ:

```typescript
@Injectable()
export class PrismaService

implements

    OnModuleInit,

    OnModuleDestroy {

    async onModuleInit() {

        console.log('Database Connected');

    }

    async onModuleDestroy() {

        console.log('Database Disconnected');

    }

}
```

Lifecycle Hook giúp đảm bảo tài nguyên được khởi tạo và giải phóng đúng thời điểm.

---

## ❌ Common Mistakes

### Sai 1 - Quên implements Interface

Sai

```typescript
class UsersService {

    onModuleInit() {}

}
```

Đúng

```typescript
class UsersService

implements OnModuleInit {

    onModuleInit() {}

}
```

---

### Sai 2 - Quên enableShutdownHooks()

Nếu không bật:

```typescript
app.enableShutdownHooks();
```

các Hook khi ứng dụng tắt có thể không được gọi.

---

### Sai 3 - Đặt Business Logic vào Lifecycle Hook

Lifecycle Hook chỉ nên dùng để khởi tạo hoặc giải phóng tài nguyên, không nên xử lý nghiệp vụ.

---

### Sai 4 - Quên đóng kết nối

Nếu không đóng Database hoặc Redis khi ứng dụng tắt, có thể gây rò rỉ tài nguyên.

---

## 📚 Summary

- Lifecycle mô tả vòng đời của ứng dụng và Provider trong NestJS.
- `OnModuleInit` được gọi sau khi Module hoặc Provider khởi tạo.
- `OnApplicationBootstrap` được gọi khi ứng dụng sẵn sàng.
- `OnModuleDestroy` được gọi trước khi Module bị hủy.
- `OnApplicationShutdown` được gọi khi ứng dụng tắt.
- `enableShutdownHooks()` giúp kích hoạt các Hook liên quan đến quá trình shutdown.
- Lifecycle Hook thường được dùng để quản lý kết nối Database, Cache và các tài nguyên khác.

---

## 📝 Quiz

### Question 1

Interface nào được sử dụng để thực hiện hành động sau khi Module được khởi tạo?

A.

```typescript
OnModuleDestroy
```

B.

```typescript
OnApplicationShutdown
```

C.

```typescript
OnModuleInit
```

D.

```typescript
OnBootstrap
```

**Answer: C**

**Giải thích:** `OnModuleInit` chạy sau khi mọi phụ thuộc của module đã sẵn sàng — đúng chỗ để mở kết nối database hay nạp cache. Đừng làm việc đó trong constructor: lúc đó phụ thuộc có thể chưa được tiêm xong.


---

### Question 2

Phương thức nào cần gọi để NestJS lắng nghe tín hiệu tắt ứng dụng?

A.

```typescript
app.enableCors();
```

B.

```typescript
app.enableShutdownHooks();
```

C.

```typescript
app.listen();
```

D.

```typescript
app.close();
```

**Answer: B**

**Giải thích:** `app.enableShutdownHooks()` bắt tín hiệu `SIGTERM` và `SIGINT` để Nest chạy `onModuleDestroy` trước khi thoát. Thiếu dòng này, container bị dừng sẽ giết tiến trình ngay và kết nối database không được đóng đúng cách — mỗi lần khởi động lại lại bỏ lại một kết nối treo.

