---
id: javascript-es6-m1-l1
course: JavaScript ES6+ Cơ Bản
module: Nền tảng cú pháp
title: Variables, Data Types & Operators
order: 1
difficulty: Beginner
estimatedTime: 240
---
# Variables, Data Types & Operators

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững cách khai báo biến với `const`, `let`, `var` và sự khác biệt về Block Scope, Function Scope và Temporal Dead Zone (TDZ).
- Hiểu rõ 7 kiểu dữ liệu nguyên thủy (Primitive Types) và kiểu dữ liệu tham chiếu (Reference Types) trong JavaScript.
- Phân biệt cơ chế ép kiểu (Type Coercion) và áp dụng các toán tử so sánh nghiêm ngặt (`===`), toán tử logic (`&&`, `||`, `??`), toán tử ba ngôi (Ternary Operator).
- Làm chủ cú pháp Template Literals để tạo các chuỗi động phức tạp và đa dòng.
- Áp dụng các kiến thức nền tảng để giải quyết các bài toán xử lý dữ liệu thực tế.

---

## 📖 Definition

### 1. Quản lý biến trong JavaScript (Variable Declaration)
Trong JavaScript hiện đại (ES6+), cách khai báo biến đã chuyển đổi hoàn toàn sang việc ưu tiên sử dụng `const` và `let` thay vì `var`.

- **`const` (Constant):** Khai báo một hằng số. Giá trị gán cho biến không thể thực hiện gán lại (reassign). Tuy nhiên, đối với kiểu dữ liệu tham chiếu (như Object hoặc Array), thuộc tính hoặc phần tử bên trong vẫn có thể bị chỉnh sửa (mutable).
- **`let`:** Khai báo một biến có thể thay đổi giá trị. Phạm vi hoạt động của `let` bị giới hạn trong khối lệnh (Block Scope `{}`).
- **`var`:** Cách khai báo truyền thống trước ES6. `var` bị rò rỉ phạm vi (Function Scope) và hỗ trợ Hoisting mà không có vùng chết thời gian (TDZ), dễ gây ra những lỗi tiềm ẩn khó phát hiện trong các ứng dụng lớn.

### 2. Hệ thống kiểu dữ liệu (Data Types System)
JavaScript là một ngôn ngữ có kiểu dữ liệu động (Dynamically Typed). Kiểu dữ liệu gắn liền với giá trị chứ không gắn với tên biến.

- **Primitive Types (Nguyên thủy):** Bao gồm `String`, `Number`, `Boolean`, `undefined`, `null`, `Symbol`, và `BigInt`. Các giá trị này được lưu trực tiếp trong bộ nhớ Stack và mang tính chất Immutable (không thể thay đổi trực tiếp giá trị của bản thân primitive data).
- **Reference Types (Tham chiếu):** Bao gồm `Object`, `Array`, `Function`. Các đối tượng này được lưu trữ trong bộ nhớ Heap, và biến chỉ nắm giữ địa chỉ tham chiếu (Memory Address/Pointer).

### 3. Toán tử và Ép kiểu (Operators & Coercion)
JavaScript cung cấp các toán tử phong phú để làm việc với dữ liệu:
- **So sánh bằng `==` vs `===`:** `==` sẽ thực hiện ép kiểu ngầm định (Implicit Coercion) trước khi so sánh, dẫn đến nhiều kết quả bất ngờ. Trong khi đó, `===` (Strict Equality) so sánh cả **kiểu dữ liệu** lẫn **giá trị**, giúp mã nguồn an toàn hơn.
- **Nullish Coalescing (`??`):** Chỉ chấp nhận giá trị mặc định khi vế trái là `null` hoặc `undefined`, khắc phục hạn chế của toán tử `||` (vốn coi `0`, `""`, `false` là Falsy).

---

## 💻 Syntax

### Khai báo biến
```javascript
// Khai báo hằng số
const SITE_NAME = "EduConnect";

// Khai báo biến có thể reassign
let userScore = 100;
```

### Kiểm tra kiểu dữ liệu
```javascript
typeof value;
Array.isArray(value);
```

### Operator & Nullish Coalescing
```javascript
// Strict comparison
const isEqual = a === b;

// Nullish Coalescing
const result = value ?? defaultValue;

// Ternary Operator
const status = condition ? "Pass" : "Fail";
```

### Template Literals
```javascript
const message = `Xin chào ${username}, điểm của bạn là ${score}`;
```

---

## 📝 Example 1 - Phân biệt Scope và Khai báo Biến

```javascript
// Phân biệt Block Scope giữa var và let/const
function testScope() {
  if (true) {
    var varVariable = "Tôi là var";
    let letVariable = "Tôi là let";
    const constVariable = "Tôi là const";
  }

  console.log(varVariable); // Output: "Tôi là var" (Rò rỉ ra ngoài Block)
  
  try {
    console.log(letVariable);
  } catch (err) {
    console.log("Lỗi:", err.message); // ReferenceError: letVariable is not defined
  }
}

testScope();
```

Output:
```text
Tôi là var
Lỗi: letVariable is not defined
```

**Giải thích:**
- `var` thuộc Function Scope nên có thể truy cập bất kỳ đâu trong hàm `testScope`.
- `let` và `const` thuộc Block Scope, chỉ tồn tại bên trong khối lệnh `{}` của câu lệnh `if`.

---

## 📝 Example 2 - Phân biệt Strict Equality và Logical Operators

```javascript
const inputCount = 0;

// Sử dụng || (Falsy Check)
const countWithOR = inputCount || 10;
console.log("Dùng || :", countWithOR); // Output: 10 (Sai vì 0 là số lượng hợp lệ)

// Sử dụng ?? (Nullish Coalescing)
const countWithNullish = inputCount ?? 10;
console.log("Dùng ?? :", countWithNullish); // Output: 0 (Đúng vì 0 không phải null/undefined)

// So sánh bằng
console.log("5" == 5);  // true (Ép kiểu ngầm định)
console.log("5" === 5); // false (Khác kiểu dữ liệu: string vs number)
```

Output:
```text
Dùng || : 10
Dùng ?? : 0
true
false
```

---

## 📝 Example 3 - Template Literals và Tính toán Động

```javascript
const student = {
  name: "Nguyễn Văn A",
  math: 8.5,
  english: 9.0
};

const getAverage = (a, b) => (a + b) / 2;

const reportCard = `
=================================
       BÁO CÁO KẾT QUẢ HỌC TẬP
=================================
Học viên: ${student.name.toUpperCase()}
Điểm Toán: ${student.math} | Điểm Anh: ${student.english}
Điểm Trung Bình: ${getAverage(student.math, student.english)}
Trạng thái: ${getAverage(student.math, student.english) >= 5 ? "ĐẠT (PASSED)" : "KHÔNG ĐẠT"}
=================================
`;

console.log(reportCard);
```

Output:
```text
=================================
       BÁO CÁO KẾT QUẢ HỌC TẬP
=================================
Học viên: NGUYỄN VĂN A
Điểm Toán: 8.5 | Điểm Anh: 9
Điểm Trung Bình: 8.75
Trạng thái: ĐẠT (PASSED)
=================================
```

---

## ⚠️ Notes

1. **Luôn ưu tiên dùng `const`:** Mặc định sử dụng `const` cho mọi khai báo biến. Chỉ đổi sang `let` khi chắc chắn giá trị của biến sẽ thay đổi trong tiến trình chạy (như biến đếm vòng lặp, biến tích lũy). Không bao giờ dùng `var`.
2. **Biến `const` với Object/Array:** `const user = { name: "A" }` không ngăn cản việc sửa `user.name = "B"`. Nó chỉ ngăn cản `user = { name: "B" }`.
3. **Temporal Dead Zone (TDZ):** Biến `let` và `const` có được hoisting nhưng rơi vào TDZ từ đầu block cho đến khi dòng khai báo được thực thi. Truy cập trước khi khai báo sẽ gây ra `ReferenceError`.
4. **Hạn chế dùng `typeof null`:** `typeof null` trả về `"object"`. Đây là một bug lịch sử nổi tiếng của JavaScript, cần lưu ý khi kiểm tra dữ liệu null.

---

## ❌ Common Mistakes

### Sai 1 - Gán lại giá trị cho hằng số `const`
```javascript
const maxLimit = 100;
maxLimit = 200; // ❌ TypeError: Assignment to constant variable.
```

### Sai 2 - Nhầm lẫn giữa `||` và `??` khi làm việc với số 0 hoặc chuỗi rỗng
```javascript
let userAge = 0;
let age1 = userAge || 18; // ❌ Gán nhầm thành 18 vì 0 là falsy
let age2 = userAge ?? 18; // ✅ Giữ nguyên 0
```

### Sai 3 - Dùng `==` thay vì `===`
```javascript
if (userInput == false) { 
  // ❌ Nếu userInput là "", 0, [], nó đều sẽ lọt vào đây do type coercion
}
```

---

## 📚 Summary

- `const` dùng cho biến không gán lại, `let` dùng cho biến thay đổi giá trị, loại bỏ hoàn toàn `var`.
- JavaScript có 7 kiểu dữ liệu nguyên thủy (Primitive) và kiểu tham chiếu (Reference).
- `===` so sánh giá trị lẫn kiểu dữ liệu, `??` chỉ fallback khi gặp `null` hoặc `undefined`.
- Template Literals (dấu backtick ``` `` ```) hỗ trợ nhúng biểu thức `${}` và viết chuỗi nhiều dòng tiện lợi.

---

## 📝 Quiz

### Question 1
Đoạn mã sau in ra kết quả gì trong console?
```javascript
const user = { name: "Alice" };
user.name = "Bob";
console.log(user.name);
```

A. `TypeError: Assignment to constant variable`  
B. `Alice`  
C. `Bob`  
D. `undefined`  

**Answer: C**

---

### Question 2
Kết quả của biểu thức `0 ?? 100` và `0 || 100` lần lượt là gì?

A. `0` và `100`  
B. `100` và `0`  
C. `0` và `0`  
D. `100` và `100`  

**Answer: A**

---

### Question 3
Giá trị trả về của phép kiểm tra `typeof null` trong JavaScript là gì?

A. `"null"`  
B. `"undefined"`  
C. `"object"`  
D. `"boolean"`  

**Answer: C**
