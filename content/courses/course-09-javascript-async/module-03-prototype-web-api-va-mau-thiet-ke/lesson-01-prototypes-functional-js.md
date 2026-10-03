---
id: javascript-async-m3-l1
course: JavaScript Nâng Cao & Async
module: Prototype, Web API và mẫu thiết kế
title: Prototypes, Prototype Chain & Functional JS
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Prototypes, Prototype Chain & Functional JS

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu thấu đáo cơ chế Kế thừa 원 mẫu (**Prototypal Inheritance**) trong JavaScript.
- Phân tích và truy vết **Prototype Chain (`__proto__` & `prototype`)**.
- Áp dụng các khái niệm Functional Programming (FP): Pure Functions, Side Effects, Immutability, Currying.
- Xây dựng hàm `pipe()` và `compose()` để kết hợp nhiều hàm xử lý dữ liệu.
- Phân biệt phong cách lập trình Hướng đối tượng (OOP) và Lập trình hàm (FP) trong JavaScript.

---

## 📖 Definition

### 1. Prototype & Prototype Chain
JavaScript không phải là ngôn ngữ OOP dựa trên Class truyền thống (Class-based). Bản chất mọi đối tượng trong JS đều sở hữu một mối nối ẩn trỏ tới đối tượng nguyên mẫu của nó gọi là **`[[Prototype]]`** (hoặc truy cập qua `__proto__`).

Khi bạn truy cập một thuộc tính hay phương thức trên một đối tượng:
1. JS Engine tìm xem thuộc tính đó có trực tiếp trên đối tượng hay không.
2. Nếu không thấy, nó sẽ tìm tiếp lên đối tượng Prototype của nó.
3. Quá trình tìm kiếm này tiếp tục leo lên trên chuỗi **Prototype Chain** cho đến khi gặp `Object.prototype.__proto__ === null`. Nếu vẫn không thấy, trả về `undefined`.

### 2. Functional Programming (Lập trình hàm) trong JS
Functional Programming là một paradigm coi các phép tính toán là sự đánh giá các hàm toán học thuần túy:
- **Pure Function (Hàm thuần túy):** Với cùng đối số đầu vào, hàm LUÔN LUÔN trả về cùng một kết quả đầu ra và KHÔNG gây ra bất kỳ Side Effect nào (không sửa biến global, không đổi DOM, không console.log).
- **Currying:** Kỹ thuật chuyển đổi một hàm nhận nhiều đối số `f(a, b, c)` thành một chuỗi các hàm liên tiếp `f(a)(b)(c)`, mỗi hàm chỉ nhận 1 đối số.

---

## 💻 Syntax

### Prototype Inspection & Currying Syntax
```javascript
// Kiểm tra Prototype
Object.getPrototypeOf(obj);

// Currying Pattern
const multiply = (a) => (b) => a * b;
const double = multiply(2);
console.log(double(5)); // 10
```

---

## 📝 Example 1 - Chứng minh cơ chế Prototype Chain chia sẻ phương thức

```javascript
function Person(name) {
  this.name = name;
}

// Gán phương thức vào Prototype để dùng chung bộ nhớ cho tất cả Instance
Person.prototype.sayHello = function () {
  return `Xin chào, tôi là ${this.name}`;
};

const userA = new Person("Long");
const userB = new Person("Vũ");

console.log(userA.sayHello()); // "Xin chào, tôi là Long"
console.log(userA.sayHello === userB.sayHello); // ✅ true (Dùng chung 1 ô nhớ duy nhất trên Prototype!)
```

Output:
```text
Xin chào, tôi là Long
true
```

---

## 📝 Example 2 - Xây dựng hàm Pipe (`pipe()`) kết hợp nhiều Pure Functions

```javascript
// Xây dựng hàm pipe áp dụng các hàm từ trái sang phải
const pipe = (...fns) => (initialValue) => 
  fns.reduce((acc, fn) => fn(acc), initialValue);

// Các Pure Functions đơn lẻ
const trimText = (str) => str.trim();
const toLowerCase = (str) => str.toLowerCase();
const addPrefix = (str) => `user_${str}`;

// Kết hợp các hàm
const formatUsername = pipe(trimText, toLowerCase, addPrefix);

console.log(formatUsername("   NGUYEN_LONG   ")); // Output: "user_nguyen_long"
```

Output:
```text
user_nguyen_long
```

---

## 📝 Example 3 - Viết Currying Function ứng dụng lọc dữ liệu linh hoạt

```javascript
// Function lọc nguyên bản
const filterByKey = (key) => (targetValue) => (list) => 
  list.filter(item => item[key] === targetValue);

const products = [
  { id: 1, category: "tech", price: 100 },
  { id: 2, category: "fashion", price: 50 },
  { id: 3, category: "tech", price: 200 }
];

// Tạo các helper filter chuyên biệt nhờ Currying
const filterByCategory = filterByKey("category");
const filterTechProducts = filterByCategory("tech");

console.log(filterTechProducts(products));
```

Output:
```text
[
  { id: 1, category: 'tech', price: 100 },
  { id: 3, category: 'tech', price: 200 }
]
```

---

## ⚠️ Notes

1. **Tránh can thiệp Prototype gốc (`Object.prototype` / `Array.prototype`):** Tuyệt đối không tự ý thêm các phương thức tự tạo vào các Prototype có sẵn của ngôn ngữ (Monkey Patching). Điều này có thể gây xung đột tên hàm nghiêm trọng với các thư viện bên thứ 3.

---

## ❌ Common Mistakes

### Sai 1 - Định nghĩa phương thức trực tiếp trong Constructor thay vì Prototype
```javascript
function User(name) {
  this.name = name;
  // ❌ Sai: Mỗi khi tạo new User(), một ô nhớ hàm mới lại bị tạo ra -> Tốn RAM!
  this.greet = function() {}; 
}

// ✅ Đúng: Gán vào prototype
User.prototype.greet = function() {};
```

---

## 📚 Summary

- **Prototype Chain** cho phép các đối tượng kế thừa thuộc tính/phương thức từ nhau.
- **Pure Function** không có Side Effect, luôn trả về cùng 1 kết quả với cùng 1 input.
- **Currying** chuyển đổi hàm `f(a,b)` thành `f(a)(b)`, hỗ trợ tạo các hàm tái sử dụng linh hoạt.

---

## 📝 Quiz

### Question 1
Điều gì xảy ra khi bạn truy cập một thuộc tính không tồn tại trực tiếp trên đối tượng trong JavaScript?

A. Trình duyệt thăng cấp lỗi crash ngay lập tức  
B. JS Engine sẽ tìm tiếp lên đối tượng Prototype của nó thông qua chuỗi Prototype Chain  
C. Trả về số 0  
D. Tự động khởi tạo thuộc tính đó  

**Answer: B**

---

### Question 2
Đặc điểm cốt lõi của một Hàm thuần túy (Pure Function) trong Lập trình hàm là gì?

A. Phải khai báo bằng từ khóa `async`  
B. Với cùng một đối số đầu vào luôn trả về cùng một đầu ra và KHÔNG gây ra tác dụng phụ (Side Effects)  
C. Phải làm thay đổi biến global  
D. Chỉ dùng được trong class  

**Answer: B**

---

### Question 3
Kỹ thuật Currying trong JavaScript chuyển đổi một hàm nhận 2 đối số `f(a, b)` thành cấu trúc hàm tương đương nào?

A. `f(a + b)`  
B. `f(a)(b)`  
C. `f([a, b])`  
D. `f(a, b, null)`  

**Answer: B**
