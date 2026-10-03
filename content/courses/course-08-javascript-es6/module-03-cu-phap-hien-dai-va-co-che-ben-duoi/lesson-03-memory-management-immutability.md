---
id: javascript-es6-m3-l3
course: JavaScript ES6+ Cơ Bản
module: Cú pháp hiện đại và cơ chế bên dưới
title: JS Memory Management, Garbage Collection & Immutability
order: 3
difficulty: Intermediate
estimatedTime: 240
---
# JS Memory Management, Garbage Collection & Immutability

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu kiến trúc quản lý bộ nhớ của JavaScript Engine: **Call Stack** vs **Memory Heap**.
- Nắm vững cơ chế dọn dẹp bộ nhớ tự động **Garbage Collection (Mark-and-Sweep Algorithm)**.
- Nhận biết các nguyên nhân chính gây Rò rỉ bộ nhớ (**Memory Leaks**) và cách khắc phục.
- Phân biệt **Deep Copy** vs **Shallow Copy** cho Object và Array.
- Làm chủ tư duy lập trình bất biến (**Immutability**) chuẩn bị cho phát triển ứng dụng React.

---

## 📖 Definition

### 1. Phân bổ bộ nhớ: Stack vs Heap
- **Call Stack:** Lưu trữ các kiểu dữ liệu nguyên thủy (Primitive Types) và các tham chiếu bộ nhớ (Pointers/Addresses). Stack có kích thước nhỏ nhưng tốc độ truy cập cực kỳ nhanh.
- **Memory Heap:** Lưu trữ các dữ liệu tham chiếu kích thước lớn và không cố định (Objects, Arrays, Functions).

### 2. Cơ chế Garbage Collection (Dọn rác bộ nhớ)
JavaScript tự động thu hồi bộ nhớ không còn sử dụng thông qua thuật toán **Mark-and-Sweep**:
1. Thuật toán bắt đầu từ đối tượng gốc (Root - ví dụ `window` hoặc `globalThis`).
2. Nó sẽ "đánh dấu" (Mark) tất cả các đối tượng có thể truy cập được từ Root.
3. Tất cả các đối tượng không được đánh dấu (không còn mối nối tham chiếu từ Root) sẽ bị "quét sạch" (Sweep) để giải phóng RAM.

### 3. Shallow Copy vs Deep Copy
- **Shallow Copy (Sao chép nông):** Sao chép tầng ngoài cùng của Object/Array. Các object lồng bên trong vẫn bị dùng chung tham chiếu cũ. (Thực hiện qua Spread `...` hoặc `Object.assign()`).
- **Deep Copy (Sao chép sâu):** Sao chép toàn bộ các tầng dữ liệu lồng nhau thành các đối tượng hoàn toàn độc lập trong bộ nhớ Heap. (Thực hiện qua `structuredClone()` hoặc `JSON.parse(JSON.stringify())`).

---

## 💻 Syntax

### Shallow vs Deep Copy Syntax
```javascript
const original = { a: 1, nested: { b: 2 } };

// Shallow Copy (spread)
const shallow = { ...original };
shallow.nested.b = 99; // ⚠️ Ảnh hưởng cả original.nested.b!

// Deep Copy chuẩn ES2022
const deep = structuredClone(original);
deep.nested.b = 100; // ✅ Không ảnh hưởng original
```

---

## 📝 Example 1 - Phân biệt tác động của Shallow Copy và Deep Copy

```javascript
const userProfile = {
  id: 101,
  name: "Nguyễn Văn A",
  settings: {
    theme: "dark",
    notifications: true
  }
};

// 1. Shallow Copy bằng Spread Operator
const shallowCopy = { ...userProfile };
shallowCopy.name = "Nguyễn Văn B"; // Không đổi original
shallowCopy.settings.theme = "light"; // ⚠️ ĐỔI CẢ ORIGINAL vì dùng chung tham chiếu settings!

console.log("Original Theme (Bị đổi do Shallow Copy):", userProfile.settings.theme); // "light"

// 2. Deep Copy bằng structuredClone
const deepCopy = structuredClone(userProfile);
deepCopy.settings.theme = "blue"; // ✅ Hoàn toàn cách ly!

console.log("Original Theme sau Deep Copy:", userProfile.settings.theme); // "light"
console.log("Deep Copy Theme:", deepCopy.settings.theme); // "blue"
```

Output:
```text
Original Theme (Bị đổi do Shallow Copy): light
Original Theme sau Deep Copy: light
Deep Copy Theme: blue
```

---

## 📝 Example 2 - Nhận biết và khắc phục Memory Leak do Event Listener

```javascript
// ❌ Nguyên nhân gây Rò rỉ bộ nhớ (Memory Leak)
function attachLeak() {
  const bigData = new Array(1000000).fill("RAM HD");
  
  window.addEventListener("scroll", function leakHandler() {
    console.log("Data length:", bigData.length);
  });
  // leakHandler giữ tham chiếu đến bigData -> GC không bao giờ dọn được bigData!
}

// ✅ Khắc phục: Hủy sự kiện khi không còn dùng
function attachClean() {
  const bigData = new Array(1000000).fill("RAM HD");
  
  function cleanHandler() {
    console.log("Data length:", bigData.length);
  }

  window.addEventListener("scroll", cleanHandler);

  // Gỡ bỏ listener khi dọn dẹp
  return function cleanup() {
    window.removeEventListener("scroll", cleanHandler);
  };
}
```

---

## 📝 Example 3 - Áp dụng Immutability khi cập nhật mảng đối tượng

```javascript
const initialProducts = [
  { id: 1, name: "Laptop", price: 1000 },
  { id: 2, name: "Phone", price: 500 }
];

// Cập nhật giá sản phẩm ID=1 theo phong cách Immutable (Dành cho React State)
const updatedProducts = initialProducts.map(product => {
  if (product.id === 1) {
    return { ...product, price: 1200 }; // Tạo object mới
  }
  return product; // Giữ nguyên object cũ
});

console.log("Mảng gốc không đổi price ID=1:", initialProducts[0].price); // 1000
console.log("Mảng mới đã đổi price ID=1:", updatedProducts[0].price); // 1200
```

Output:
```text
Mảng gốc không đổi price ID=1: 1000
Mảng mới đã đổi price ID=1: 1200
```

---

## ⚠️ Notes

1. **`structuredClone()` là hàm chuẩn tốt nhất cho Deep Copy:** Tránh dùng `JSON.parse(JSON.stringify(obj))` vì nó sẽ bị mất các dữ liệu dạng `Date`, `Undefined`, `Set`, `Map` hoặc hàm. `structuredClone()` xử lý chuẩn xác hầu hết các kiểu dữ liệu phức tạp.
2. **Biến Global không bị Garbage Collect:** Các biến gắn vào `window` sẽ tồn tại vĩnh viễn trong RAM cho đến khi đóng tab trình duyệt.

---

## ❌ Common Mistakes

### Sai 1 - Nhầm tưởng toán tử Spread `{...obj}` là Deep Copy
```javascript
const a = { config: { active: true } };
const b = { ...a };
b.config.active = false; 
// ❌ a.config.active cũng bị đổi thành false do config lồng bên trong vẫn bị Shallow Copy!
```

---

## 📚 Summary

- **Call Stack** lưu Primitive & Pointers; **Memory Heap** lưu Objects/Arrays.
- **Garbage Collection (Mark-and-Sweep)** tự động dọn dẹp các vùng nhớ không còn tham chiếu từ Root.
- **Shallow Copy** (`...`) chỉ copy 1 tầng; **Deep Copy** (`structuredClone()`) copy toàn bộ cấu trúc lồng nhau.
- Giữ vững tư duy **Immutability** để mã nguồn an toàn và tương thích hoàn hảo với React.

---

## 📝 Quiz

### Question 1
Thuật toán Garbage Collection chuẩn nào được sử dụng trong các JS Engine hiện đại để xác định và giải phóng các vùng nhớ không còn được tham chiếu?

A. Reference Counting  
B. Mark-and-Sweep  
C. First-In-First-Out  
D. Direct Memory Free  

**Answer: B**

---

### Question 2
Hàm chuẩn nào được tích hợp sẵn trong JS hiện đại (ES2022) giúp thực hiện Sao chép sâu (Deep Copy) một đối tượng phức tạp hoàn toàn độc lập bộ nhớ?

A. `Object.assign()`  
B. `structuredClone()`  
C. `Object.copy()`  
D. `Array.from()`  

**Answer: B**

---

### Question 3
Vùng bộ nhớ nào trong JavaScript Engine được thiết kế để lưu trữ các đối tượng tham chiếu có kích thước lớn và động như Object, Array?

A. Call Stack  
B. Memory Heap  
C. Register CPU  
D. Cache L1  

**Answer: B**
