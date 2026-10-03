---
id: javascript-async-m3-l3
course: JavaScript Nâng Cao & Async
module: Prototype, Web API và mẫu thiết kế
title: Design Patterns trong JavaScript (Singleton, Factory, Observer, PubSub)
order: 3
difficulty: Advanced
estimatedTime: 240
---
# Design Patterns trong JavaScript (Singleton, Factory, Observer, PubSub)

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững khái niệm **Design Patterns** và tầm quan trọng của việc kiến tạo mã nguồn có thể mở rộng.
- Xây dựng pattern **Singleton** đảm bảo một Class chỉ có duy nhất một Instance trong toàn bộ hệ thống.
- Áp dụng pattern **Factory** để linh hoạt tạo ra các đối tượng phức tạp dựa trên tham số đầu vào.
- Làm chủ hai pattern giao tiếp kiến trúc phổ biến nhất: **Observer Pattern** và **Publish/Subscribe (PubSub) Pattern**.
- Nhận biết các Design Patterns được tích hợp ngầm bên trong các thư viện React, Redux, Event Listeners.

---

## 📖 Definition

### 1. Design Patterns trong Frontend là gì?
Design Patterns là các giải pháp mẫu đã được tối ưu hóa cho những vấn đề kiến trúc mã nguồn thường xuyên lặp lại trong lập trình phần mềm.

### 2. Bốn Pattern Cốt Lõi
1. **Singleton Pattern:** Đảm bảo một Class chỉ có duy nhất một đối tượng Instance được tạo ra trong suốt vòng đời ứng dụng. Thường dùng cho: Database Connection, Global State Store, Logging Client.
2. **Factory Pattern:** Cung cấp một giao diện chung để tạo ra các đối tượng mà không cần chỉ định chính xác tên Class cụ thể khi khởi tạo.
3. **Observer Pattern:** Một đối tượng chính (Subject) duy trì danh sách các đối tượng phụ thuộc (Observers) và tự động thông báo cho chúng khi có bất kỳ sự thay đổi trạng thái nào.
4. **Publish/Subscribe (PubSub) Pattern:** Tương tự Observer nhưng có thêm một **Event Bus / Broker** nằm ở giữa. Người phát sự kiện (Publisher) và người nhận sự kiện (Subscriber) hoàn toàn không biết sự tồn tại của nhau (Decoupled Architecture).

---

## 💻 Syntax

### Singleton Pattern Syntax
```javascript
class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance; // Trả về instance cũ nếu đã tạo
    }
    this.connectionString = "mongodb://localhost:27017";
    DatabaseConnection.instance = this;
  }
}
```

### PubSub Pattern Syntax
```javascript
class EventEmitter {
  constructor() { this.events = {}; }
  on(event, listener) {
    (this.events[event] = this.events[event] || []).push(listener);
  }
  emit(event, data) {
    (this.events[event] || []).forEach(fn => fn(data));
  }
}
```

---

## 📝 Example 1 - Cài đặt Singleton Pattern cho Logger Service

```javascript
class AppLogger {
  constructor() {
    if (AppLogger.instance) {
      return AppLogger.instance;
    }
    this.logs = [];
    AppLogger.instance = this;
  }

  log(message) {
    const entry = `[${new Date().toISOString()}] ${message}`;
    this.logs.push(entry);
    console.log(entry);
  }

  getLogs() {
    return [...this.logs];
  }
}

const logger1 = new AppLogger();
const logger2 = new AppLogger();

logger1.log("Người dùng vừa đăng nhập thành công");

console.log("Cả 2 logger dùng chung 1 instance?:", logger1 === logger2); // true
console.log("Số lượng log ghi nhận ở logger2:", logger2.getLogs().length); // 1
```

Output:
```text
[2026-08-02T10:00:00.000Z] Người dùng vừa đăng nhập thành công
Cả 2 logger dùng chung 1 instance?: true
Số lượng log ghi nhận ở logger2: 1
```

---

## 📝 Example 2 - Cài đặt Factory Pattern khởi tạo các loại Notification

```javascript
class EmailNotification {
  send(message) { console.log(`📧 Gửi EMAIL: ${message}`); }
}

class SMSNotification {
  send(message) { console.log(`📱 Gửi SMS: ${message}`); }
}

class PushNotification {
  send(message) { console.log(`🔔 Gửi PUSH NOTIFICATION: ${message}`); }
}

// Factory Class linh hoạt tạo đối tượng
class NotificationFactory {
  static createNotification(type) {
    switch (type.toLowerCase()) {
      case "email": return new EmailNotification();
      case "sms": return new SMSNotification();
      case "push": return new PushNotification();
      default: throw new Error("Loại thông báo không hỗ trợ");
    }
  }
}

const notifyService = NotificationFactory.createNotification("sms");
notifyService.send("Mã OTP của bạn là 123456");
```

Output:
```text
📱 Gửi SMS: Mã OTP của bạn là 123456
```

---

## 📝 Example 3 - Cài đặt PubSub (Event Bus) cho giao tiếp decoupled giữa các Modules

```javascript
class EventBus {
  constructor() {
    this.subscribers = {};
  }

  // Đăng ký nhận sự kiện
  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);

    // Trả về hàm Hủy đăng ký (Unsubscribe)
    return () => {
      this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
    };
  }

  // Phát sự kiện
  publish(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(callback => callback(data));
    }
  }
}

const globalBus = new EventBus();

// Module A: Đăng ký lắng nghe sự kiện "ORDER_CREATED"
const unsubscribe = globalBus.subscribe("ORDER_CREATED", (order) => {
  console.log(`[MODULE EMAIL] Đang gửi mail xác nhận cho đơn hàng #${order.id}`);
});

// Module B: Phát sự kiện khi tạo đơn hàng mới
globalBus.publish("ORDER_CREATED", { id: "ORD-999", amount: 500000 });
```

Output:
```text
[MODULE EMAIL] Đang gửi mail xác nhận cho đơn hàng #ORD-999
```

---

## ⚠️ Notes

1. **Phân biệt Observer vs PubSub:** Observer Pattern giao tiếp trực tiếp giữa Subject và Observers. Trong khi PubSub Pattern giao tiếp gián tiếp thông qua một trung gian **Event Bus** (Decoupled).
2. **Tránh lạm dụng Singleton:** Lạm dụng Singleton có thể biến mã nguồn thành chuỗi mã phụ thuộc dữ liệu toàn cục (Global Mutable State) khó viết Unit Test.

---

## ❌ Common Mistakes

### Sai 1 - Quên lưu lại Instance trong Singleton Pattern
```javascript
// ❌ Sai: Không lưu gán Singleton.instance = this -> Mỗi lần new sẽ tạo ra 1 object hoàn toàn mới!
class BadSingleton {
  constructor() {
    if (BadSingleton.instance) return BadSingleton.instance;
    // Quên dòng: BadSingleton.instance = this;
  }
}
```

---

## 📚 Summary

- **Singleton:** Đảm bảo chỉ có 1 Instance duy nhất toàn hệ thống.
- **Factory:** Linh hoạt khởi tạo đối tượng dựa trên tham số truyền vào.
- **PubSub / Observer:** Cơ chế phát/nhận sự kiện giúp mã nguồn tách rời (Decoupled Architecture), ứng dụng rộng rãi trong Event Listeners, Redux, RxJS.

---

## 📝 Quiz

### Question 1
Mục đích chính của Singleton Pattern là gì?

A. Tự động hóa quá trình test mã nguồn  
B. Đảm bảo một Class chỉ khởi tạo duy nhất một đối tượng Instance duy nhất trong suốt ứng dụng  
C. Cho phép tạo hàng ngàn đối tượng ngẫu nhiên  
D. Thay thế hoàn toàn câu lệnh switch-case  

**Answer: B**

---

### Question 2
Điểm khác biệt mấu chốt giữa PubSub Pattern và Observer Pattern là gì?

A. PubSub Pattern không dùng được trong JavaScript  
B. PubSub Pattern sử dụng một bộ phận trung gian (Event Bus/Broker) giúp Publisher và Subscriber hoàn toàn không biết sự tồn tại của nhau (Decoupled)  
C. Observer Pattern chạy nhanh hơn 100 lần  
D. Cả hai giống hệt nhau về cấu trúc  

**Answer: B**

---

### Question 3
Pattern nào cung cấp một phương thức chuẩn để khởi tạo các đối tượng khác nhau dựa trên tham số đầu vào mà không cần chỉ định tên Class cụ thể khi gọi?

A. Singleton Pattern  
B. Factory Pattern  
C. Decorator Pattern  
D. Proxy Pattern  

**Answer: B**
