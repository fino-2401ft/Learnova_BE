---
id: node-m3-l1
course: Node.js
module: Asynchronous Programming
title: Callback
order: 1
difficulty: Beginner
estimatedTime: 40
---
# Callback

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Callback là gì.
- Biết cách truyền hàm làm tham số.
- Hiểu cách Callback hoạt động trong Node.js.
- Phân biệt synchronous callback và asynchronous callback.
- Nhận biết Callback Hell và hạn chế của Callback.

---

## 📖 Definition

**Callback** là một hàm được truyền vào một hàm khác dưới dạng tham số và sẽ được gọi sau khi một tác vụ hoàn thành.

Callback là nền tảng của lập trình bất đồng bộ trong Node.js.

Ví dụ, khi đọc một tệp hoặc gửi yêu cầu HTTP, Node.js không chờ tác vụ hoàn thành mà tiếp tục thực hiện các công việc khác. Khi tác vụ kết thúc, callback sẽ được gọi.

---

## 💻 Syntax

### Callback cơ bản

```javascript
function greet(name, callback) {

    console.log("Hello " + name);

    callback();

}

function finish() {

    console.log("Finished.");

}

greet("Alice", finish);
```

Output

```text
Hello Alice
Finished.
```

---

### Callback bất đồng bộ

```javascript
setTimeout(() => {

    console.log("Task completed.");

}, 1000);
```

---

## 📝 Example 1 - Callback đơn giản

```javascript
function calculate(a, b, callback) {

    const result = a + b;

    callback(result);

}

calculate(5, 3, function(result) {

    console.log(result);

});
```

Output

```text
8
```

### Giải thích

Hàm `calculate()` không tự hiển thị kết quả.

Nó truyền kết quả cho callback để xử lý tiếp.

---

## 📝 Example 2 - Callback với File System

```javascript
const fs = require("fs");

fs.readFile("message.txt", "utf8", (err, data) => {

    if (err) {

        console.log(err);

        return;

    }

    console.log(data);

});
```

Output

```text
Hello Node.js
```

### Giải thích

Trong khi Node.js đọc file, chương trình vẫn có thể thực hiện các tác vụ khác.

Sau khi đọc xong, callback sẽ được gọi.

---

## 📝 Example 3 - Callback bất đồng bộ

```javascript
console.log("Start");

setTimeout(() => {

    console.log("Task completed");

}, 2000);

console.log("End");
```

Output

```text
Start
End
Task completed
```

### Giải thích

`setTimeout()` hoạt động bất đồng bộ.

Callback chỉ được thực thi sau khi thời gian chờ kết thúc và Event Loop đưa callback vào Call Stack.

---

## ⚠️ Notes

### 1. Callback là một hàm

Ví dụ:

```javascript
function hello() {

    console.log("Hello");

}
```

Có thể truyền hàm này vào một hàm khác.

---

### 2. Callback đồng bộ

```javascript
array.forEach(function(item) {

    console.log(item);

});
```

Callback được gọi ngay trong quá trình thực thi.

---

### 3. Callback bất đồng bộ

```javascript
setTimeout(() => {

    console.log("Done");

}, 1000);
```

Callback được gọi sau khi tác vụ hoàn thành.

---

### 4. Error-first Callback

Trong Node.js, callback thường có dạng:

```javascript
function(err, data) {

}
```

Ví dụ:

```javascript
fs.readFile("file.txt", "utf8", (err, data) => {

    if (err) {

        console.log(err);

        return;

    }

    console.log(data);

});
```

Đối số đầu tiên luôn là lỗi (`err`).

Nếu không có lỗi thì `err` sẽ bằng `null`.

---

### 5. Callback Hell

Khi nhiều callback lồng nhau:

```javascript
task1(() => {

    task2(() => {

        task3(() => {

            task4(() => {

            });

        });

    });

});
```

Mã nguồn sẽ khó đọc và khó bảo trì.

Đây là lý do Promise và Async/Await được ra đời.

---

## 🌍 Real World Example

Đọc file rồi xử lý dữ liệu:

```javascript
const fs = require("fs");

fs.readFile("users.json", "utf8", (err, data) => {

    if (err) {

        console.log(err);

        return;

    }

    console.log("Read successful.");

    console.log(data);

});
```

Các API của Node.js như:

- File System
- HTTP
- Database Driver
- Network

đều sử dụng callback để xử lý các tác vụ bất đồng bộ.

---

## ❌ Common Mistakes

### Sai 1 - Gọi callback ngay lập tức

Sai

```javascript
calculate(5, 3, finish());
```

Đúng

```javascript
calculate(5, 3, finish);
```

Cần truyền tham chiếu của hàm, không phải kết quả thực thi của hàm.

---

### Sai 2 - Không xử lý lỗi

Sai

```javascript
fs.readFile("file.txt", "utf8", (err, data) => {

    console.log(data);

});
```

Đúng

```javascript
if (err) {

    console.log(err);

    return;

}
```

---

### Sai 3 - Callback Hell

Sai

```javascript
task1(() => {

    task2(() => {

        task3(() => {

            task4(() => {

            });

        });

    });

});
```

Nên sử dụng Promise hoặc Async/Await khi chuỗi callback quá dài.

---

### Sai 4 - Nhầm Callback với Return

Callback không trả kết quả ngay lập tức.

Giá trị sẽ được xử lý khi callback được gọi.

---

## 📚 Summary

- Callback là một hàm được truyền vào hàm khác.
- Callback được sử dụng rộng rãi trong Node.js.
- Callback giúp xử lý các tác vụ bất đồng bộ.
- Error-first Callback là quy ước phổ biến trong Node.js.
- Callback Hell làm mã nguồn khó đọc và là lý do xuất hiện Promise và Async/Await.

---

## 📝 Quiz

### Question 1

Callback là gì?

A.

```text
Một biến toàn cục
```

B.

```text
Một hàm được truyền làm tham số cho hàm khác
```

C.

```text
Một đối tượng trong Node.js
```

D.

```text
Một package của npm
```

**Answer: B**

**Giải thích:** Callback chỉ đơn giản là một hàm được truyền cho hàm khác để gọi lại sau. Nó không phải khái niệm riêng của Node — mọi chỗ dùng `arr.map(fn)` cũng là callback.


---

### Question 2

Trong Error-first Callback của Node.js, tham số đầu tiên thường là gì?

A.

```text
result
```

B.

```text
callback
```

C.

```text
err
```

D.

```text
response
```

**Answer: C**

**Giải thích:** Quy ước error-first của Node: tham số đầu là lỗi, các tham số sau mới là kết quả. Nếu không có lỗi thì tham số đó là `null`. Nhờ quy ước này mà mọi API callback trong Node dùng chung một cách xử lý lỗi, và cũng nhờ nó mà `util.promisify` chuyển được chúng sang Promise một cách tự động.

