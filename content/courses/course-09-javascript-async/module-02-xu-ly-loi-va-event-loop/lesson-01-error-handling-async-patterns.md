---
id: javascript-async-m2-l1
course: JavaScript Nâng Cao & Async
module: Xử lý lỗi và Event Loop
title: Error Handling & Async Patterns
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Error Handling & Async Patterns

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân biệt các kiểu Lỗi hệ thống trong JavaScript (`TypeError`, `ReferenceError`, `SyntaxError`).
- Thiết kế các lớp Lỗi tùy chỉnh (Custom Error Classes) kế thừa từ lớp `Error` gốc.
- Lắng nghe lỗi toàn cục bằng `window.onerror` và `unhandledrejection`.
- Xây dựng mô hình Retry Pattern (tự động thử lại khi API thất bại).
- Xây dựng tầng API Client dùng chung chuẩn mực trong các ứng dụng Frontend thực tế.

---

## 📖 Definition

### 1. Phân loại Lỗi trong JavaScript
Lỗi (Error) trong JS là các đối tượng được ném ra khi ứng dụng gặp phải sự cố không mong muốn trong quá trình thực thi:
- **`TypeError`:** Thực hiện một thao tác không hợp lệ trên kiểu dữ liệu (ví dụ: gọi hàm từ biến `null/undefined`).
- **`ReferenceError`:** Truy cập vào một biến chưa được khai báo hoặc nằm ngoài phạm vi.
- **`SyntaxError`:** Viết sai quy tắc cú pháp ngữ pháp của ngôn ngữ.

### 2. Custom Error Classes (Lớp Lỗi Tùy Chỉnh)
Trong các ứng dụng quy mô lớn, việc chỉ sử dụng một đối tượng `Error` chung chung sẽ gây khó khăn cho việc phân loại và thông báo lỗi trên giao diện.
Bằng cách xây dựng các lớp lỗi riêng biệt kế thừa từ `Error` (như `ValidationError`, `AuthError`, `NetworkError`), ta có thể gán thêm thông tin ngữ cảnh (như status code, danh sách field bị lỗi) và dùng `instanceof` để bắt đúng loại lỗi cần xử lý.

### 3. Mẫu thiết kế Retry Pattern (Tự động thử lại)
Tín hiệu mạng không ổn định có thể khiến API request thất bại tạm thời. Retry Pattern là kỹ thuật cho phép hàm tự động thử gửi lại request một số lần định trước (ví dụ 3 lần), kèm theo một khoảng hoãn (delay) tăng dần trước khi ném lỗi thất bại cuối cùng cho người dùng.

---

## 💻 Syntax

### Custom Error Class
```javascript
class CustomAppError extends Error {
  constructor(message, statusCode) {
    super(message); // Gọi constructor của Error gốc
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Retry Pattern Function
```javascript
async function fetchWithRetry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    await new Promise(res => setTimeout(res, delay));
    return fetchWithRetry(fn, retries - 1, delay * 2); // Exponential backoff
  }
}
```

---

## 📝 Example 1 - Định nghĩa và Bắt Custom Errors với `instanceof`

```javascript
// 1. Tạo các Custom Error Classes
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "NetworkError";
    this.statusCode = statusCode;
  }
}

// 2. Hàm xử lý Đăng ký tài khoản
function registerUser(data) {
  if (!data.email) {
    throw new ValidationError("Email không được để rỗng", "email");
  }
  if (data.password.length < 6) {
    throw new ValidationError("Mật khẩu phải từ 6 ký tự trở lên", "password");
  }
  // Giả lập ném lỗi mạng từ server
  throw new NetworkError("Máy chủ đăng ký đang bảo trì", 503);
}

// 3. Khối catch kiểm tra phân loại bằng instanceof
function handleFormSubmit(formData) {
  try {
    registerUser(formData);
  } catch (err) {
    if (err instanceof ValidationError) {
      console.warn(`[LỖI INPUT - Trường ${err.field}]: ${err.message}`);
    } else if (err instanceof NetworkError) {
      console.error(`[LỖI MẠNG HTTP ${err.statusCode}]: ${err.message}`);
    } else {
      console.error("[LỖI KHÔNG XÁC ĐỊNH]:", err);
    }
  }
}

handleFormSubmit({ email: "test@gmail.com", password: "123" });
handleFormSubmit({ email: "test@gmail.com", password: "123456" });
```

Output:
```text
[LỖI INPUT - Trường password]: Mật khẩu phải từ 6 ký tự trở lên
[LỖI MẠNG HTTP 503]: Máy chủ đăng ký đang bảo trì
```

---

## 📝 Example 2 - Cài đặt Retry Pattern tự động thử lại khi API thất bại

```javascript
async function fetchWithRetry(fetcherFn, maxRetries = 3, delayMs = 500) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`[Thử lần ${attempt}/${maxRetries}] Đang gọi API...`);
      return await fetcherFn();
    } catch (err) {
      console.warn(`Lần ${attempt} thất bại: ${err.message}`);
      
      if (attempt >= maxRetries) {
        throw new Error(`Đã thử ${maxRetries} lần nhưng vẫn thất bại! Lỗi cuối: ${err.message}`);
      }

      // Chờ một khoảng thời gian trước khi thử lại
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Giả lập API chập chờn: 2 lần đầu lỗi, lần thứ 3 mới thành công
let calls = 0;
const flakyApi = () => new Promise((resolve, reject) => {
  calls++;
  if (calls < 3) {
    reject(new Error("Network Lag (504 Gateway Timeout)"));
  } else {
    resolve("Dữ liệu đã nhận thành công!");
  }
});

fetchWithRetry(flakyApi, 4, 300)
  .then(res => console.log("✅ Kết quả:", res))
  .catch(err => console.error("❌ Kết cục:", err.message));
```

Output:
```text
[Thử lần 1/4] Đang gọi API...
Lần 1 thất bại: Network Lag (504 Gateway Timeout)
[Thử lần 2/4] Đang gọi API...
Lần 2 thất bại: Network Lag (504 Gateway Timeout)
[Thử lần 3/4] Đang gọi API...
✅ Kết quả: Dữ liệu đã nhận thành công!
```

---

## 📝 Example 3 - Bắt Unhandled Rejection toàn cục (Global Error Boundary)

```javascript
// Bắt tất cả các Promise bị Reject mà quên ghi .catch()
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    console.error("🚨 CẢNH BÁO TOÀN CỤC: Bắt được Unhandled Promise Rejection!");
    console.error("Lý do thất bại:", event.reason);
    
    // Ngăn hiển thị mảng màu đỏ lỗi trong Developer Console của trình duyệt
    event.preventDefault();
  });
}

// Giả lập một Promise bị ngắt nhưng lập trình viên quên ghi .catch()
Promise.reject(new Error("Lỗi kết nối CSDL bí mật!"));
```

---

## ⚠️ Notes

1. **Nhớ truyền `message` vào `super(message)`:** Khi kế thừa từ `Error`, bạn **phải** truyền chuỗi thông báo lỗi vào `super(message)` để đối tượng lỗi giữ nguyên thuộc tính `error.message` tiêu chuẩn.
2. **Tránh nuốt lỗi (Error Swallowing):** Đừng viết một khối `catch` rỗng `try { ... } catch (e) {}`. Việc "nuốt lỗi" sẽ khiến ứng dụng chạy sai logic mà không để lại bất kỳ vết tích hay log nào để bạn debug.

---

## ❌ Common Mistakes

### Sai 1 - Kiểm tra lỗi bằng `err.name` thay vì `instanceof`
```javascript
// ❌ Dễ gõ sai chuỗi tên lỗi và không hỗ trợ kế thừa
if (err.name === "ValidationError") {} 

// ✅ Đúng chuẩn OOP
if (err instanceof ValidationError) {}
```

### Sai 2 - Ném một chuỗi (String) thay vì một đối tượng `Error`
```javascript
// ❌ Không nên: Ném chuỗi thuần sẽ mất toàn bộ thông tin Stack Trace
throw "Đã xảy ra lỗi!"; 

// ✅ Nên: Luôn ném một đối tượng Error hoặc lớp kế thừa của nó
throw new Error("Đã xảy ra lỗi!");
```

---

## 📚 Summary

- Tạo Custom Error Class bằng cách kế thừa `class CustomError extends Error`.
- Dùng toán tử `instanceof` trong khối `catch` để phân loại và xử lý từng nhóm lỗi riêng biệt.
- Áp dụng **Retry Pattern** để tăng độ tin cậy khi giao tiếp với các API không ổn định.
- Đăng ký sự kiện toàn cục `unhandledrejection` để giám sát các lỗi Promise bị bỏ sót.

---

## 📝 Quiz

### Question 1
Cách nào sau đây là chuẩn mực nhất để ném một lỗi tùy chỉnh trong JavaScript để bảo toàn thông tin Stack Trace?

A. `throw "Lỗi dữ liệu"`  
B. `throw { message: "Lỗi dữ liệu" }`  
C. `throw new Error("Lỗi dữ liệu")`  
D. `return "Lỗi dữ liệu"`  

**Answer: C**

---

### Question 2
Sự kiện nào trên đối tượng `window` giúp bắt các lỗi Promise bị Reject mà không có khối `.catch()` xử lý?

A. `window.onerror`  
B. `window.unhandledrejection`  
C. `window.onpromiseerror`  
D. `window.onreject`  

**Answer: B**

---

### Question 3
Mục đích chính của việc xây dựng Custom Error Class (ví dụ: `class ValidationError extends Error`) là gì?

A. Tăng tốc độ chạy của ứng dụng  
B. Phân loại lỗi và cho phép kiểm tra loại lỗi chính xác bằng `instanceof` trong khối `catch`  
C. Tự động sửa lỗi mã nguồn  
D. Thay thế hoàn toàn khối `try...catch`  

**Answer: B**
