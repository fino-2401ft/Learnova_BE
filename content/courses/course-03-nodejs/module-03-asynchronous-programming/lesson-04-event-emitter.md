---
id: node-m3-l4
course: Node.js
module: Asynchronous Programming
title: EventEmitter
order: 4
difficulty: Beginner
estimatedTime: 40
---
# EventEmitter

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu EventEmitter là gì.
- Tạo và phát (emit) một sự kiện.
- Lắng nghe sự kiện bằng `on()`.
- Truyền dữ liệu thông qua sự kiện.
- Gỡ bỏ Listener.
- Áp dụng EventEmitter trong các ứng dụng Node.js.

---

## 📖 Definition

**EventEmitter** là một lớp (Class) thuộc Core Module `events` của Node.js.

EventEmitter cho phép các đối tượng:

- Phát sinh sự kiện (Emit Event).
- Lắng nghe sự kiện (Listen Event).
- Thực hiện các hành động khi sự kiện xảy ra.

Nhiều thành phần của Node.js như:

- HTTP Server
- Stream
- Process

đều được xây dựng dựa trên EventEmitter.

---

## 💻 Syntax

### Import EventEmitter

```javascript
const EventEmitter = require("events");
```

---

### Tạo đối tượng EventEmitter

```javascript
const emitter = new EventEmitter();
```

---

### Lắng nghe sự kiện

```javascript
emitter.on("login", () => {

    console.log("User logged in");

});
```

---

### Phát sự kiện

```javascript
emitter.emit("login");
```

---

## 📝 Example 1 - Event đơn giản

```javascript
const EventEmitter = require("events");

const emitter = new EventEmitter();

emitter.on("start", () => {

    console.log("Application started");

});

emitter.emit("start");
```

Output

```text
Application started
```

### Giải thích

- `on()` đăng ký một Listener.
- `emit()` phát sự kiện.
- Khi sự kiện xảy ra, Listener sẽ được thực thi.

---

## 📝 Example 2 - Truyền dữ liệu

```javascript
const EventEmitter = require("events");

const emitter = new EventEmitter();

emitter.on("greet", (name) => {

    console.log("Hello", name);

});

emitter.emit("greet", "Alice");
```

Output

```text
Hello Alice
```

### Giải thích

`emit()` có thể truyền dữ liệu đến Listener thông qua các tham số.

---

## 📝 Example 3 - Nhiều Listener

```javascript
const EventEmitter = require("events");

const emitter = new EventEmitter();

emitter.on("order", () => {

    console.log("Check inventory");

});

emitter.on("order", () => {

    console.log("Create invoice");

});

emitter.on("order", () => {

    console.log("Send email");

});

emitter.emit("order");
```

Output

```text
Check inventory
Create invoice
Send email
```

### Giải thích

Một sự kiện có thể có nhiều Listener.

Các Listener sẽ được thực thi theo thứ tự đăng ký.

---

## ⚠️ Notes

### 1. on()

```javascript
emitter.on("event", listener);
```

Đăng ký một Listener để lắng nghe sự kiện.

---

### 2. emit()

```javascript
emitter.emit("event");
```

Phát sinh một sự kiện.

Nếu không có Listener nào, chương trình sẽ không báo lỗi.

---

### 3. once()

```javascript
emitter.once("login", () => {

    console.log("Welcome");

});
```

Listener chỉ được thực thi **một lần**.

---

### 4. off()

```javascript
emitter.off("login", listener);
```

Gỡ bỏ một Listener đã đăng ký.

Trong các phiên bản Node.js cũ có thể sử dụng:

```javascript
emitter.removeListener();
```

---

### 5. Listener

Một Listener là hàm sẽ được gọi khi sự kiện xảy ra.

Ví dụ:

```javascript
emitter.on("save", () => {

    console.log("Saved");

});
```

---

## 🌍 Real World Example

Giả sử một hệ thống bán hàng.

```javascript
const EventEmitter = require("events");

const emitter = new EventEmitter();

emitter.on("orderCreated", () => {

    console.log("Update inventory");

});

emitter.on("orderCreated", () => {

    console.log("Send confirmation email");

});

emitter.on("orderCreated", () => {

    console.log("Create shipping request");

});

emitter.emit("orderCreated");
```

Output

```text
Update inventory
Send confirmation email
Create shipping request
```

Trong thực tế, EventEmitter thường được sử dụng để:

- Ghi log.
- Gửi thông báo.
- Xử lý sự kiện hệ thống.
- Stream.
- HTTP Server.
- Microservices.

---

## ❌ Common Mistakes

### Sai 1 - emit() trước on()

Sai

```javascript
emitter.emit("login");

emitter.on("login", () => {

    console.log("Hello");

});
```

Kết quả

```text
Không có gì được in ra.
```

Listener phải được đăng ký trước khi phát sự kiện.

---

### Sai 2 - Sai tên sự kiện

Sai

```javascript
emitter.on("Login", () => {

});
```

```javascript
emitter.emit("login");
```

Tên sự kiện phân biệt chữ hoa và chữ thường.

---

### Sai 3 - Quên truyền dữ liệu

Sai

```javascript
emitter.on("greet", (name) => {

    console.log(name);

});

emitter.emit("greet");
```

Kết quả

```text
undefined
```

---

### Sai 4 - Đăng ký quá nhiều Listener

Nếu liên tục gọi:

```javascript
emitter.on(...)
```

mà không gỡ bỏ Listener khi không còn sử dụng, ứng dụng có thể tiêu tốn thêm bộ nhớ và Node.js có thể cảnh báo về số lượng Listener quá lớn.

---

## 📚 Summary

- `EventEmitter` thuộc Core Module `events`.
- `on()` đăng ký Listener.
- `emit()` phát sinh sự kiện.
- `once()` đăng ký Listener chỉ chạy một lần.
- `off()` gỡ bỏ Listener.
- EventEmitter là nền tảng của nhiều thành phần trong Node.js như HTTP Server và Stream.

---

## 📝 Quiz

### Question 1

Module nào chứa lớp `EventEmitter`?

A.

```text
http
```

B.

```text
events
```

C.

```text
stream
```

D.

```text
fs
```

**Answer: B**

**Giải thích:** `EventEmitter` nằm trong module lõi `events`. Rất nhiều thứ trong Node kế thừa từ nó — `http.Server`, `fs.ReadStream`, `process` — nên hiểu nó là hiểu luôn cách phần lớn API của Node hoạt động.


---

### Question 2

Phương thức nào dùng để phát sinh một sự kiện?

A.

```javascript
on()
```

B.

```javascript
listen()
```

C.

```javascript
emit()
```

D.

```javascript
once()
```

**Answer: C**

**Giải thích:** `emit()` phát sự kiện, `on()` đăng ký lắng nghe. Điểm dễ bỏ sót: `emit()` gọi các listener **đồng bộ**, theo đúng thứ tự đăng ký, chứ không đẩy vào hàng đợi như `setTimeout`. `once()` cũng lắng nghe nhưng tự gỡ sau lần đầu.

