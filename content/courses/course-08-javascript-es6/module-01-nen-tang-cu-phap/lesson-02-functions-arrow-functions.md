---
id: javascript-es6-m1-l2
course: JavaScript ES6+ Cơ Bản
module: Nền tảng cú pháp
title: Functions & Arrow Functions
order: 2
difficulty: Beginner
estimatedTime: 240
---
# Functions & Arrow Functions

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân biệt sự khác nhau giữa Function Declaration, Function Expression và Arrow Function.
- Nắm vững cú pháp Arrow Function (Implicit return, bọc Object Literal trong `()`).
- Sử dụng tham số mặc định (Default Parameters) và tham số gom nhóm (Rest Parameters).
- Hiểu và ứng dụng toán tử giải mảng/đối tượng (Spread Operator).
- Hiểu khái niệm Phạm vi (Scope) và Hàm đóng gói (Closure) cơ bản trong JavaScript.

---

## 📖 Definition

### 1. Phân loại Hàm trong JavaScript
Function (Hàm) là khối mã nguồn thực hiện một nhiệm vụ cụ thể. Trực quan trong JavaScript, hàm có thể được tạo ra theo 3 cách chính:

- **Function Declaration:** Hàm được khai báo trực tiếp bằng từ khóa `function`. Đặc điểm quan trọng nhất là tính chất **Hoisting**, cho phép hàm được gọi trước dòng khai báo trong mã nguồn.
- **Function Expression:** Hàm được gán vào một biến. Hàm này không được hoist phần giá trị, nghĩa là không thể gọi trước khi biến được gán.
- **Arrow Function (ES6):** Cú pháp viết hàm ngắn gọn sử dụng mũi tên `=>`. Arrow Function không có ngữ cảnh `this` riêng (nó thừa hưởng `this` từ Lexical Scope bên ngoài) và không thể dùng làm Constructor Function với từ khóa `new`.

### 2. Default Parameters & Rest/Spread (ES6)
- **Default Parameters:** Cho phép gán giá trị mặc định cho tham số khi gọi hàm không truyền giá trị hoặc truyền `undefined`.
- **Rest Parameters (`...args`):** Thu gom tất cả các đối số dư thừa khi gọi hàm tạo thành một mảng (Array).
- **Spread Operator (`...arr` / `...obj`):** Trao khả năng trải (trải phẳng) các phần tử của Array hoặc các cặp key-value của Object vào một vị trí mới.

### 3. Scope & Closures (Nền tảng)
- **Scope (Phạm vi):** Quyết định nơi biến có thể truy cập được (Global Scope, Function Scope, Block Scope).
- **Closure:** Hiện tượng một hàm con "ghi nhớ" và duy trì quyền truy cập vào các biến thuộc Lexical Scope của hàm cha chứa nó, ngay cả khi hàm cha đã kết thúc quá trình thi hành.

---

## 💻 Syntax

### Arrow Function Basic & Short Forms
```javascript
// Cú pháp đầy đủ
const add = (a, b) => {
  return a + b;
};

// Imperial return (1 dòng, tự động trả về)
const multiply = (a, b) => a * b;

// Return một Object Literal (cần bọc ngoặc tròn)
const createUser = (name, age) => ({ name, age });
```

### Default & Rest Parameters
```javascript
// Default parameter
const greet = (name = "Khách") => `Xin chào ${name}`;

// Rest parameter
const sumAll = (...numbers) => numbers.reduce((total, n) => total + n, 0);
```

### Spread Operator
```javascript
const combinedArray = [...array1, ...array2];
const updatedObject = { ...originalObj, newKey: newValue };
```

---

## 📝 Example 1 - So sánh Function Declaration và Arrow Function

```javascript
// 1. Function Declaration (Hỗ trợ Hoisting)
console.log(calculateTax(100)); // Output: 10 (Chạy thành công nhờ hoisting)

function calculateTax(amount) {
  return amount * 0.1;
}

// 2. Arrow Function (Không hỗ trợ Hoisting kiểu này)
try {
  console.log(calculateDiscount(100));
} catch (err) {
  console.log("Lỗi:", err.message); // ReferenceError: Cannot access 'calculateDiscount' before initialization
}

const calculateDiscount = (amount) => amount * 0.2;
console.log(calculateDiscount(100)); // Output: 20
```

Output:
```text
10
Lỗi: Cannot access 'calculateDiscount' before initialization
20
```

---

## 📝 Example 2 - Arrow Function trả về Object và Rest/Spread

```javascript
// Tạo thông tin sản phẩm và cập nhật giá
const createProduct = (name, price = 0, ...tags) => ({
  id: Date.now(),
  name,
  price,
  tags,
  isAvailable: true
});

const laptop = createProduct("MacBook M3", 30000000, "apple", "laptop", "tech");
console.log("Sản phẩm ban đầu:", laptop);

// Cập nhật giá bằng Spread Operator
const discountedLaptop = {
  ...laptop,
  price: 27000000,
  discount: "10%"
};

console.log("Sản phẩm sau giảm giá:", discountedLaptop);
```

Output:
```text
Sản phẩm ban đầu: {
  id: 1722600000000,
  name: 'MacBook M3',
  price: 30000000,
  tags: [ 'apple', 'laptop', 'tech' ],
  isAvailable: true
}
Sản phẩm sau giảm giá: {
  id: 1722600000000,
  name: 'MacBook M3',
  price: 27000000,
  tags: [ 'apple', 'laptop', 'tech' ],
  isAvailable: true,
  discount: '10%'
}
```

---

## 📝 Example 3 - Closure cơ bản: Bộ đếm độc lập (Counter Creator)

```javascript
function createCounter(initialValue = 0) {
  let count = initialValue; // Biến private nhờ Closure

  return {
    increment: () => ++count,
    decrement: () => --count,
    getValue: () => count
  };
}

const counterA = createCounter(10);
const counterB = createCounter(100);

counterA.increment();
counterA.increment();
counterB.decrement();

console.log("Counter A:", counterA.getValue()); // Output: 12
console.log("Counter B:", counterB.getValue()); // Output: 99
```

Output:
```text
Counter A: 12
Counter B: 99
```

---

## ⚠️ Notes

1. **Trả về Object trong Arrow Function:** Khi viết rủ gọn 1 dòng trả về Object Literal, bạn **bắt buộc** phải bọc Object trong cặp dấu ngoặc tròn `()`. Ví dụ: `const fn = () => ({ a: 1 })`. Nếu không bọc `()`, JavaScript sẽ hiểu `{}` là một Block Code chứ không phải Object.
2. **Rest Parameter phải ở vị trí cuối cùng:** Trong danh sách tham số hàm, tham số gom nhóm Rest `...args` phải luôn nằm ở cuối cùng: `(a, b, ...rest)`.
3. **`null` không trigger Default Parameter:** Default Parameter chỉ kích hoạt khi đối số truyền vào là `undefined`. Nếu bạn truyền `null`, tham số sẽ mang giá trị `null`.

---

## ❌ Common Mistakes

### Sai 1 - Quên dấu ngoặc tròn khi return Object bằng Arrow Function
```javascript
const makeUser = (name) => { name: name }; 
// ❌ Trả về undefined vì JS hiểu {} là block code rỗng
const makeUserCorrect = (name) => ({ name: name }); // ✅ Trả về { name: name }
```

### Sai 2 - Đặt Rest Parameter không ở vị trí cuối cùng
```javascript
function processItems(...items, category) { 
  // ❌ SyntaxError: Rest element must be last formal parameter
}
```

### Sai 3 - Dùng Arrow Function cho Constructor
```javascript
const Person = (name) => { this.name = name; };
const p = new Person("Long"); // ❌ TypeError: Person is not a constructor
```

---

## 📚 Summary

- Arrow Function có cú pháp ngắn gọn, không có `this` riêng, rất thích hợp làm callback.
- Default Parameter kích hoạt khi đối số bị thiếu hoặc là `undefined`.
- Rest Parameter (`...rest`) gom các tham số dư thành mảng; Spread Operator (`...spread`) trải các phần tử/thuộc tính ra.
- Closure cho phép hàm giữ nguyên tham chiếu đến các biến nằm ở phạm vi bên ngoài nó.

---

## 📝 Quiz

### Question 1
Đoạn mã Arrow Function nào sau đây trả về một đối tượng `{ score: 100 }` chính xác?

A. `const getScore = () => { score: 100 };`  
B. `const getScore = () => ({ score: 100 });`  
C. `const getScore = () => return { score: 100 };`  
D. `const getScore = () => { return score: 100 };`  

**Answer: B**

---

### Question 2
Đoạn code sau sẽ in ra kết quả gì?
```javascript
const greet = (name = "Bạn") => `Xin chào ${name}`;
console.log(greet(null));
```

A. `Xin chào Bạn`  
B. `Xin chào null`  
C. `Xin chào undefined`  
D. `TypeError`  

**Answer: B**

---

### Question 3
Toán tử Rest Parameter (`...args`) phải luôn đặt ở vị trí nào trong danh sách tham số của một hàm?

A. Đầu tiên  
B. Giữa danh sách  
C. Cuối cùng  
D. Bất kỳ vị trí nào  

**Answer: C**
