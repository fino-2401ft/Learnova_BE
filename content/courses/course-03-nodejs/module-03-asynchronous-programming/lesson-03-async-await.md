---
id: node-m3-l3
course: Node.js
module: Asynchronous Programming
title: Async/Await
order: 3
difficulty: Beginner
estimatedTime: 45
---
# Async/Await

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Async/Await là gì.
- Biết cách khai báo hàm `async`.
- Sử dụng `await` để chờ Promise.
- Xử lý lỗi bằng `try...catch`.
- So sánh Async/Await với Promise.
- Áp dụng Async/Await trong các ứng dụng Node.js.

---

## 📖 Definition

**Async/Await** là cú pháp được giới thiệu trong JavaScript để giúp viết mã bất đồng bộ dễ đọc hơn.

Async/Await được xây dựng trên **Promise**.

Thay vì sử dụng nhiều `.then()` và `.catch()`, Async/Await giúp mã nguồn trông giống như mã đồng bộ (Synchronous), từ đó dễ đọc và dễ bảo trì hơn.

Lưu ý:

- `await` chỉ được sử dụng bên trong hàm `async`.
- `await` chỉ hoạt động với Promise.

---

## 💻 Syntax

### Hàm async

```javascript
async function hello() {

    return "Hello";

}
```

---

### await

```javascript
const result = await promise;
```

---

## 📝 Example 1 - Async Function

```javascript
async function getMessage() {

    return "Hello Node.js";

}

getMessage().then(result => {

    console.log(result);

});
```

Output

```text
Hello Node.js
```

### Giải thích

Một hàm `async` luôn trả về một Promise.

Giá trị được `return` sẽ trở thành kết quả của Promise.

---

## 📝 Example 2 - await

```javascript
function fetchData() {

    return new Promise((resolve) => {

        setTimeout(() => {

            resolve("Data loaded");

        }, 2000);

    });

}

async function run() {

    const data = await fetchData();

    console.log(data);

}

run();
```

Output

```text
Data loaded
```

### Giải thích

`await` tạm dừng việc thực thi bên trong hàm `async` cho đến khi Promise hoàn thành.

---

## 📝 Example 3 - try...catch

```javascript
function login(success) {

    return new Promise((resolve, reject) => {

        if (success) {

            resolve("Login successful");

        } else {

            reject("Login failed");

        }

    });

}

async function run() {

    try {

        const result = await login(false);

        console.log(result);

    } catch (error) {

        console.log(error);

    }

}

run();
```

Output

```text
Login failed
```

### Giải thích

Khi Promise bị từ chối (Rejected), lỗi sẽ được xử lý trong khối `catch`.

---

## ⚠️ Notes

### 1. async

```javascript
async function example() {

}
```

Một hàm `async` luôn trả về Promise.

---

### 2. await

```javascript
const result = await promise;
```

Chỉ sử dụng được trong hàm `async`.

---

### 3. try...catch

```javascript
try {

    const data = await fetchData();

} catch (error) {

    console.log(error);

}
```

Đây là cách phổ biến để xử lý lỗi khi sử dụng Async/Await.

---

### 4. Async/Await và Promise

Promise

```javascript
fetchData()
    .then(data => {

        console.log(data);

    })
    .catch(error => {

        console.log(error);

    });
```

Async/Await

```javascript
try {

    const data = await fetchData();

    console.log(data);

} catch (error) {

    console.log(error);

}
```

Async/Await giúp mã nguồn ngắn gọn và dễ đọc hơn.

---

### 5. await không chặn Event Loop

`await` chỉ tạm dừng việc thực thi trong **hàm async hiện tại**.

Event Loop vẫn tiếp tục xử lý các tác vụ bất đồng bộ khác.

---

## 🌍 Real World Example

Đọc dữ liệu từ một API:

```javascript
async function getUsers() {

    const users = await fetchUsers();

    console.log(users);

}

getUsers();
```

Hoặc đọc file bằng Promise:

```javascript
const fs = require("fs").promises;

async function readFile() {

    const data = await fs.readFile("users.json", "utf8");

    console.log(data);

}

readFile();
```

Async/Await được sử dụng rộng rãi trong:

- REST API
- Database
- File System
- HTTP Request
- Cloud Services

---

## ❌ Common Mistakes

### Sai 1 - Dùng await ngoài async

Sai

```javascript
const data = await fetchData();
```

Đúng

```javascript
async function run() {

    const data = await fetchData();

}
```

---

### Sai 2 - Không xử lý lỗi

Sai

```javascript
const data = await fetchData();
```

Đúng

```javascript
try {

    const data = await fetchData();

} catch (error) {

    console.log(error);

}
```

---

### Sai 3 - await với giá trị không phải Promise

Sai

```javascript
await 100;
```

`await` nên được sử dụng với Promise để mang lại ý nghĩa trong lập trình bất đồng bộ.

---

### Sai 4 - Quên gọi hàm async

Sai

```javascript
async function run() {

    console.log("Hello");

}
```

Đúng

```javascript
run();
```

Nếu không gọi hàm, mã sẽ không được thực thi.

---

## 📚 Summary

- `async` khai báo một hàm bất đồng bộ.
- Hàm `async` luôn trả về Promise.
- `await` chờ Promise hoàn thành.
- `try...catch` được dùng để xử lý lỗi.
- Async/Await giúp mã nguồn dễ đọc hơn Promise Chain.
- Async/Await được sử dụng phổ biến trong các ứng dụng Node.js hiện đại.

---

## 📝 Quiz

### Question 1

`await` chỉ được sử dụng ở đâu?

A.

```text
Trong mọi hàm
```

B.

```text
Bên trong hàm async
```

C.

```text
Trong callback
```

D.

```text
Trong constructor
```

**Answer: B**

**Giải thích:** `await` chỉ hợp lệ bên trong hàm `async`, hoặc ở cấp cao nhất của một ES Module (top-level await). Lý do: `await` tạm dừng hàm chứa nó rồi chạy tiếp sau — chỉ hàm `async` mới có khả năng đó vì nó vốn trả về Promise.


---

### Question 2

Một hàm được khai báo bằng `async` sẽ luôn trả về gì?

A.

```text
Number
```

B.

```text
String
```

C.

```text
Promise
```

D.

```text
Boolean
```

**Answer: C**

**Giải thích:** `async` bọc giá trị trả về vào một Promise đã hoàn thành, nên `return 5` thực chất là `Promise.resolve(5)`. Hệ quả hay gặp: quên `await` khi gọi hàm `async` sẽ nhận về Promise thay vì dữ liệu, và mọi truy cập thuộc tính sau đó đều `undefined`.

