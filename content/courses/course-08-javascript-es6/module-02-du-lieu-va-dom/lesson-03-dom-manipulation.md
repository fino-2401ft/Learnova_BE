---
id: javascript-es6-m2-l3
course: JavaScript ES6+ Cơ Bản
module: Dữ liệu và DOM
title: DOM Manipulation
order: 3
difficulty: Intermediate
estimatedTime: 240
---
# DOM Manipulation

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu cấu trúc cây DOM (Document Object Model) và mối quan hệ giữa các Node.
- Tìm kiếm và lựa chọn Element hiệu quả với `querySelector`, `querySelectorAll`, `getElementById`.
- Thay đổi nội dung, thuộc tính và kiểu dáng (CSS) của thẻ HTML bằng JavaScript.
- Tạo mới, chèn và xóa bớt Element khỏi DOM tree.
- Lắng nghe và xử lý sự kiện (Events), áp dụng kỹ thuật **Event Delegation** để tối ưu hóa hiệu năng ứng dụng giao diện.

---

## 📖 Definition

### 1. Document Object Model (DOM) là gì?
DOM là giao diện lập trình (API) đại diện cho tài liệu HTML dưới dạng một cây cấu trúc dạng phân cấp (DOM Tree). Mỗi thẻ HTML, đoạn văn bản, hay thuộc tính đều được coi là một **Node** trên cây DOM. JavaScript có thể truy cập và thao tác với cây DOM để thay đổi nội dung, cấu trúc và giao diện trang web một cách động.

### 2. Các phương thức truy vấn Element (Selecting Elements)
- **`getElementById(id)`:** Lựa chọn duy nhất một phần tử theo ID. Nhanh nhất về mặt hiệu năng.
- **`querySelector(selector)`:** Tìm kiếm và trả về phần tử **đầu tiên** khớp với chuỗi CSS Selector.
- **`querySelectorAll(selector)`:** Trả về một **NodeList** (tập hợp giống mảng) chứa tất cả các phần tử khớp với CSS Selector.

### 3. Thao tác Nội dung & Style
- **`textContent` vs `innerHTML`:** `textContent` chỉ thao tác với văn bản thuần túy (an toàn trước tấn công XSS). `innerHTML` cho phép chèn cả chuỗi mã HTML (cần cẩn trọng sanitizer).
- **`classList` API:** Phương thức chuẩn nhất để bật/tắt class CSS (`add`, `remove`, `toggle`, `contains`).

### 4. Kỹ thuật Event Delegation (Ủy quyền sự kiện)
Thay vì gắn hàm lắng nghe sự kiện (`addEventListener`) cho hàng trăm nút bấm con riêng lẻ, ta gắn **duy nhất một sự kiện cho phần tử cha chứa chúng**. Nhờ cơ chế nổi sự kiện (**Event Bubbling**), khi bất kỳ phần tử con nào bị click, sự kiện sẽ lan truyền lên phần tử cha. Ta có thể kiểm tra `event.target` để xử lý chính xác, giúp tiết kiệm bộ nhớ và tự động làm việc với cả các phần tử được thêm mới sau này.

---

## 💻 Syntax

### Query Elements
```javascript
const singleElem = document.querySelector(".btn-submit");
const allElems = document.querySelectorAll("ul.list > li"); // Tra về NodeList
```

### Create & Append Element
```javascript
const newDiv = document.createElement("div");
newDiv.className = "card-item";
newDiv.textContent = "Nội dung card";

document.body.appendChild(newDiv);
```

### Event Listener & Delegation
```javascript
// Gắn event trực tiếp
button.addEventListener("click", (event) => {
  event.preventDefault();
});

// Event Delegation trên container
parentElement.addEventListener("click", (event) => {
  if (event.target.matches(".delete-btn")) {
    // Xử lý khi nút xóa được click
  }
});
```

---

## 📝 Example 1 - Truy vấn và Cập nhật Style / ClassList

```javascript
// HTML giả định: <div id="card" class="card"><h2>Header</h2><button id="toggleBtn">Dark Mode</button></div>

const cardElem = document.querySelector("#card");
const toggleBtn = document.querySelector("#toggleBtn");

if (cardElem && toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    // Toggle class "dark-theme"
    cardElem.classList.toggle("dark-theme");

    const isDark = cardElem.classList.contains("dark-theme");
    toggleBtn.textContent = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";

    // Thay đổi style inline động
    cardElem.style.border = isDark ? "2px solid white" : "1px solid #ccc";
  });
}
```

---

## 📝 Example 2 - Tạo danh sách sản phẩm động với `createElement` & `insertAdjacentHTML`

```javascript
const products = [
  { id: 1, title: "Khóa học React Pro", price: "500.000đ" },
  { id: 2, title: "Khóa học Node.js Expert", price: "450.000đ" }
];

const container = document.querySelector("#product-list");

function renderProducts(items) {
  if (!container) return;
  container.innerHTML = ""; // Clear danh sách cũ

  items.forEach(product => {
    // Dùng insertAdjacentHTML nhanh và sạch
    const cardHTML = `
      <div class="product-item" data-id="${product.id}">
        <h3>${product.title}</h3>
        <p>Giá: ${product.price}</p>
        <button class="btn-buy">Mua ngay</button>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", cardHTML);
  });
}

renderProducts(products);
```

---

## 📝 Example 3 - Áp dụng Kỹ thuật Event Delegation cho danh sách Todo

```javascript
// HTML giả định: <ul id="todoContainer"><li data-id="1">Task A <button class="btn-del">✕</button></li></ul>

const todoContainer = document.querySelector("#todoContainer");

if (todoContainer) {
  // Lắng nghe duy nhất 1 listener tại thẻ <ul>
  todoContainer.addEventListener("click", (event) => {
    const target = event.target;

    // Kiểm tra xem user click vào nút xóa
    if (target.classList.contains("btn-del")) {
      const listItem = target.closest("li");
      const taskId = listItem?.dataset.id;
      
      console.log(`Đã xóa task id = ${taskId}`);
      listItem?.remove(); // Xóa thẻ <li> ra khỏi DOM
    }
  });
}
```

---

## ⚠️ Notes

1. **Phân biệt `NodeList` và Array thực thụ:** `querySelectorAll` trả về `NodeList`. Mặc dù `NodeList` hỗ trợ hàm `forEach()`, nhưng nó không có các hàm mảng như `map()`, `filter()`, `reduce()`. Hãy biến đổi nó thành mảng nếu cần: `const arrayElems = Array.from(nodeList)` hoặc `[...nodeList]`.
2. **Nguy cơ XSS với `innerHTML`:** Tuyệt đối không dùng `innerHTML` để chèn trực tiếp các chuỗi nhập từ người dùng (như ô input). Kẻ tấn công có thể chèn các đoạn mã `<script>` hoặc `<img src="x" onerror="...">` độc hại. Hãy dùng `textContent` cho văn bản thuần.
3. **Gọi `preventDefault()` trên Form Event:** Sự kiện `submit` của Form mặc định sẽ reload lại trang web. Luôn gọi `event.preventDefault()` trong hàm xử lý submit để ngăn hành vi mặc định này.

---

## ❌ Common Mistakes

### Sai 1 - Truy vấn Element khi DOM chưa hoàn tất load (Script đặt ở `<head>` không có `defer`)
```html
<head>
  <script>
    // ❌ null vì thẻ #myBtn chưa tồn tại khi script chạy
    document.querySelector("#myBtn").addEventListener("click", () => {}); 
  </script>
</head>
```
*Khắc phục:* Thêm thuộc tính `defer` vào thẻ `<script src="..." defer>` hoặc đặt script ở ngay trước thẻ đóng `</body>`.

### Sai 2 - Gắn event listener trong vòng lặp thay vì dùng Event Delegation
```javascript
// ❌ Gây hao phí bộ nhớ khi có hàng ngàn phần tử
document.querySelectorAll(".item-btn").forEach(btn => {
  btn.addEventListener("click", handleBuy);
});
```

### Sai 3 - Quên dùng `event.target.closest()` khi click vào phần tử con bên trong nút
```javascript
// ❌ Nếu nút bấm chứa icon <span>, target có thể lọt vào <span> chứ không phải nút <button>
const btn = event.target.closest(".btn-action"); // ✅ Tìm phần tử thẻ cha gần nhất matching selector
```

---

## 📚 Summary

- DOM Tree cấu trúc lại tài liệu HTML thành cây các đối tượng Node.
- Sử dụng `querySelector` / `querySelectorAll` để tìm kiếm phần tử linh hoạt với CSS Selector.
- Dùng `classList` để thay đổi giao diện thông qua CSS thay vì trực tiếp chỉnh `style` từng thuộc tính.
- Áp dụng **Event Delegation** trên thẻ cha để quản lý sự kiện của các thẻ con linh hoạt, tiết kiệm tài nguyên.

---

## 📝 Quiz

### Question 1
Phương thức nào sau đây được khuyến nghị sử dụng để chèn văn bản thuần túy vào một Element nhằm tránh nguy cơ bảo mật XSS?

A. `innerHTML`  
B. `outerHTML`  
C. `textContent`  
D. `insertAdjacentHTML`  

**Answer: C**

---

### Question 2
Cơ chế nào cho phép sự kiện nổi dần từ phần tử con bị tác động lên trên các phần tử cha trong cây DOM?

A. Event Capturing  
B. Event Bubbling  
C. Event Delegation  
D. Event Prevention  

**Answer: B**

---

### Question 3
Phương thức nào dưới đây dùng để bật hoặc tắt (toggle) một class CSS trên một Element?

A. `element.classList.add()`  
B. `element.classList.remove()`  
C. `element.classList.toggle()`  
D. `element.setAttribute("class", "")`  

**Answer: C**
