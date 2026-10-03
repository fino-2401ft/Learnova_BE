---
id: javascript-async-m1-l2
course: JavaScript Nâng Cao & Async
module: Closure và bất đồng bộ
title: Promises
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Promises

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu hạn chế của Callback Hell và cơ chế hoạt động bất đồng bộ trong JavaScript.
- Nắm vững 3 trạng thái của một Promise (`Pending`, `Fulfilled`, `Rejected`).
- Tạo và làm chủ chuỗi xử lý Promise Chaining với `.then()`, `.catch()`, `.finally()`.
- Sử dụng thành thạo các Promise Combinators: `Promise.all`, `Promise.allSettled`, `Promise.race`, `Promise.any`.
- Xử lý bài toán Timeout và xử lý lỗi đồng bộ/bất đồng bộ hiệu quả.

---

## 📖 Definition

### 1. Vấn đề Callback Hell
Trước khi ES6 ra đời, lập trình bất đồng bộ trong JS dựa vào các hàm Callback truyền lồng vào nhau. Khi dự án mở rộng, việc lồng quá nhiều callback tạo ra hiện tượng **Callback Hell** (hay "Pyramid of Doom"), khiến mã nguồn cực kỳ khó đọc, khó bảo trì và dễ bỏ sót việc bắt lỗi.

### 2. Promise là gì?
**Promise** là một đối tượng đại diện cho kết quả hoàn thành (hoặc thất bại) của một tác vụ bất đồng bộ trong tương lai.

Một Promise luôn nằm ở một trong 3 trạng thái duy nhất:
- **Pending (Đang chờ):** Trạng thái ban đầu khi tác vụ bất đồng bộ đang thực thi.
- **Fulfilled (Thành công):** Tác vụ thực thi thành công, hàm `resolve(value)` được gọi.
- **Rejected (Thất bại):** Tác vụ thất bại hoặc gặp lỗi, hàm `reject(error)` được gọi.

### 3. Promise Combinators (Điều phối nhiều Promise)
- **`Promise.all([p1, p2])`:** Chạy tất cả song song. Trả về mảng kết quả khi **TẤT CẢ** đều thành công. Nếu chỉ cần **1 Promise thất bại**, toàn bộ `Promise.all` sẽ ngắt và ném lỗi ngay (Fail-fast).
- **`Promise.allSettled([p1, p2])`:** Chạy tất cả song song. Luôn chờ tất cả hoàn thành (dù thành công hay thất bại) và trả về mảng báo cáo trạng thái chi tiết của từng Promise.
- **`Promise.race([p1, p2])`:** Trả về kết quả của Promise nào **hoàn thành sớm nhất** (dù resolve hay reject).
- **`Promise.any([p1, p2])`:** Trả về Promise đầu tiên **thành công**. Chỉ reject khi tất cả đều thất bại.

---

## 💻 Syntax

### Khởi tạo Promise
```javascript
const myPromise = new Promise((resolve, reject) => {
  const isSuccess = true;
  if (isSuccess) {
    resolve("Dữ liệu trả về thành công");
  } else {
    reject(new Error("Lỗi kết nối mạng"));
  }
});
```

### Promise Chaining
```javascript
myPromise
  .then((data) => {
    return processData(data); // Trả về giá trị hoặc 1 Promise mới
  })
  .then((processed) => console.log(processed))
  .catch((error) => console.error(error.message))
  .finally(() => hideLoadingSpinner());
```

### Promise Combinators
```javascript
const [res1, res2] = await Promise.all([fetchA(), fetchB()]);
const results = await Promise.allSettled([fetchA(), fetchB()]);
```

---

## 📝 Example 1 - Chuyển đổi từ Callback sang Promise và Promise Chaining

```javascript
// Giả lập API lấy dữ liệu theo từng bước
function fetchUser(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userId > 0) {
        resolve({ id: userId, username: "longtran" });
      } else {
        reject(new Error("User ID không hợp lệ!"));
      }
    }, 300);
  });
}

function fetchUserOrders(username) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { orderId: "ORD-1", total: 500000 },
        { orderId: "ORD-2", total: 350000 }
      ]);
    }, 300);
  });
}

// Chaining Promise chuyên nghiệp
fetchUser(1)
  .then((user) => {
    console.log("1. Tìm thấy user:", user.username);
    return fetchUserOrders(user.username); // Return promise tiếp theo
  })
  .then((orders) => {
    console.log("2. Đã lấy danh sách đơn hàng:", orders.length, "đơn");
  })
  .catch((err) => {
    console.error("Xảy ra lỗi trong chuỗi xử lý:", err.message);
  })
  .finally(() => {
    console.log("3. Hoàn tất quy trình.");
  });
```

Output:
```text
1. Tìm thấy user: longtran
2. Đã lấy danh sách đơn hàng: 2 đơn
3. Hoàn tất quy trình.
```

---

## 📝 Example 2 - Tải dữ liệu song song với `Promise.all` vs `Promise.allSettled`

```javascript
const apiSuccess1 = () => new Promise(res => setTimeout(() => res("Data 1"), 200));
const apiFail = () => new Promise((_, rej) => setTimeout(() => rej(new Error("Lỗi API 2")), 100));
const apiSuccess3 = () => new Promise(res => setTimeout(() => res("Data 3"), 300));

// 1. Thử với Promise.all (Sẽ ngắt ngay khi apiFail ném lỗi)
Promise.all([apiSuccess1(), apiFail(), apiSuccess3()])
  .then(res => console.log("Promise.all success:", res))
  .catch(err => console.log("Promise.all bị ném lỗi:", err.message));

// 2. Thử với Promise.allSettled (Vẫn chạy hết và tổng hợp kết quả)
Promise.allSettled([apiSuccess1(), apiFail(), apiSuccess3()])
  .then(results => {
    console.log("--- Promise.allSettled Results ---");
    results.forEach((item, index) => {
      if (item.status === "fulfilled") {
        console.log(`Task ${index + 1}: Thành công ->`, item.value);
      } else {
        console.log(`Task ${index + 1}: Thất bại ->`, item.reason.message);
      }
    });
  });
```

Output:
```text
Promise.all bị ném lỗi: Lỗi API 2
--- Promise.allSettled Results ---
Task 1: Thành công -> Data 1
Task 2: Thất bại -> Lỗi API 2
Task 3: Thành công -> Data 3
```

---

## 📝 Example 3 - Tạo cơ chế Timeout cho Request với `Promise.race`

```javascript
function fetchWithTimeout(fetchPromise, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request bị quá giờ (Timeout) sau ${timeoutMs}ms!`));
    }, timeoutMs);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

// Giả lập API response mất 2000ms
const slowApi = new Promise(resolve => setTimeout(() => resolve("Dữ liệu phản hồi"), 2000));

// Đặt timeout chỉ 1000ms
fetchWithTimeout(slowApi, 1000)
  .then(data => console.log("Nhận dữ liệu:", data))
  .catch(err => console.error("Lỗi:", err.message));
```

Output:
```text
Lỗi: Request bị quá giờ (Timeout) sau 1000ms!
```

---

## ⚠️ Notes

1. **Quên `return` trong `.then()` chain:** Nếu bạn quên `return` một giá trị hoặc một Promise mới bên trong callback của `.then()`, hàm `.then()` tiếp theo sẽ lập tức nhận giá trị `undefined`.
2. **Luôn có `.catch()` ở cuối chuỗi:** Nếu một Promise bị `reject` mà không có hàm `.catch()` bắt lỗi, trình duyệt/Node.js sẽ cảnh báo lỗi `UnhandledPromiseRejectionWarning`.
3. **Promise thực thi NGAY KHI khởi tạo:** Constructor `new Promise((resolve, reject) => { ... })` chạy **đồng bộ ngay lập tức** khi được khởi tạo, chứ không chờ đến khi gọi `.then()`.

---

## ❌ Common Mistakes

### Sai 1 - Tạo "Callback Hell" ngay trong Promise!
```javascript
// ❌ Sai: Viết lồng .then() như callback hell
fetchUser(1).then(user => {
  fetchOrders(user).then(orders => {
    fetchDetail(orders[0]).then(detail => {});
  });
});

// ✅ Đúng: Trả về Promise và Flatten chain
fetchUser(1)
  .then(user => fetchOrders(user))
  .then(orders => fetchDetail(orders[0]))
  .then(detail => {});
```

### Sai 2 - Dùng `Promise.all` cho các tác vụ không độc lập
Nếu API 2 cần dữ liệu đầu ra của API 1, bạn không thể dùng `Promise.all`. Chỉ dùng `Promise.all` khi các tác vụ **hoàn toàn độc lập** và có thể chạy song song.

---

## 📚 Summary

- **Promise** giúp giải quyết triệt để sự phức tạp của Callback Hell.
- Một Promise có 3 trạng thái: `Pending`, `Fulfilled`, `Rejected`.
- Dùng `.then()` để nối chuỗi tác vụ, `.catch()` để bắt lỗi tập trung ở cuối chuỗi.
- Sử dụng `Promise.all` khi muốn tải dữ liệu song song (fail-fast), hoặc `Promise.allSettled` khi muốn lấy đầy đủ trạng thái của mọi request.

---

## 📝 Quiz

### Question 1
Điều gì xảy ra nếu 1 trong số 5 Promises truyền vào `Promise.all()` bị `reject`?

A. 4 Promises còn lại vẫn trả về kết quả bình thường  
B. Toàn bộ `Promise.all()` bị reject ngay lập tức với lỗi của Promise đó  
C. `Promise.all()` sẽ bỏ qua lỗi và trả về mảng chứa 4 kết quả  
D. Trình duyệt bị đơ  

**Answer: B**

---

### Question 2
Trạng thái ban đầu của một Promise mới vừa được khởi tạo là gì?

A. `Fulfilled`  
B. `Resolved`  
C. `Pending`  
D. `Rejected`  

**Answer: C**

---

### Question 3
Phương thức Combinator nào chờ tất cả các Promise hoàn thành (dù thành công hay thất bại) và trả về mảng báo cáo trạng thái từng tác vụ?

A. `Promise.all()`  
B. `Promise.race()`  
C. `Promise.allSettled()`  
D. `Promise.any()`  

**Answer: C**
