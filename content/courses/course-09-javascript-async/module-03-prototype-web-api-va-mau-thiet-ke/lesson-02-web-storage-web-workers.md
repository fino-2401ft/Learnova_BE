---
id: javascript-async-m3-l2
course: JavaScript Nâng Cao & Async
module: Prototype, Web API và mẫu thiết kế
title: Web Storage APIs & Web Workers
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Web Storage APIs & Web Workers

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân biệt các công nghệ lưu trữ dữ liệu Client-side: **LocalStorage**, **SessionStorage**, **Cookies**, **IndexedDB**.
- Sử dụng thành thạo `localStorage` và `sessionStorage` để lưu giữ thông tin người dùng và cấu hình ứng dụng.
- Khám phá cơ sở dữ liệu NoSQL tích hợp sẵn trong trình duyệt: **IndexedDB**.
- Hiểu kiến trúc đa luồng với **Web Workers** để chạy các tác vụ nặng không làm nghẽn Main Thread UI.
- Đánh giá các khía cạnh bảo vệ an toàn dữ liệu (XSS / CSRF Attack) đối với bộ nhớ Client.

---

## 📖 Definition

### 1. Phân loại Bộ nhớ Lưu Trữ Trình Duyệt (Client Storage)
- **LocalStorage:** Lưu trữ dữ liệu dạng Key-Value dưới dạng chuỗi (String). Dữ liệu **KHÔNG bị mất đi khi đóng trình duyệt** (tồn tại vĩnh viễn cho đến khi bị xóa thủ công). Dung lượng khoảng 5MB - 10MB.
- **SessionStorage:** Tương tự LocalStorage nhưng dữ liệu **bị xóa ngay lập tức khi đóng Tab trình duyệt**.
- **Cookies:** Dung lượng nhỏ (~4KB), tự động chèn vào mọi HTTP Header gửi lên Server. Dùng thuộc tính `HttpOnly` để bảo vệ chống tấn công XSS.
- **IndexedDB:** CSDL NoSQL lưu trữ đối tượng dạng Key-Value lớn trong trình duyệt, hỗ trợ truy vấn bất đồng bộ (Transaction) và lưu dữ liệu binary (Blobs/Files) với dung lượng cực lớn.

### 2. Web Workers là gì?
JavaScript mặc định chạy trên **Main Thread (Luồng chính)** - nơi đảm nhận cả việc tính toán logic lẫn vẽ giao diện (UI Rendering). Nếu bạn thực hiện một phép tính toán tốn 5 giây trên Main Thread, trang web sẽ bị "đóng băng" (Freeze) hoàn toàn.

**Web Worker** cho phép bạn khởi tạo một luồng chạy ngầm (Background Thread) hoàn toàn tách biệt khỏi Main Thread. Bạn gửi và nhận dữ liệu giữa luồng chính và Worker thông qua cơ chế `postMessage()` và sự kiện `onmessage`.

---

## 💻 Syntax

### Storage API Syntax
```javascript
// Ghi dữ liệu (bắt buộc ép kiểu chuỗi bằng JSON.stringify)
localStorage.setItem("user_settings", JSON.stringify({ theme: "dark" }));

// Đọc dữ liệu
const settings = JSON.parse(localStorage.getItem("user_settings"));

// Xóa dữ liệu
localStorage.removeItem("user_settings");
```

### Web Worker Setup Syntax
```javascript
// Main Thread
const worker = new Worker("worker.js");
worker.postMessage({ number: 40 }); // Gửi data sang worker

worker.onmessage = (e) => {
  console.log("Kết quả từ Worker:", e.data);
};
```

---

## 📝 Example 1 - Đóng gói Utility Module cho LocalStorage an toàn

```javascript
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
      console.error(`Lỗi đọc key ${key}:`, err);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Lỗi ghi key ${key}:`, err);
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  }
};

// Sử dụng
storage.set("cart", [{ id: 1, name: "React Book" }]);
console.log(storage.get("cart"));
```

---

## 📝 Example 2 - Sử dụng Web Worker để tính toán phép toán nặng ngầm

File `worker.js`:
```javascript
// Chạy trên Background Thread độc lập
self.onmessage = function (e) {
  const num = e.data;
  console.log("[WORKER] Bắt đầu tính số Fibonacci nặng cho:", num);

  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  const result = fibonacci(num);
  // Gửi kết quả về Main Thread
  self.postMessage(result);
};
```

File `main.js`:
```javascript
const worker = new Worker("worker.js");

console.log("[MAIN] Gửi yêu cầu tính toán sang Worker...");
worker.postMessage(42); // Tính Fib(42) rất tốn CPU

worker.onmessage = function (e) {
  console.log("[MAIN] Đã nhận kết quả từ Worker:", e.data);
};

console.log("[MAIN] Giao diện vẫn phản hồi mượt mà không bị đơ!");
```

Output:
```text
[MAIN] Gửi yêu cầu tính toán sang Worker...
[MAIN] Giao diện vẫn phản hồi mượt mà không bị đơ!
[WORKER] Bắt đầu tính số Fibonacci nặng cho: 42
[MAIN] Đã nhận kết quả từ Worker: 267914296
```

---

## ⚠️ Notes

1. **Web Worker không thể truy cập DOM:** Luồng Web Worker **KHÔNG CÓ** quyền truy cập đối tượng `document`, `window` hay DOM Element. Nó chỉ làm nhiệm vụ tính toán thuần túy.
2. **Nguy cơ XSS đối với LocalStorage:** Tuyệt đối không lưu các Token bảo mật nhạy cảm (như JWT Refresh Token) vào LocalStorage vì bất kỳ đoạn mã độc XSS nào chèn vào trang cũng có thể đọc được `localStorage.getItem()`. Hãy dùng Cookie `HttpOnly`.

---

## ❌ Common Mistakes

### Sai 1 - Lưu trực tiếp Object vào LocalStorage mà không `JSON.stringify()`
```javascript
const user = { name: "A" };
localStorage.setItem("user", user); 
// ❌ Dữ liệu bị biến thành chuỗi "[object Object]" không thể đọc lại được!

// ✅ Đúng:
localStorage.setItem("user", JSON.stringify(user));
```

---

## 📚 Summary

- **LocalStorage** tồn tại vĩnh viễn; **SessionStorage** tự xóa khi đóng Tab.
- **IndexedDB** là CSDL NoSQL trong trình duyệt dùng cho dữ liệu lớn bất đồng bộ.
- **Web Workers** chạy tác vụ nặng trên luồng ngầm, giải phóng Main Thread cho UI mượt mà.

---

## 📝 Quiz

### Question 1
Sự khác biệt mấu chốt về thời gian tồn tại dữ liệu giữa `LocalStorage` và `SessionStorage` là gì?

A. LocalStorage bị xóa sau 1 giờ, SessionStorage tồn tại mãi mãi  
B. Dữ liệu SessionStorage tự động bị xóa sạch ngay khi người dùng đóng Tab trình duyệt, trong khi LocalStorage tồn tại vĩnh viễn  
C. SessionStorage lưu được nhiều dữ liệu hơn  
D. Cả hai bị xóa khi tắt máy  

**Answer: B**

---

### Question 2
Lợi ích lớn nhất của việc áp dụng Web Workers trong ứng dụng web là gì?

A. Giúp tăng tốc độ tải file CSS  
B. Thực thi các tác vụ tính toán nặng trên một luồng chạy ngầm (Background Thread) hoàn toàn tách biệt, ngăn trang web bị đơ (Freeze UI)  
C. Tự động mã hóa CSDL  
D. Thay thế hoàn toàn Fetch API  

**Answer: B**

---

### Question 3
Hạn chế quan trọng nhất của luồng Web Worker khi đang chạy ngầm là gì?

A. Không thể thực hiện phép cộng số  
B. Không có quyền truy cập trực tiếp vào đối tượng `window`, `document` hay các phần tử DOM  
C. Không thể nhận dữ liệu từ JS  
D. Chỉ chạy được trên điện thoại  

**Answer: B**
