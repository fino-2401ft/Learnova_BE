---
id: auth-m3-l4
course: Authentication & Security
module: Security Best Practices
title: Environment Variables
order: 4
difficulty: Intermediate
estimatedTime: 40
---
# Environment Variables

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Environment Variables là gì.
- Biết tại sao không nên Hard-code thông tin nhạy cảm.
- Sử dụng file `.env` trong NestJS.
- Cấu hình `ConfigModule` và `ConfigService`.
- Áp dụng Best Practices khi quản lý cấu hình.

---

## 📖 Definition

Trong một ứng dụng thực tế, có rất nhiều thông tin cấu hình như:

- Database URL
- JWT Secret
- API Key
- SMTP Password
- Redis URL

Nếu ghi trực tiếp các giá trị này vào source code (Hard-code), ứng dụng sẽ gặp nhiều rủi ro:

- Lộ thông tin khi đẩy code lên GitHub.
- Khó thay đổi khi triển khai sang môi trường khác.
- Không đảm bảo tính bảo mật.

Để giải quyết vấn đề này, chúng ta sử dụng **Environment Variables**.

Environment Variables là các biến cấu hình được lưu bên ngoài source code và được nạp khi ứng dụng khởi động.

---

## 💻 Syntax

### File `.env`

```env
PORT=3000

DATABASE_URL=postgresql://user:password@localhost:5432/course_db

JWT_SECRET=my_super_secret_key

JWT_EXPIRES_IN=1h
```

---

### Cài đặt Config Module

```bash
npm install @nestjs/config
```

---

### Import ConfigModule

```typescript
import { ConfigModule } from "@nestjs/config";

@Module({

    imports: [

        ConfigModule.forRoot({

            isGlobal: true

        })

    ]

})
export class AppModule {}
```

---

### Sử dụng ConfigService

```typescript
constructor(

    private configService: ConfigService

) {}

const secret =

this.configService.get<string>(

    "JWT_SECRET"

);
```

---

## 📝 Example 1 - Read Environment Variable

File

```env
PORT=3000
```

Code

```typescript
const port =

this.configService.get<number>(

    "PORT"

);

console.log(port);
```

Output

```text
3000
```

### Giải thích

`ConfigService` đọc giá trị từ file `.env`.

---

## 📝 Example 2 - JWT Secret

File

```env
JWT_SECRET=my_secret_key
```

Code

```typescript
JwtModule.registerAsync({

    inject: [

        ConfigService

    ],

    useFactory: (

        configService: ConfigService

    ) => ({

        secret:

        configService.get(

            "JWT_SECRET"

        )

    })

});
```

Output

```text
JWT Module Configured
```

### Giải thích

Secret Key không còn được Hard-code trong source code.

---

## 📝 Example 3 - Database Configuration

File

```env
DATABASE_URL=postgresql://localhost:5432/course_db
```

Code

```typescript
const databaseUrl =

this.configService.get(

    "DATABASE_URL"

);

console.log(databaseUrl);
```

Output

```text
postgresql://localhost:5432/course_db
```

### Giải thích

Chuỗi kết nối Database được lấy từ Environment Variables thay vì ghi trực tiếp trong code.

---

## ⚠️ Notes

### 1. Không Hard-code Secret

Sai

```typescript
secret: "123456"
```

Đúng

```typescript
secret:

configService.get(

    "JWT_SECRET"

)
```

---

### 2. Không Commit File `.env`

Thêm vào `.gitignore`

```text
.env
```

Điều này giúp tránh làm lộ thông tin nhạy cảm khi đưa mã nguồn lên Git.

---

### 3. Mỗi môi trường có cấu hình riêng

Ví dụ

Development

```env
PORT=3000
```

Production

```env
PORT=8080
```

Mỗi môi trường có thể sử dụng file `.env` khác nhau.

---

### 4. ConfigModule

Nên khai báo

```typescript
isGlobal: true
```

để có thể sử dụng `ConfigService` ở mọi Module mà không cần import lại.

---

### 5. Thông tin nên lưu trong `.env`

Ví dụ

- JWT_SECRET
- DATABASE_URL
- API_KEY
- SMTP_PASSWORD
- REDIS_URL

Không nên lưu các thông tin này trong source code.

---

## 🌍 Real World Example

Một dự án NestJS.

```text
project/

│

├── src/

├── .env

├── .gitignore

└── package.json
```

File

```env
JWT_SECRET=super_secret_key

DATABASE_URL=postgresql://...

SMTP_PASSWORD=123456
```

Khi triển khai lên Production, chỉ cần thay đổi file `.env` mà không phải sửa source code.

---

## ❌ Common Mistakes

### Sai 1 - Commit `.env`

Điều này có thể làm lộ:

- Password Database
- API Key
- JWT Secret

---

### Sai 2 - Hard-code Config

Sai

```typescript
const url =

"postgres://..."
```

Đúng

```typescript
configService.get(

    "DATABASE_URL"

)
```

---

### Sai 3 - Không kiểm tra giá trị

Nếu biến môi trường không tồn tại

```text
undefined
```

Ứng dụng có thể hoạt động không đúng.

Nên kiểm tra hoặc sử dụng Validation Schema.

---

### Sai 4 - Dùng chung `.env` cho mọi môi trường

Development và Production thường có cấu hình khác nhau.

Nên sử dụng các file như:

```text
.env.development

.env.production
```

---

## 📚 Summary

- Environment Variables giúp quản lý cấu hình bên ngoài source code.
- NestJS hỗ trợ thông qua `@nestjs/config`.
- Không nên Hard-code các thông tin nhạy cảm.
- Không commit file `.env` lên Git.
- Mỗi môi trường nên có cấu hình riêng.

---

## 📝 Quiz

### Question 1

Thông tin nào nên lưu trong file `.env`?

A.

JWT Secret

B.

API Key

C.

Database URL

D.

Tất cả các đáp án trên

**Answer: D**

**Giải thích:** Mọi giá trị thay đổi theo môi trường hoặc cần giữ bí mật đều thuộc về `.env`: chuỗi kết nối database, khoá ký JWT, khoá API bên thứ ba. Kèm theo hai quy tắc: `.env` phải nằm trong `.gitignore`, và luôn có `.env.example` liệt kê đủ tên biến nhưng không có giá trị thật.


---

### Question 2

Service nào dùng để đọc Environment Variables trong NestJS?

A.

```typescript
EnvironmentService
```

B.

```typescript
ConfigService
```

C.

```typescript
VariableService
```

D.

```typescript
SettingsService
```

**Answer: B**

**Giải thích:** `ConfigService` của `@nestjs/config` đọc biến môi trường và tiêm được vào bất cứ đâu qua DI. Ưu điểm so với đọc thẳng `process.env`: kiểm tra được toàn bộ biến ngay lúc khởi động, nên thiếu biến thì ứng dụng chết ngay thay vì hỏng giữa chừng lúc đang phục vụ.

