---
id: express-m2-l2
course: Express.js
module: Middleware
title: Middleware có sẵn và bên thứ ba
order: 2
difficulty: Beginner
estimatedTime: 40
---

# Middleware có sẵn và bên thứ ba

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Dùng đúng các middleware có sẵn của Express: `json`, `urlencoded`, `static`, `text`, `raw`.
- Cấu hình phục vụ file tĩnh an toàn.
- Chọn và gắn các middleware bên thứ ba phổ biến: `cors`, `helmet`, `morgan`.
- Biết những mặc định mà Express 5 đã đổi.

---

## 📖 Definition

Express đóng gói sẵn năm middleware, không cần cài thêm gói nào:

| Middleware | Việc nó làm |
|---|---|
| `express.json` | Parse body dạng JSON |
| `express.urlencoded` | Parse body từ form HTML |
| `express.static` | Phục vụ file tĩnh (ảnh, CSS, JS) |
| `express.text` | Parse body dạng văn bản thuần |
| `express.raw` | Parse body dạng `Buffer` |

Trước Express 4.16, các middleware parse body nằm ở gói riêng `body-parser` và phải cài thêm. Nhiều hướng dẫn cũ trên mạng vẫn viết `npm install body-parser` — **không cần nữa**.

Ngoài ra có hệ sinh thái middleware bên thứ ba. Ba gói gần như luôn có mặt trong ứng dụng thật:

- **`cors`** — cho phép trình duyệt ở origin khác gọi vào API.
- **`helmet`** — đặt một loạt header bảo mật.
- **`morgan`** — ghi log HTTP.

---

## ⚙️ Syntax

```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
```

### Example 1 - Parse body JSON

```javascript
// Giới hạn kích thước để chặn request cố tình gửi body khổng lồ.
app.use(express.json({ limit: '1mb' }));

app.post('/api/users', (req, res) => {
  res.json({ received: req.body });
});
```

Không có `limit`, mặc định của Express là 100kb. Với API nhận ảnh base64 thì con số đó quá nhỏ; với API chỉ nhận vài trường thì nên đặt thấp hơn nữa.

### Example 2 - Parse body từ form HTML

```javascript
app.use(express.urlencoded({ extended: true }));
```

Ở **Express 5, `extended` mặc định là `false`** (v4 mặc định `true`). Khác biệt:

- `extended: false` — parse bằng module `querystring`, chỉ hiểu dữ liệu phẳng.
- `extended: true` — parse bằng `qs`, hiểu được object lồng nhau như `user[address][city]=Hanoi`.

Muốn giữ hành vi cũ của Express 4 thì phải khai báo rõ `{ extended: true }`.

### Example 3 - Phục vụ file tĩnh

```javascript
// File trong thư mục public/ truy cập được ở đường dẫn gốc.
// public/logo.png  ->  GET /logo.png
app.use(express.static('public'));

// Thêm tiền tố cho gọn gàng:
// public/logo.png  ->  GET /static/logo.png
app.use('/static', express.static('public'));
```

Đường dẫn truyền vào `express.static()` là **tương đối so với thư mục bạn chạy `node`**, không phải so với file code. An toàn hơn thì dùng đường dẫn tuyệt đối:

```javascript
const path = require('node:path');

app.use('/static', express.static(path.join(__dirname, 'public')));
```

### Example 4 - Tuỳ chọn cho file tĩnh

```javascript
app.use(
  '/static',
  express.static(path.join(__dirname, 'public'), {
    maxAge: '7d',       // Cache-Control cho trình duyệt
    etag: true,         // cho phép phản hồi 304
    index: false,       // không tự phục vụ index.html
  }),
);
```

Ở **Express 5, tuỳ chọn `dotfiles` mặc định là `"ignore"`**. Nghĩa là file bắt đầu bằng dấu chấm không còn được phục vụ. Cần chia sẻ thư mục `.well-known` (dùng cho xác minh chứng chỉ SSL) thì phải mở riêng:

```javascript
app.use('/.well-known', express.static('public/.well-known', { dotfiles: 'allow' }));
app.use(express.static('public'));
```

### Example 5 - Middleware bên thứ ba

```bash
npm install cors helmet morgan
```

```javascript
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// helmet đặt trước để header bảo mật áp cho mọi phản hồi.
app.use(helmet());

app.use(
  cors({
    origin: 'http://localhost:5173',
    // Bắt buộc nếu frontend gửi cookie kèm request.
    credentials: true,
  }),
);

app.use(morgan('dev'));
```

Với `credentials: true`, `origin` **phải** là một origin cụ thể. Trình duyệt từ chối gửi cookie khi server trả về `Access-Control-Allow-Origin: *`.

---

## 📌 Notes

- **Thứ tự gắn middleware quyết định thứ tự chạy.** `helmet` nên đứng đầu, `morgan` đứng sớm để log được cả request lỗi.
- **`express.static` trả file trực tiếp** và không đi tiếp xuống route phía sau nếu tìm thấy file khớp.
- **Không đặt thư mục chứa mã nguồn vào `express.static`** — làm vậy là công khai toàn bộ code lẫn file cấu hình.
- `express.json()` chỉ parse khi header `Content-Type` là `application/json`. Client gửi sai header thì `req.body` vẫn `undefined`.
- Không cần cài `body-parser` từ Express 4.16 trở đi.

---

## 🌍 Real World Example

Phần khởi tạo của một API thật, xếp theo đúng thứ tự cần thiết:

```javascript
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// 1. Header bảo mật — đặt sớm nhất để áp cho mọi phản hồi, kể cả phản hồi lỗi.
app.use(helmet());

// 2. CORS — phải đứng trước route, nếu không request preflight OPTIONS sẽ bị 404.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

// 3. Log — đặt sớm để ghi được cả những request bị middleware sau từ chối.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 4. Parse body.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 5. File tĩnh, dùng đường dẫn tuyệt đối.
app.use('/static', express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// 6. Route nghiệp vụ, đặt sau cùng.
app.use('/api/courses', require('./routes/courses'));

app.listen(process.env.PORT || 3000);
```

Thứ tự này không tuỳ tiện. `cors` phải đứng trước route vì trình duyệt gửi một request `OPTIONS` thăm dò trước request thật; nếu `cors` nằm sau, request đó rơi vào nhánh 404 và trình duyệt kết luận API không cho phép truy cập.

---

## ⚠️ Common Mistakes

**Sai 1 — Vẫn cài `body-parser`**

```javascript
// KHÔNG CẦN từ Express 4.16
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// ĐÚNG
app.use(express.json());
```

**Sai 2 — Trông chờ `extended: true` là mặc định ở Express 5**

Form gửi dữ liệu lồng nhau sẽ parse sai nếu không khai báo rõ `{ extended: true }`.

**Sai 3 — Đặt `cors` sau route**

Request preflight `OPTIONS` không khớp route nào nên trả 404, và trình duyệt chặn request thật.

**Sai 4 — Dùng `origin: '*'` cùng `credentials: true`**

Trình duyệt từ chối tổ hợp này. Phải nêu origin cụ thể.

**Sai 5 — Phơi cả thư mục dự án**

```javascript
// RẤT NGUY HIỂM: lộ .env, mã nguồn, node_modules
app.use(express.static(__dirname));
```

---

## 📋 Summary

- Express có sẵn năm middleware: `json`, `urlencoded`, `static`, `text`, `raw` — không cần cài `body-parser`.
- Express 5 đổi hai mặc định: `urlencoded` thành `extended: false`, và `static` thành `dotfiles: 'ignore'`.
- `express.static` nhận đường dẫn tương đối so với thư mục chạy tiến trình — nên dùng `path.join(__dirname, ...)`.
- Ba middleware bên thứ ba gần như bắt buộc: `helmet` (bảo mật), `cors` (cho phép cross-origin), `morgan` (log).
- Thứ tự gắn quyết định hành vi: `helmet` → `cors` → `morgan` → parse body → file tĩnh → route.

---

## 📝 Quiz

### Question 1

Ở Express 5, `express.urlencoded()` gọi không kèm tuỳ chọn sẽ dùng giá trị `extended` nào?

A. `true` — giống Express 4.

B. `false`, nên dữ liệu form lồng nhau như `user[city]=Hanoi` sẽ không parse thành object lồng.

C. Không có mặc định, Express ném lỗi nếu thiếu tuỳ chọn.

D. Tuỳ theo `Content-Type` mà client gửi lên.

**Answer: B**

**Giải thích:** Express 5 đổi mặc định `extended` từ `true` sang `false`. Với `false`, module `querystring` được dùng và nó chỉ hiểu dữ liệu phẳng. Muốn giữ hành vi cũ phải khai báo rõ `express.urlencoded({ extended: true })`.

---

### Question 2

Vì sao middleware `cors` phải đặt TRƯỚC các route?

A. Vì `cors` cần đọc `req.body`, mà body chỉ có sau khi route chạy.

B. Vì trình duyệt gửi một request `OPTIONS` thăm dò trước; nếu `cors` nằm sau route thì request đó rơi vào 404 và trình duyệt chặn request thật.

C. Vì `cors` ghi đè `res.json()` nên phải chạy trước khi route dùng tới.

D. Không bắt buộc — đặt ở đâu cũng như nhau.

**Answer: B**

**Giải thích:** Với các request cross-origin không đơn giản, trình duyệt gửi trước một preflight `OPTIONS`. Middleware `cors` chịu trách nhiệm trả lời request này. Đặt nó sau route thì `OPTIONS` không khớp route nào, nhận 404, và trình duyệt kết luận server không cho phép cross-origin.
