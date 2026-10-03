---
id: javascript-async-m2-l2
course: JavaScript Nâng Cao & Async
module: Xử lý lỗi và Event Loop
title: Event Loop & Async Patterns Nâng Cao
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Event Loop & Async Patterns Nâng Cao

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững kiến trúc bên dưới của JavaScript Runtime Engine (Call Stack, Web APIs, Task Queues).
- Phân biệt sự khác biệt về độ ưu tiên giữa **Microtask Queue** (Promises, `queueMicrotask`) và **Macrotask Queue** (`setTimeout`, `setInterval`, I/O).
- Giải thích thứ tự thực thi chính xác của mã đồng bộ và mã bất đồng bộ trong mọi tình huống.
- Áp dụng kỹ thuật Polling (Thăm dò trạng thái định kỳ) để kiểm tra tiến trình tác vụ chạy ngầm trên Server.
- Xây dựng hàng đợi bất đồng bộ (Async Queue) để xử lý công việc tuần tự không gây nghẽn giao diện.

---

## 📖 Definition

### 1. Cơ chế Event Loop (Vòng lặp sự kiện) trong JavaScript
JavaScript là ngôn ngữ **đơn luồng (Single-threaded)**, nghĩa là tại một thời điểm chỉ có thể thực thi một tác vụ duy nhất trên Call Stack. Để xử lý các tác vụ bất đồng bộ mà không làm đóng băng trang web, JavaScript Runtime sử dụng kiến trúc **Event Loop** phối hợp cùng các Web APIs và hai hàng đợi:

1. **Call Stack (Hàng đống gọi hàm):** Nơi chứa các khung thực thi hàm theo cơ chế LIFO (Last In, First Out).
2. **Microtask Queue (Ưu tiên CAO):** Chứa các callback từ Promise (`.then`, `.catch`, `.finally`), `async/await`, và `queueMicrotask()`.
3. **Macrotask / Task Queue (Ưu tiên THẤP):** Chứa các callback từ `setTimeout`, `setInterval`, sự kiện DOM (Click, Scroll), `requestAnimationFrame`.

**Quy tắc bất biến của Event Loop:**
> Mỗi khi Call Stack trống rỗng:
> 1. Event Loop sẽ rút và thi hành **TOÀN BỘ các tác vụ đang có trong Microtask Queue** cho đến khi sạch hẳn.
> 2. Sau đó, Event Loop mới rút **ĐÚNG 1 tác vụ ở đầu Macrotask Queue** ra Call Stack để thi hành.
> 3. Lặp lại chu trình trên.

### 2. Async Patterns Nâng cao
- **Polling (Thăm dò định kỳ):** Kỹ thuật client liên tục gửi request theo chu kỳ để hỏi Server xem tác vụ nặng (như render video, xuất file Excel) đã hoàn tất chưa.
- **Async Queue (Hàng đợi bất đồng bộ):** Kiểm soát thứ tự thi hành của danh sách tác vụ bất đồng bộ sao cho chúng chạy nối đuôi nhau từng cái một thay vì kích hoạt ồ ạt làm treo máy chủ hoặc trình duyệt.

---

## 💻 Syntax

### Microtask vs Macrotask Setup
```javascript
console.log("Sync 1");

setTimeout(() => console.log("Macrotask"), 0);

Promise.resolve().then(() => console.log("Microtask"));

console.log("Sync 2");
```

### Async Queue Interface
```javascript
class SimpleAsyncQueue {
  #queue = [];
  #isWorking = false;

  enqueue(asyncTask) {
    this.#queue.push(asyncTask);
    this.#runNext();
  }

  async #runNext() {
    if (this.#isWorking || this.#queue.length === 0) return;
    this.#isWorking = true;
    const task = this.#queue.shift();
    await task();
    this.#isWorking = false;
    this.#runNext();
  }
}
```

---

## 📝 Example 1 - Bài toán thứ tự thực thi chuẩn mực của Event Loop

```javascript
console.log("1. Đồng bộ - Đầu");

setTimeout(() => {
  console.log("2. Macrotask - setTimeout (0ms)");
}, 0);

Promise.resolve()
  .then(() => {
    console.log("3. Microtask - Promise 1");
  })
  .then(() => {
    console.log("4. Microtask - Promise 2 (Chained)");
  });

queueMicrotask(() => {
  console.log("5. Microtask - queueMicrotask");
});

console.log("6. Đồng bộ - Cuối");
```

Output:
```text
1. Đồng bộ - Đầu
6. Đồng bộ - Cuối
3. Microtask - Promise 1
5. Microtask - queueMicrotask
4. Microtask - Promise 2 (Chained)
2. Macrotask - setTimeout (0ms)
```

**Giải thích từng bước:**
1. Code đồng bộ: In `1` và `6` ngay lập tức khi Call Stack chạy.
2. `setTimeout` đưa callback vào **Macrotask Queue**.
3. `Promise.resolve` và `queueMicrotask` đưa callback vào **Microtask Queue**.
4. Call Stack rỗng -> Event Loop vét sạch Microtask Queue trước: In `3`, `5`, rồi lọt tiếp vào chained `.then()` in `4`.
5. Khi Microtask Queue rỗng hẳn -> Event Loop mới lấy 1 tác vụ từ Macrotask Queue: In `2`.

---

## 📝 Example 2 - Kỹ thuật Polling thăm dò trạng thái công việc từ Server

```javascript
// Giả lập API kiểm tra trạng thái render video ngầm
let progress = 0;
async function checkJobStatus(jobId) {
  progress += 40;
  if (progress >= 100) {
    return { status: "COMPLETED", downloadUrl: "https://video.mp4" };
  }
  return { status: "PROCESSING", progress };
}

// Hàm Polling thăm dò trạng thái
async function pollJob(jobId, intervalMs = 500, maxAttempts = 5) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`[Thăm dò lần ${attempts}] Kiểm tra tiến độ job ${jobId}...`);
    
    const result = await checkJobStatus(jobId);

    if (result.status === "COMPLETED") {
      console.log("🎉 Tác vụ hoàn tất! Link tải:", result.downloadUrl);
      return result;
    }

    console.log(`Tiến độ hiện tại: ${result.progress}%. Chờ ${intervalMs}ms...`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error("Tác vụ quá thời gian xử lý (Timeout Polling)");
}

pollJob("JOB-991");
```

Output:
```text
[Thăm dò lần 1] Kiểm tra tiến độ job JOB-991...
Tiến độ hiện tại: 40%. Chờ 500ms...
[Thăm dò lần 2] Kiểm tra tiến độ job JOB-991...
Tiến độ hiện tại: 80%. Chờ 500ms...
[Thăm dò lần 3] Kiểm tra tiến độ job JOB-991...
🎉 Tác vụ hoàn tất! Link tải: https://video.mp4
```

---

## 📝 Example 3 - Xây dựng Async Queue xử lý các tác vụ nối đuôi nhau

```javascript
class TaskQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  pushTask(taskFn) {
    this.queue.push(taskFn);
    this.processNext();
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const currentTask = this.queue.shift();

    try {
      await currentTask();
    } catch (err) {
      console.error("Lỗi task:", err.message);
    } finally {
      this.isProcessing = false;
      this.processNext(); // Tự động lấy task tiếp theo
    }
  }
}

// Sử dụng
const q = new TaskQueue();
const createTask = (id, time) => () => new Promise(res => {
  console.log(`Bắt đầu Task ${id}`);
  setTimeout(() => {
    console.log(`---> Hoàn thành Task ${id}`);
    res();
  }, time);
});

q.pushTask(createTask(1, 400));
q.pushTask(createTask(2, 200));
q.pushTask(createTask(3, 100));
```

Output:
```text
Bắt đầu Task 1
---> Hoàn thành Task 1
Bắt đầu Task 2
---> Hoàn thành Task 2
Bắt đầu Task 3
---> Hoàn thành Task 3
```

---

## ⚠️ Notes

1. **Microtask Starvation (Nghẽn Microtask):** Nếu bạn liên tục đẩy các microtask mới vào Microtask Queue trong một vòng lặp vô tận (ví dụ: đệ quy `Promise.resolve().then(...)`), Event Loop sẽ bị kẹt mãi ở bước 1 và **không bao giờ cho Macrotask hay sự kiện giao diện (UI Render / Click) được thi hành**, làm đơ ứng dụng hoàn toàn.
2. **`setTimeout(..., 0)` không có nghĩa là chạy ngay sau 0ms:** Nó chỉ có nghĩa là callback được đẩy vào Macrotask Queue ngay sau 0ms. Nó vẫn phải chờ Call Stack rỗng VÀ toàn bộ Microtask Queue được dọn sạch trước khi tới lượt nó.

---

## ❌ Common Mistakes

### Sai 1 - Tưởng rằng `Promise` callback chạy sau `setTimeout(..., 0)`
```javascript
setTimeout(() => console.log("A"), 0);
Promise.resolve().then(() => console.log("B"));

// ❌ Đoán: A trước B vì 0ms chạy ngay
// ✅ Đúng: B xuất hiện TRƯỚC A vì B nằm trong Microtask Queue (ưu tiên cao hơn)
```

### Sai 2 - Không có điều kiện ngắt (Exit Condition) trong Polling Loop
Vòng lặp Polling bắt buộc phải có `maxAttempts` hoặc giới hạn thời gian timeout để tránh việc Client gửi HTTP Request vĩnh viễn tới Server khi tác vụ Server bị treo.

---

## 📚 Summary

- **Event Loop** điều phối thứ tự chạy giữa Call Stack, Microtask Queue và Macrotask Queue.
- **Microtask Queue** (Promise, `async/await`) luôn có độ ưu tiên cao hơn và được dọn sạch hoàn toàn trước khi Event Loop lấy 1 tác vụ từ **Macrotask Queue** (`setTimeout`).
- Kỹ thuật **Polling** giúp theo dõi tiến trình chạy ngầm bất đồng bộ trên máy chủ.
- **Async Queue** giúp giới hạn số tác vụ bất đồng bộ chạy cùng lúc, đảm bảo hệ thống mượt mà.

---

## 📝 Quiz

### Question 1
Đoạn mã sau sẽ in ra thứ tự nào trong console?
```javascript
setTimeout(() => console.log("X"), 0);
Promise.resolve().then(() => console.log("Y"));
console.log("Z");
```

A. `X`, `Y`, `Z`  
B. `Z`, `X`, `Y`  
C. `Z`, `Y`, `X`  
D. `Y`, `Z`, `X`  

**Answer: C**

---

### Question 2
Hàng đợi nào dưới đây có độ ưu tiên cao hơn và được Event Loop dọn sạch toàn bộ trước khi lấy tác vụ từ hàng đợi còn lại?

A. Macrotask Queue  
B. Microtask Queue  
C. Render Queue  
D. Input Task Queue  

**Answer: B**

---

### Question 3
Hiện tượng "Microtask Starvation" xảy ra khi nào?

A. Khi Call Stack bị tràn bộ nhớ do đệ quy vô tận  
B. Khi các microtask liên tục được đẩy vào Microtask Queue trong vòng lặp làm đơ UI và không cho Macrotask thi hành  
C. Khi trình duyệt bị ngắt kết nối mạng  
D. Khi `setTimeout` bị hoãn quá 5 giây  

**Answer: B**
