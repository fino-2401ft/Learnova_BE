---
id: node-m1-l2
course: Node.js
module: Node.js Fundamentals
title: Event Loop
order: 2
difficulty: Beginner
estimatedTime: 40
---
# Event Loop

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Event Loop là gì.
- Biết Node.js xử lý các tác vụ đồng bộ và bất đồng bộ.
- Hiểu Call Stack và Callback Queue.
- Hiểu vai trò của Event Loop trong Node.js.
- Phân biệt synchronous và asynchronous code.
- Đọc và dự đoán kết quả của các ví dụ về Event Loop.

---

## 📖 Definition

Node.js sử dụng mô hình **Single Thread** để thực thi mã JavaScript.

Tuy nhiên, Node.js vẫn có thể xử lý nhiều tác vụ cùng lúc nhờ **Event Loop**.

**Event Loop** là cơ chế liên tục kiểm tra:

- Call Stack còn trống hay không.
- Callback Queue có tác vụ nào đang chờ không.

Nếu Call Stack trống, Event Loop sẽ đưa callback từ Callback Queue vào Call Stack để thực thi.

Nhờ đó Node.js có thể xử lý nhiều yêu cầu mà không cần tạo nhiều luồng (thread) cho mỗi request.

---

## 💻 Syntax

### Synchronous Code

```javascript
console.log("A");

console.log("B");

console.log("C");
```

Output

```text
A
B
C
```

---

### Asynchronous Code

```javascript
console.log("Start");

setTimeout(() => {
    console.log("Timeout");
}, 1000);

console.log("End");
```

Output

```text
Start
End
Timeout
```

---

## 📝 Example 1 - Event Loop với setTimeout

```javascript
console.log("1");

setTimeout(() => {
    console.log("2");
}, 0);

console.log("3");
```

Output

```text
1
3
2
```

### Giải thích

Mặc dù `setTimeout` có thời gian là `0ms`, callback vẫn được đưa vào **Callback Queue**.

Node.js sẽ thực thi callback sau khi Call Stack rỗng.

---

## 📝 Example 2 - Callback Queue

```javascript
console.log("Start");

setTimeout(() => {
    console.log("Task 1");
}, 500);

setTimeout(() => {
    console.log("Task 2");
}, 100);

console.log("Finish");
```

Output

```text
Start
Finish
Task 2
Task 1
```

### Giải thích

Hai callback được đưa vào Callback Queue khi hết thời gian chờ.

Callback của `Task 2` hoàn thành trước nên được thực thi trước.

---

## 📝 Example 3 - Minh họa Event Loop

```javascript
console.log("A");

setTimeout(() => {
    console.log("B");
}, 0);

console.log("C");

console.log("D");
```

Output

```text
A
C
D
B
```

### Giải thích

Quá trình xử lý:

```text
Call Stack

A
↓

C
↓

D
↓

Stack rỗng

↓

Event Loop

↓

Callback Queue

↓

B
```

Event Loop chỉ đưa callback vào Call Stack khi Call Stack đã trống.

---

## ⚠️ Notes

### 1. Node.js là Single Thread

JavaScript trong Node.js chỉ chạy trên một luồng chính.

Event Loop giúp chương trình xử lý nhiều tác vụ bất đồng bộ mà không cần tạo nhiều thread cho mỗi tác vụ.

---

### 2. Call Stack

Call Stack là nơi chứa các hàm đang được thực thi.

Ví dụ:

```javascript
function hello() {
    console.log("Hello");
}

hello();
```

Khi `hello()` được gọi, hàm sẽ được đưa vào Call Stack.

---

### 3. Callback Queue

Các callback của:

- setTimeout()
- setInterval()
- Một số API bất đồng bộ

sẽ chờ trong Callback Queue.

---

### 4. Event Loop

Event Loop liên tục thực hiện các bước:

1. Kiểm tra Call Stack.
2. Nếu Stack rỗng, lấy callback từ Callback Queue.
3. Đưa callback vào Call Stack.
4. Thực thi callback.

---

### 5. Non-blocking I/O

Các tác vụ như:

- Đọc file.
- Gửi HTTP Request.
- Truy vấn Database.

không làm chương trình bị chặn trong lúc chờ kết quả.

Đây là một trong những lý do Node.js phù hợp để xây dựng các ứng dụng có nhiều kết nối đồng thời.

---

## 🌍 Real World Example

Giả sử một Web Server nhận nhiều yêu cầu từ người dùng.

```text
Client 1 ──┐
           │
Client 2 ──┤
           │
Client 3 ──┤
           ▼

      Node.js

      Event Loop

           ▼

      File System
      Database
      HTTP API

           ▼

      Response
```

Trong khi đang chờ đọc file hoặc truy vấn cơ sở dữ liệu, Node.js vẫn có thể tiếp tục xử lý các yêu cầu khác thay vì phải chờ hoàn thành từng yêu cầu.

---

## ❌ Common Mistakes

### Sai 1 - Nghĩ setTimeout(0) chạy ngay lập tức

Sai

```javascript
setTimeout(() => {
    console.log("Hello");
}, 0);
```

Đúng

Callback chỉ được thực thi khi Call Stack đã rỗng.

---

### Sai 2 - Nghĩ Node.js tạo một thread cho mỗi request

Node.js chủ yếu sử dụng Event Loop để xử lý nhiều request đồng thời.

---

### Sai 3 - Nhầm Event Loop với Callback Queue

- Callback Queue lưu các callback đang chờ.
- Event Loop quyết định khi nào callback được thực thi.

---

### Sai 4 - Nghĩ Event Loop chỉ dùng cho setTimeout()

Event Loop còn xử lý nhiều tác vụ bất đồng bộ khác như:

- Đọc file.
- HTTP Request.
- EventEmitter.
- Stream.
- Database.

---

## 📚 Summary

- Node.js sử dụng mô hình Single Thread.
- Event Loop giúp xử lý các tác vụ bất đồng bộ.
- Call Stack chứa các hàm đang thực thi.
- Callback Queue chứa các callback đang chờ.
- Event Loop chuyển callback từ Callback Queue sang Call Stack khi Stack rỗng.
- Event Loop là nền tảng giúp Node.js xử lý nhiều kết nối hiệu quả.

---

## 📝 Quiz

### Question 1

Vai trò chính của Event Loop là gì?

A.

```text
Biên dịch JavaScript
```

B.

```text
Quản lý Package
```

C.

```text
Đưa callback từ Callback Queue vào Call Stack
```

D.

```text
Tạo nhiều thread cho chương trình
```

**Answer: C**

**Giải thích:** Event Loop không tự thực thi code. Việc của nó là canh chừng: khi Call Stack trống, nó lấy callback đang chờ trong hàng đợi đẩy vào để chạy. Chính cơ chế này khiến Node xử lý được nhiều kết nối cùng lúc mà chỉ cần một luồng — nhưng cũng có nghĩa một vòng lặp đồng bộ nặng sẽ chặn đứng toàn bộ server.


---

### Question 2

Đoạn mã sau sẽ in kết quả gì?

```javascript
console.log("A");

setTimeout(() => {
    console.log("B");
}, 0);

console.log("C");
```

A.

```text
A
B
C
```

B.

```text
B
A
C
```

C.

```text
A
C
B
```

D.

```text
C
A
B
```

**Answer: C**

**Giải thích:** `setTimeout` với `0` mili giây **không** chạy ngay. Callback được xếp vào hàng đợi và chỉ được lấy ra khi Call Stack đã trống, tức là sau khi cả hai lệnh đồng bộ chạy xong. Con số `0` chỉ nói "sớm nhất có thể", không phải "ngay lập tức".

