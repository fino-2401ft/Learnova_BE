---
id: javascript-async-m1-l3
course: JavaScript Nâng Cao & Async
module: Closure và bất đồng bộ
title: Async/Await & Fetch API
order: 3
difficulty: Advanced
estimatedTime: 240
---
# Async/Await & Fetch API

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Làm chủ cú pháp **`async` / `await`** (Cú pháp làm ngọt cho Promise trong ES2017).
- Phân biệt luồng thi hành tuần tự (Sequential) và luồng thi hành song song (Parallel) khi sử dụng `await`.
- Bắt lỗi bất đồng bộ chuyên nghiệp bằng khối `try...catch...finally`.
- Sử dụng **Fetch API** để gửi các HTTP Request (`GET`, `POST`, `PUT`, `DELETE`).
- Kiểm tra thủ công trạng thái HTTP (`response.ok`, `response.status`) và hủy request với **`AbortController`**.

---

## 📖 Definition

### 1. Cú pháp `async` / `await`
`async` / `await` được giới thiệu từ ES2017 giúp viết mã xử lý bất đồng bộ theo phong cách **tương tự như mã đồng bộ (Synchronous-like code)**, giúp mã nguồn trở nên trực quan, sạch sẽ và cực kỳ dễ đọc.

- **Từ khóa `async`:** Đặt trước một định nghĩa hàm. Một hàm được đánh dấu `async` sẽ **luôn luôn trả về một Promise** (nếu trả về một giá trị thường, JS sẽ tự động bọc giá trị đó vào `Promise.resolve()`).
- **Từ khóa `await`:** Chỉ có thể sử dụng bên trong một hàm `async` (hoặc ở cấp Top-Level Module). `await` tạm dừng luồng thi hành của hàm async đó cho đến khi Promise giải quyết xong (resolve/reject) và trả về kết quả trực tiếp.

### 2. Fetch API & Cơ chế Phản hồi HTTP
`fetch()` là API tích hợp sẵn trong các trình duyệt hiện đại để thực hiện HTTP Requests:
- **Đặc điểm quan trọng của `fetch()`:** Mặc định, `fetch()` **KHÔNG tự động ném lỗi (reject)** khi máy chủ trả về các mã lỗi HTTP 4xx hoặc 5xx (như 404 Not Found hay 500 Internal Server Error). `fetch()` chỉ reject khi có lỗi mạng (Network Failure, mất kết nối, DNS error).
- Do đó, lập trình viên bắt buộc phải kiểm tra thuộc tính `response.ok` (trả về `true` nếu status code nằm trong khoảng 200-299) để chủ động xử lý lỗi.

### 3. Hủy Request với `AbortController`
Khi người dùng chuyển trang hoặc gõ từ khóa mới trước khi request cũ hoàn thành, việc tiếp tục nhận phản hồi request cũ có thể gây hiện tượng **Race Condition** hoặc **Memory Leak**. `AbortController` cho phép chủ động phát tín hiệu hủy bỏ (abort) một request đang chạy.

---

## 💻 Syntax

### Async / Await Basic Pattern
```javascript
async function loadUserData(userId) {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu:", error.message);
  } finally {
    console.log("Kết thúc request");
  }
}
```

### AbortController Pattern
```javascript
const controller = new AbortController();

fetch(url, { signal: controller.signal })
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('Fetch request đã bị hủy thành công');
    }
  });

// Hủy request khi cần
controller.abort();
```

---

## 📝 Example 1 - Phân biệt Luồng Tuần tự (Sequential) vs Song song (Parallel)

```javascript
const fakeFetch = (id, ms) => new Promise(res => setTimeout(() => res(`Item ${id}`), ms));

// 1. Chạy TUẦN TỰ (Sequential) - Chậm vì phải chờ từng dòng await
async function runSequential() {
  console.time("Tuần tự");
  const a = await fakeFetch(1, 500); // Mất 500ms
  const b = await fakeFetch(2, 500); // Mất tiếp 500ms
  console.timeEnd("Tuần tự"); // Tổng cộng ~1000ms
}

// 2. Chạy SONG SONG (Parallel) - Nhanh vì kích hoạt đồng thời
async function runParallel() {
  console.time("Song song");
  const promiseA = fakeFetch(1, 500);
  const promiseB = fakeFetch(2, 500);
  
  const [a, b] = await Promise.all([promiseA, promiseB]);
  console.timeEnd("Song song"); // Tổng cộng chỉ ~500ms
}

async function testExecution() {
  await runSequential();
  await runParallel();
}

testExecution();
```

Output:
```text
Tuần tự: 1004.25ms
Song song: 502.10ms
```

---

## 📝 Example 2 - Thực hiện CRUD full với Fetch API (`GET`, `POST`, `DELETE`)

```javascript
const BASE_URL = "https://jsonplaceholder.typicode.com/posts";

// 1. GET - Lấy danh sách bài viết
async function getPosts() {
  const res = await fetch(`${BASE_URL}?_limit=2`);
  if (!res.ok) throw new Error("Không thể lấy bài viết");
  return await res.json();
}

// 2. POST - Tạo bài viết mới
async function createPost(newPostData) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(newPostData)
  });

  if (!res.ok) throw new Error("Tạo bài viết thất bại");
  return await res.json();
}

// Chạy thử nghiệm CRUD
async function main() {
  try {
    const posts = await getPosts();
    console.log("1. Danh sách bài viết lấy về:", posts);

    const created = await createPost({ title: "Bài viết mới", body: "Nội dung...", userId: 1 });
    console.log("2. Kết quả tạo mới thành công:", created);
  } catch (err) {
    console.error("Lỗi CRUD:", err.message);
  }
}

main();
```

Output:
```text
1. Danh sách bài viết lấy về: [ { userId: 1, id: 1, title: '...', body: '...' }, ... ]
2. Kết quả tạo mới thành công: { title: 'Bài viết mới', body: 'Nội dung...', userId: 1, id: 101 }
```

---

## 📝 Example 3 - Hủy Request đang chạy bằng `AbortController`

```javascript
async function searchWithCancel() {
  const controller = new AbortController();

  // Đặt hẹn giờ tự động hủy nếu quá 100ms
  setTimeout(() => {
    controller.abort(); // Phát tín hiệu hủy
  }, 100);

  try {
    console.log("Đang gửi API request...");
    // Giả lập API lâu phản hồi (JSONPlaceholder)
    const res = await fetch("https://jsonplaceholder.typicode.com/photos", {
      signal: controller.signal
    });
    const data = await res.json();
    console.log("Lấy dữ liệu thành công:", data.length);
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn("⚠️ Request đã bị HỦY thành công do quá thời gian quy định!");
    } else {
      console.error("Lỗi khác:", err.message);
    }
  }
}

searchWithCancel();
```

Output:
```text
Đang gửi API request...
⚠️ Request đã bị HỦY thành công do quá thời gian quy định!
```

---

## ⚠️ Notes

1. **`fetch()` không throw error khi gặp HTTP 404/500:** Phải luôn kiểm tra `if (!response.ok)` trước khi thực hiện `await response.json()`.
2. **`await` đứng độc lập ngoài hàm:** Trong trình duyệt đời cũ hoặc môi trường không hỗ trợ Top-Level Await, từ khóa `await` chỉ được phép đứng trong một hàm khai báo từ khóa `async`.
3. **Chỉ gọi `response.json()` một lần duy nhất:** Stream phản hồi từ `fetch()` chỉ có thể đọc một lần. Gọi `await response.json()` lần thứ 2 trên cùng đối tượng response sẽ bị ném lỗi `TypeError: Already read`.

---

## ❌ Common Mistakes

### Sai 1 - Bỏ qua việc kiểm tra `response.ok` khi dùng `fetch()`
```javascript
const res = await fetch("/api/user/99999"); // Trả về HTTP 404 Not Found
const user = await res.json(); // ❌ Code vẫn chạy bình thường lọt xuống đây với object lỗi của backend thay vì lọt vào catch!
```

### Sai 2 - Viết `await` vô tình làm chậm ứng dụng (Waterfalling Requests)
```javascript
// ❌ Sai: 3 request độc lập nhưng lại await nối đuôi nhau làm tổng thời gian nhân 3
const users = await fetchUsers();
const products = await fetchProducts();
const categories = await fetchCategories();

// ✅ Đúng: Chạy song song
const [users, products, categories] = await Promise.all([
  fetchUsers(), fetchProducts(), fetchCategories()
]);
```

---

## 📚 Summary

- `async/await` giúp viết mã xử lý bất đồng bộ trông giống hệt mã đồng bộ, sử dụng `try...catch` để xử lý lỗi.
- `fetch()` chỉ ném lỗi khi gặp sự cố mạng. Cần kiểm tra `response.ok` để phát hiện lỗi HTTP 4xx/5xx.
- Tránh hiện tượng Waterfalling (chờ không cần thiết) bằng cách dùng `Promise.all` cho các tác vụ độc lập.
- Sử dụng `AbortController` để chủ động hủy các HTTP Request không còn cần thiết.

---

## 📝 Quiz

### Question 1
Một hàm được khai báo với từ khóa `async` sẽ luôn luôn trả về kiểu dữ liệu gì?

A. `Object`  
B. `Promise`  
C. `undefined`  
D. `String`  

**Answer: B**

---

### Question 2
Khi sử dụng `fetch()`, trường hợp nào sau đây sẽ khiến `fetch()` tự động bị `reject` và lọt vào khối `catch`?

A. Server trả về HTTP 404 Not Found  
B. Server trả về HTTP 500 Internal Server Error  
C. Trình duyệt bị ngắt kết nối mạng Internet hoàn toàn  
D. Server trả về HTTP 401 Unauthorized  

**Answer: C**

---

### Question 3
Đối tượng nào tích hợp sẵn trong JavaScript cho phép bạn chủ động phát tín hiệu hủy bỏ (abort) một `fetch()` request đang chạy?

A. `CancelToken`  
B. `AbortController`  
C. `FetchManager`  
D. `RequestCanceler`  

**Answer: B**
