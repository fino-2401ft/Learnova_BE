---
id: javascript-es6-m3-l2
course: JavaScript ES6+ Cơ Bản
module: Cú pháp hiện đại và cơ chế bên dưới
title: Scope, Lexical Environment, Hoisting & TDZ
order: 2
difficulty: Intermediate
estimatedTime: 240
---
# Scope, Lexical Environment, Hoisting & TDZ

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu thấu đáo về **Scope** (Global Scope, Function Scope, Block Scope) và Lexical Environment.
- Nắm vững cơ chế **Hoisting** hoạt động như thế nào với `var`, `let`, `const`, `function declaration`, `function expression`.
- Giải thích bản chất của **Temporal Dead Zone (TDZ - Vùng chết thời gian)** và cách ngăn ngừa lỗi `ReferenceError`.
- Phân tích Scope Chain để xác định chính xác thứ tự tìm kiếm biến của trình dịch JavaScript.
- Áp dụng các quy tắc khai báo biến an toàn để tránh rò rỉ biến (Global Pollution) trong ứng dụng lớn.

---

## 📖 Definition

### 1. Phân loại Phạm vi (Scope Types)
Scope quyết định khả năng truy cập của biến tại từng vị trí trong mã nguồn:
- **Global Scope:** Biến khai báo ở cấp cao nhất, có thể truy cập ở bất kỳ đâu.
- **Function Scope (`var`):** Biến chỉ tồn tại bên trong hàm được khai báo. Khối lệnh như `if` hay `for` KHÔNG giới hạn scope của `var`.
- **Block Scope (`let`, `const`):** Biến chỉ tồn tại trong cặp dấu ngoặc nhọn `{}` gần nhất.

### 2. Hoisting là gì?
Hoisting là cơ chế của JS Engine đưa phần **khai báo** (Declaration) của biến và hàm lên đầu phạm vi thực thi của nó trong giai đoạn biên dịch (Compile Phase), trước khi mã được thực thi từng dòng (Execution Phase).

- **Function Declaration:** Được hoist **cả phần khai báo lẫn phần định nghĩa thân hàm**. Do đó bạn có thể gọi hàm trước dòng khai báo.
- **`var`:** Được hoist phần khai báo và tự động gán giá trị khởi tạo là `undefined`.
- **`let` và `const`:** Cũng được hoist phần khai báo, nhưng **KHÔNG được gán giá trị khởi tạo**. Biến rơi vào vùng TDZ.

### 3. Temporal Dead Zone (TDZ)
TDZ là khoảng thời gian từ khi phạm vi khối (Block Scope) bắt đầu khởi tạo cho đến khi dòng lệnh khai báo biến `let`/`const` thực sự được thực thi.
Nếu bạn truy cập biến trong khoảng TDZ này, JavaScript sẽ ném lỗi `ReferenceError: Cannot access 'x' before initialization`.

---

## 💻 Syntax

### Hoisting Behavior Matrix
```javascript
// Function Declaration - Chạy tốt
sayHi(); 
function sayHi() { console.log("Hi"); }

// var - Trả về undefined
console.log(a); // undefined
var a = 10;

// let/const - Thăng cấp lỗi TDZ
console.log(b); // ❌ ReferenceError: Cannot access 'b' before initialization
let b = 20;
```

---

## 📝 Example 1 - Phân tích rò rỉ biến của `var` trong vòng lặp so với `let`

```javascript
// 1. Dùng var (Function Scope - Rò rỉ biến i)
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var i:", i), 100);
}

// 2. Dùng let (Block Scope - Tạo binding mới cho từng vòng)
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let j:", j), 100);
}
```

Output:
```text
var i: 3
var i: 3
var i: 3
let j: 0
let j: 1
let j: 2
```

---

## 📝 Example 2 - Phân tích Scope Chain tìm kiếm biến

```javascript
const globalName = "Global System";

function outerFunction() {
  const outerName = "Outer Module";

  function innerFunction() {
    const innerName = "Inner Block";
    // Scope Chain tìm kiếm từ trong ra ngoài: innerName -> outerName -> globalName
    console.log(`${innerName} -> ${outerName} -> ${globalName}`);
  }

  innerFunction();
}

outerFunction();
```

Output:
```text
Inner Block -> Outer Module -> Global System
```

---

## 📝 Example 3 - Mẫu viết code an toàn vượt qua vùng TDZ

```javascript
function calculateDiscountPrice(price, discountRatio) {
  // ❌ NGUY HIỂM: Gọi biến ratio trước dòng khai báo let
  // const finalDiscount = price * ratio; 
  // let ratio = discountRatio ?? 0.1;

  // ✅ ĐÚNG: Khai báo biến đầy đủ trước khi thực hiện tính toán
  const ratio = discountRatio ?? 0.1;
  const finalDiscount = price * ratio;
  return price - finalDiscount;
}

console.log("Giá sau giảm:", calculateDiscountPrice(100000));
```

Output:
```text
Giá sau giảm: 90000
```

---

## ⚠️ Notes

1. **`let` và `const` CÓ ĐƯỢC HOISTING:** Rất nhiều người hiểu nhầm rằng `let/const` không được hoisting. Thực tế chúng vẫn được nâng khai báo lên đầu block scope, nhưng do nằm trong TDZ nên chưa thể truy cập.
2. **Hạn chế dùng biến Toàn cục (Global Variables):** Khai báo biến không có từ khóa (`x = 10`) sẽ tự động biến `x` thành thuộc tính của `window/globalThis`, gây ô nhiễm bộ nhớ toàn cục.

---

## ❌ Common Mistakes

### Sai 1 - Truy cập biến `let`/`const` trước dòng khai báo do hiểu nhầm Hoisting
```javascript
function test() {
  console.log(x); // ❌ ReferenceError
  let x = 5;
}
```

---

## 📚 Summary

- `var` thuộc Function Scope; `let` và `const` thuộc Block Scope `{}`.
- Hoisting đưa khai báo lên đầu scope. `var` gán `undefined`, `let/const` rơi vào **TDZ**.
- **TDZ** ngăn truy cập biến trước khi khai báo, giúp phát hiện lỗi sớm.

---

## 📝 Quiz

### Question 1
Lỗi gì sẽ xảy ra khi bạn cố gắng truy cập một biến khai báo bằng `let` trong vùng Temporal Dead Zone (TDZ)?

A. Trả về `undefined`  
B. Trả về `null`  
C. Thăng cấp lỗi `ReferenceError: Cannot access 'x' before initialization`  
D. Trình duyệt bị crash  

**Answer: C**

---

### Question 2
Sự khác biệt mấu chốt về Hoisting giữa `Function Declaration` và `Function Expression` gán vào biến `const` là gì?

A. Function Expression được hoist toàn bộ, Function Declaration thì không  
B. Function Declaration được hoist cả khai báo lẫn thân hàm (gọi trước dòng khai báo được), còn Function Expression rơi vào TDZ  
C. Cả hai giống hệt nhau  
D. Function Declaration không dùng được trong ES6  

**Answer: B**

---

### Question 3
Khối lệnh nào sau đây KHÔNG giới hạn phạm vi (Scope) của một biến khai báo bằng từ khóa `var`?

A. Khối lệnh hàm `function() {}`  
B. Khối lệnh điều kiện `if () {}` hoặc vòng lặp `for () {}`  
C. Cả hàm và khối `if` đều giới hạn `var`  
D. `var` không bị giới hạn ở đâu  

**Answer: B**
