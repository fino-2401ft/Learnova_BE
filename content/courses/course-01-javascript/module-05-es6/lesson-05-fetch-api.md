---
id: js-m5-l5
course: JavaScript Fundamentals
module: ES6+
title: Fetch API
order: 5
difficulty: Intermediate
estimatedTime: 35
---

# Fetch API

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Gọi HTTP bằng `fetch` với đủ các phương thức.
- Kiểm tra `res.ok` và xử lý lỗi HTTP đúng cách.
- Gửi và nhận JSON, gửi cookie cross-origin.
- Huỷ request bằng `AbortController`.

---

## 📖 Definition

`fetch` là API chuẩn để gửi HTTP request. Nó có sẵn trong trình duyệt và trong Node.js từ phiên bản 18 — không cần cài `axios` hay `node-fetch` nữa cho những việc cơ bản.

`fetch` trả về Promise của một object `Response`. Có một điểm phải khắc cốt ghi tâm:

> **`fetch` chỉ reject khi request không tới được server.** Nhận về 404, 500 hay bất kỳ mã lỗi nào cũng vẫn là Promise fulfilled.

Lý do: xét từ góc nhìn của `fetch`, nó đã làm xong việc — gửi đi và nhận về. Việc server trả mã gì là chuyện của tầng ứng dụng. Nhưng hệ quả là **luôn phải tự kiểm tra `res.ok`**.

---

## ⚙️ Syntax

```javascript
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  credentials: 'include', // gửi cookie cross-origin
  signal: controller.signal, // để huỷ được
});

if (!res.ok) throw new Error(`HTTP ${res.status}`);

const data = await res.json();
```

### Example 1 - GET và kiểm tra lỗi

```javascript
async function getCourse(id) {
  const res = await fetch(`/api/v1/courses/${id}`);

  // BẮT BUỘC: fetch không tự ném lỗi với 404 hay 500
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}
```

`.catch(() => ({}))` phòng trường hợp server trả về HTML hoặc chuỗi rỗng — lúc đó `res.json()` sẽ ném lỗi phân tích cú pháp và che mất lỗi thật.

### Example 2 - POST với JSON

```javascript
async function createCourse(data) {
  const res = await fetch('/api/v1/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data), // PHẢI tự chuyển sang chuỗi
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return res.json();
}
```

Hai thứ hay quên: header `Content-Type` (thiếu nó thì `express.json()` bỏ qua body) và `JSON.stringify` (truyền thẳng object thì body thành `'[object Object]'`).

### Example 3 - Các kiểu đọc phản hồi

```javascript
const res = await fetch(url);

await res.json();       // phân tích JSON
await res.text();       // chuỗi thô
await res.blob();       // dữ liệu nhị phân (ảnh, file)
await res.arrayBuffer();
await res.formData();

// Chỉ đọc được MỘT lần
const a = await res.json();
const b = await res.json(); // TypeError: body stream already read

// Cần đọc hai lần thì nhân bản trước
const clone = res.clone();
```

Thông tin về phản hồi:

```javascript
res.ok;          // true nếu status trong khoảng 200-299
res.status;      // 200, 404, 500...
res.headers.get('content-type');
```

### Example 4 - Gửi cookie cross-origin

```javascript
// Mặc định fetch KHÔNG gửi cookie sang origin khác
await fetch('http://localhost:3000/api/v1/auth/refresh', {
  method: 'POST',
  credentials: 'include', // bắt buộc cho cookie httpOnly
});
```

Ba giá trị của `credentials`:

| Giá trị | Hành vi |
|---|---|
| `omit` | Không bao giờ gửi cookie |
| `same-origin` | Mặc định — chỉ gửi khi cùng origin |
| `include` | Luôn gửi, kể cả cross-origin |

Phía server phải trả về `Access-Control-Allow-Credentials: true` và `Access-Control-Allow-Origin` là một origin **cụ thể** — trình duyệt từ chối cặp `credentials: 'include'` với `Allow-Origin: *`.

### Example 5 - Huỷ request và timeout

```javascript
// Huỷ thủ công
const controller = new AbortController();

fetch('/api/slow', { signal: controller.signal })
  .then(console.log)
  .catch((error) => {
    if (error.name === 'AbortError') console.log('Đã huỷ');
    else throw error;
  });

controller.abort();

// Timeout có sẵn
await fetch('/api/slow', { signal: AbortSignal.timeout(5000) });
```

Trường hợp dùng thật: ô tìm kiếm gõ liên tục, mỗi lần gõ huỷ request trước đó.

```javascript
let currentController = null;

async function search(keyword) {
  currentController?.abort(); // huỷ request cũ
  currentController = new AbortController();

  try {
    const res = await fetch(`/api/courses?search=${encodeURIComponent(keyword)}`, {
      signal: currentController.signal,
    });
    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') return null; // bị huỷ, không phải lỗi
    throw error;
  }
}
```

Không huỷ request cũ thì phản hồi có thể về **không đúng thứ tự**: gõ "nest" rồi "nestjs", nhưng kết quả của "nest" về sau và ghi đè lên kết quả đúng.

---

## 📌 Notes

- **`fetch` có sẵn trong Node 18+**, không cần thư viện ngoài.
- **`encodeURIComponent`** cho mọi giá trị nhét vào query string.
- **Không đặt `Content-Type` khi gửi `FormData`** — trình duyệt tự đặt kèm boundary.
- **Chuyển hướng được theo tự động** theo mặc định; đổi bằng `redirect: 'manual'`.
- Thân phản hồi là stream nên chỉ đọc được một lần.

---

## 🌍 Real World Example

```javascript
/**
 * Lớp bọc quanh fetch, gom những thứ phải lặp lại ở mọi lời gọi.
 *
 * Ba việc: ghép base URL, kiểm tra res.ok, và chuẩn hoá lỗi về một hình dạng
 * duy nhất để giao diện chỉ cần xử lý một kiểu.
 */
class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function apiRequest(path, options = {}) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    // Refresh token nằm trong cookie httpOnly nên bắt buộc phải có.
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
  });

  // 204 không có thân phản hồi — gọi res.json() sẽ ném lỗi.
  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.code ?? 'UNKNOWN_ERROR',
      body?.message ?? `HTTP ${res.status}`,
    );
  }

  return body;
}

// Dùng:
const courses = await apiRequest('/courses?status=PUBLISHED');
const created = await apiRequest('/courses', {
  method: 'POST',
  body: JSON.stringify({ title: 'NestJS' }),
});
```

Chi tiết `if (res.status === 204) return null` không thừa: endpoint đăng xuất trả về 204 với thân rỗng, và `res.json()` trên thân rỗng sẽ ném `SyntaxError: Unexpected end of JSON input`.

Thứ tự spread trong `headers` cũng có chủ ý: `options.headers` đặt cuối để người gọi ghi đè được mặc định khi cần.

---

## ⚠️ Common Mistakes

**Sai 1 — Không kiểm tra `res.ok`**

```javascript
const data = await (await fetch(url)).json(); // 404 vẫn chạy tiếp, data là body lỗi
```

**Sai 2 — Quên `JSON.stringify`**

```javascript
body: data,                 // '[object Object]'
body: JSON.stringify(data), // đúng
```

**Sai 3 — Quên `Content-Type: application/json`**

Server bỏ qua body và `req.body` là `undefined`.

**Sai 4 — Quên `credentials: 'include'` cho cookie cross-origin**

Refresh token không được gửi, endpoint luôn trả 401.

**Sai 5 — Gọi `res.json()` hai lần**

Thân phản hồi là stream, chỉ đọc được một lần.

**Sai 6 — Không huỷ request cũ trong ô tìm kiếm**

Phản hồi về không đúng thứ tự và ghi đè kết quả mới bằng kết quả cũ.

---

## 📋 Summary

- `fetch` có sẵn trong trình duyệt và Node 18+; nó trả về Promise của một `Response`.
- `fetch` chỉ reject khi không kết nối được — 404 và 500 vẫn là fulfilled, nên **luôn kiểm tra `res.ok`**.
- Gửi JSON cần cả `Content-Type: application/json` lẫn `JSON.stringify`.
- Cookie cross-origin cần `credentials: 'include'`, và server phải trả origin cụ thể chứ không phải `*`.
- Thân phản hồi chỉ đọc được một lần; 204 không có thân nên đừng gọi `res.json()`.
- `AbortController` để huỷ request cũ, tránh phản hồi về sai thứ tự.

---

## 📝 Quiz

### Question 1

Đoạn code sau có vấn đề gì khi server trả về 404?

```javascript
const data = await (await fetch('/api/courses/999')).json();
console.log(data.title);
```

A. Không có vấn đề gì, `fetch` sẽ tự ném lỗi khi gặp 404.

B. `fetch` không reject với mã lỗi HTTP, nên `data` là thân phản hồi lỗi và `data.title` là `undefined` — lỗi trôi tiếp xuống dưới thay vì dừng lại.

C. `res.json()` không gọi được hai lần liên tiếp.

D. Thiếu `credentials: 'include'`.

**Answer: B**

**Giải thích:** `fetch` chỉ reject khi request không tới được server. Với 404, Promise vẫn fulfilled và `res.json()` phân tích thành công thân phản hồi lỗi. Kết quả là `data.title` bằng `undefined` và lỗi thật lộ ra ở một chỗ hoàn toàn khác, rất khó truy vết. Luôn kiểm tra `res.ok` trước.

---

### Question 2

Vì sao ô tìm kiếm nên huỷ request cũ bằng `AbortController`?

A. Để tiết kiệm băng thông là lý do duy nhất.

B. Vì phản hồi có thể về không đúng thứ tự: kết quả của từ khoá cũ về sau và ghi đè lên kết quả của từ khoá mới.

C. Vì trình duyệt chỉ cho phép một `fetch` tại một thời điểm.

D. Vì `fetch` không hoạt động khi gọi liên tiếp.

**Answer: B**

**Giải thích:** Mỗi lần gõ tạo một request riêng, và chúng chạy song song với thời gian phản hồi khác nhau. Request cho `"nest"` có thể về sau request cho `"nestjs"` và ghi đè lên kết quả đúng — người dùng thấy danh sách không khớp với thứ họ vừa gõ. Huỷ request cũ loại bỏ hẳn khả năng đó, đồng thời giảm tải cho server.
