---
id: javascript-es6-m3-l1
course: JavaScript ES6+ Cơ Bản
module: Cú pháp hiện đại và cơ chế bên dưới
title: ES6 Classes & Modules
order: 1
difficulty: Intermediate
estimatedTime: 240
---
# ES6 Classes & Modules

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững cú pháp tạo Class trong ES6 (Constructor, Instance Methods, Getters/Setters, Static Methods).
- Hiểu tính Kế thừa (Inheritance) trong Class với từ khóa `extends` và hàm `super()`.
- Áp dụng các thuộc tính riêng tư (Private Fields `#`) để đóng gói dữ liệu trong Class (ES2022).
- Sử dụng mô hình ES6 Modules để chia nhỏ mã nguồn (`export`, `import`, `export default`, Named Exports).
- Tổ chức mã nguồn JS chuẩn hóa phục vụ các dự án quy mô lớn.

---

## 📖 Definition

### 1. Class trong ES6 (Syntactic Sugar)
Trong JavaScript, bản chất của hướng đối tượng vẫn dựa trên cơ chế **Prototypal Inheritance** (Kế thừa nguyên mẫu). Từ khóa `class` được giới thiệu từ phiên bản ES6 chỉ là cú pháp viết ngắn gọn ("Syntactic Sugar") giúp các lập trình viên quen thuộc với các ngôn ngữ OOP khác (như Java, C#) dễ tiếp cận hơn.

Các thành phần chính của Class:
- **`constructor()`:** Hàm khởi tạo đặc biệt, tự động thi hành khi tạo một đối tượng mới bằng từ khóa `new`.
- **Getters (`get`) / Setters (`set`):** Định nghĩa các thuộc tính ảo để kiểm soát luồng đọc/ghi dữ liệu.
- **Static Methods (`static`):** Phương thức thuộc về bản thân Class chứ không thuộc về Instance (đối tượng tạo ra).
- **Private Fields (`#field`):** Các thuộc tính bắt đầu bằng dấu `#` chỉ có thể được truy cập bên trong nội bộ Class đó, đảm bảo tính đóng gói (Encapsulation).

### 2. Mô hình ES6 Modules (`import` / `export`)
ES6 Modules là chuẩn mã nguồn mở thức giúp chia chương trình thành nhiều file nhỏ độc lập. Mỗi file là một Module có scope riêng:
- **Named Export:** Có thể export nhiều biến/hàm trong 1 file. Khi import bắt buộc phải ghi đúng tên trong ngoặc nhọn `{ name1, name2 }`.
- **Default Export:** Mỗi file chỉ được có tối đa 1 `export default`. Khi import có thể đặt tên tùy ý và không dùng ngoặc nhọn.

---

## 💻 Syntax

### ES6 Class & Private Fields
```javascript
class BankAccount {
  #balance; // Private field (ES2022)

  constructor(owner, initialBalance = 0) {
    this.owner = owner;
    this.#balance = initialBalance;
  }

  deposit(amount) {
    if (amount > 0) this.#balance += amount;
  }

  get balance() {
    return this.#balance;
  }
}
```

### Inheritance (Kế thừa)
```javascript
class PremiumAccount extends BankAccount {
  constructor(owner, initialBalance, vipTier) {
    super(owner, initialBalance); // Gọi constructor của cha
    this.vipTier = vipTier;
  }
}
```

### Modules Import & Export
```javascript
// Exporting (mathUtils.js)
export const PI = 3.14159;
export function add(a, b) { return a + b; }
export default class Calculator {}

// Importing (app.js)
import Calculator, { PI, add as sum } from "./mathUtils.js";
```

---

## 📝 Example 1 - Khởi tạo Class và Kế thừa (Inheritance)

```javascript
// 1. Base Class: User
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  getProfileInfo() {
    return `User: ${this.name} (${this.email})`;
  }
}

// 2. Derived Class: AdminUser kế thừa từ User
class AdminUser extends User {
  constructor(name, email, permissions = []) {
    super(name, email); // Gọi constructor của class User
    this.permissions = permissions;
  }

  // Override phương thức của class cha
  getProfileInfo() {
    return `[ADMIN] ${super.getProfileInfo()} | Quyền: ${this.permissions.join(", ")}`;
  }

  deleteUser(targetUser) {
    console.log(`Admin ${this.name} đã xóa user: ${targetUser.name}`);
  }
}

const normalUser = new User("Vũ", "vu@gmail.com");
const admin = new AdminUser("Long", "long@admin.com", ["READ", "WRITE", "DELETE"]);

console.log(normalUser.getProfileInfo());
console.log(admin.getProfileInfo());
admin.deleteUser(normalUser);
```

Output:
```text
User: Vũ (vu@gmail.com)
[ADMIN] User: Long (long@admin.com) | Quyền: READ, WRITE, DELETE
Admin Long đã xóa user: Vũ
```

---

## 📝 Example 2 - Đóng gói dữ liệu với Private Fields (`#`) và Getter/Setter

```javascript
class ProductItem {
  #price; // Khai báo thuộc tính riêng tư

  constructor(name, price) {
    this.name = name;
    this.price = price; // Gọi setter bên dưới để validate
  }

  // Getter cho price
  get price() {
    return this.#price;
  }

  // Setter cho price kiểm tra logic bảo vệ
  set price(newPrice) {
    if (typeof newPrice !== "number" || newPrice < 0) {
      throw new Error("Giá sản phẩm phải là số dương hợp lệ!");
    }
    this.#price = newPrice;
  }
}

const item = new ProductItem("Tai nghe Bluetooth", 500000);
console.log("Giá sản phẩm:", item.price); // Output: 500000

try {
  item.price = -1000; // Cố tình gán giá âm
} catch (err) {
  console.log("Lỗi:", err.message); // Thăng cấp lỗi bảo vệ
}

// console.log(item.#price); // ❌ SyntaxError: Private field '#price' must be declared in an enclosing class
```

Output:
```text
Giá sản phẩm: 500000
Lỗi: Giá sản phẩm phải là số dương hợp lệ!
```

---

## 📝 Example 3 - Cấu trúc ES6 Modules thực tế

File `services/apiService.js`:
```javascript
const BASE_URL = "https://api.example.com";

// Named Export
export async function fetchData(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  return res.json();
}

// Default Export
export default class ApiClient {
  static getBaseUrl() {
    return BASE_URL;
  }
}
```

File `app.js`:
```javascript
import ApiClient, { fetchData } from "./services/apiService.js";

console.log("Base URL:", ApiClient.getBaseUrl());
```

---

## ⚠️ Notes

1. **Quên từ khóa `super()` trong Class con:** Trong hàm `constructor` của một Class kế thừa (`extends`), bạn **bắt buộc** phải gọi `super()` trước khi sử dụng từ khóa `this`. Nếu không, JS sẽ báo lỗi `ReferenceError`.
2. **Private field cần khai báo ở đầu Class:** Khác với thuộc tính công khai có thể gán trực tiếp qua `this.prop`, các private field `#field` bắt buộc phải được khai báo ở phần thân class trước khi sử dụng trong constructor.
3. **Thẻ Script hỗ trợ Module trong Browser:** Khi nhúng file JS sử dụng cú pháp `import/export` vào HTML, thẻ script bắt buộc phải có thuộc tính `type="module"`: `<script type="module" src="app.js"></script>`.

---

## ❌ Common Mistakes

### Sai 1 - Gọi `this` trước `super()` trong Class con
```javascript
class Animal {}
class Dog extends Animal {
  constructor(name) {
    this.name = name; // ❌ ReferenceError: Must call super constructor in derived class before accessing 'this'
    super();
  }
}
```

### Sai 2 - Nhầm lẫn giữa Named Export và Default Export khi import
```javascript
// Nếu math.js có: export default function add() {}
import { add } from "./math.js"; // ❌ Lỗi vì 'add' là default export chứ không phải named export

// Đúng:
import add from "./math.js"; // ✅
```

---

## 📚 Summary

- `class` giúp lập trình OOP dễ đọc hơn dựa trên nguyên lý Prototypal Inheritance.
- Dùng `extends` để kế thừa và gọi `super()` trong `constructor` của class con.
- Sử dụng private fields với dấu `#` để thực thi tính đóng gói an toàn.
- Dùng ES6 Modules (`export` / `import`) để phân rã và quản lý file mã nguồn chuyên nghiệp.

---

## 📝 Quiz

### Question 1
Điều gì xảy ra khi bạn truy cập trực tiếp thuộc tính riêng tư `account.#balance` từ bên ngoài Class?

A. Trả về `undefined`  
B. Trả về `null`  
C. Báo lỗi `SyntaxError` / `TypeError` ngay lập tức  
D. Trả về giá trị bình thường  

**Answer: C**

---

### Question 2
Một file JavaScript có thể chứa tối đa bao nhiêu `export default` statement?

A. Không giới hạn  
B. Tối đa 2  
C. Tối đa 1  
D. Tùy thuộc vào số lượng Class  

**Answer: C**

---

### Question 3
Từ khóa nào bắt buộc phải được gọi đầu tiên trong constructor của một Class con kế thừa trước khi truy cập từ khóa `this`?

A. `this.init()`  
B. `super()`  
C. `parent()`  
D. `base()`  

**Answer: B**
