---
id: react-fundamentals-m3-l2
course: React Fundamentals
module: Side effect, cơ chế render và form
title: Virtual DOM, Reconciliation & React Fiber Architecture
order: 2
difficulty: Intermediate
estimatedTime: 240
---
# Virtual DOM, Reconciliation & React Fiber Architecture

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu tại sao thao tác trực tiếp trên DOM thật (Real DOM) lại chậm và tốn tài nguyên.
- Khám phá cơ chế hoạt động của **Virtual DOM (VDOM)** và quy trình **Reconciliation**.
- Nắm vững thuật toán so sánh **Diffing Algorithm** của React.
- Hiểu kiến trúc **React Fiber** và cách nó chia nhỏ công việc rendering (Interruptible Rendering) trong React 16+.
- Giải thích nguyên lý tại sao các thay đổi State lại được React nhóm lại (**Batching State Updates**).

---

## 📖 Definition

### 1. Thao tác trên Real DOM vs Virtual DOM
Trong các ứng dụng web truyền thống, mỗi khi bạn thay đổi một thuộc tính trên DOM thật, trình duyệt phải thực hiện lại toàn bộ chu trình tính toán lại kiểu dáng (**Recalculate Style**), tính toán vị trí (**Layout / Reflow**) và vẽ lại giao diện (**Paint / Repaint**). Thao tác này cực kỳ tốn tài nguyên CPU/GPU.

**Virtual DOM (DOM ảo)** là một cây đối tượng JavaScript nhẹ nằm trên bộ nhớ RAM, mô phỏng chính xác cấu trúc của cây DOM thật.

### 2. Quy trình Reconciliation & Thuật toán Diffing Algorithm
Khi State hoặc Props của một Component thay đổi:
1. React khởi tạo một cây Virtual DOM mới.
2. React thực hiện so sánh cây VDOM mới với cây VDOM cũ (Quá trình này gọi là **Reconciliation** sử dụng thuật toán **Diffing Algorithm** với độ phức tạp $O(n)$).
3. React xác định chính xác các thay đổi **tối thiểu nhất**.
4. React gom nhóm các thay đổi này lại và chỉ cập nhật đúng những vị trí đó lên cây Real DOM thật (Quá trình **Commit Phase**).

### 3. Kiến trúc React Fiber (React 16+)
Trước React 16 (Stack Reconciler), khi một cây Component lớn re-render, React phải chạy liên tục cho đến khi xong xuôi mà không thể bị ngắt giữa chừng, làm giao diện bị đơ nếu có thao tác gõ phím.

**React Fiber** giới thiệu khả năng **Interruptible Rendering (Cho phép tạm ngắt luồng render)**. Fiber chia nhỏ công việc render thành các đơn vị nhỏ (Fiber Units of Work), ưu tiên các thao tác mượt mà như gõ phím/animation trước, và tạm hoãn các tác vụ render nặng xuống sau.

---

## 💻 Syntax

### Virtual DOM JS Object Node Simulation
```javascript
// Mã JSX: <div className="box"><h1>Hello</h1></div>

// Cấu trúc đối tượng Virtual DOM thật sự của React (VJS Object Node)
const virtualNode = {
  type: "div",
  props: {
    className: "box",
    children: [
      {
        type: "h1",
        props: { children: "Hello" }
      }
    ]
  }
};
```

---

## 📝 Example 1 - Mô phỏng cơ chế Diffing Algorithm đơn giản

```javascript
// Giả lập 2 cây Virtual DOM cũ và mới
const oldVDOM = { type: "button", props: { className: "btn-blue", children: "Click me" } };
const newVDOM = { type: "button", props: { className: "btn-red", children: "Click me" } };

function diff(oldNode, newNode) {
  // Nếu loại thẻ thay đổi -> Tạo lại hoàn toàn node mới
  if (oldNode.type !== newNode.type) {
    return { type: "REPLACE", newNode };
  }

  // Nếu thuộc tính className thay đổi -> Chỉ cập nhật attribute!
  const propPatches = {};
  if (oldNode.props.className !== newNode.props.className) {
    propPatches.className = newNode.props.className;
  }

  return { type: "UPDATE_PROPS", props: propPatches };
}

const patchResult = diff(oldVDOM, newVDOM);
console.log("Kết quả so sánh Diffing Algorithm:", patchResult);
```

Output:
```text
Kết quả so sánh Diffing Algorithm: { type: 'UPDATE_PROPS', props: { className: 'btn-red' } }
```

---

## 📝 Example 2 - Minh chứng cơ chế Automatic Batching State Updates (React 18)

```jsx
import { useState } from "react";

export function BatchingDemo() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  console.log("🔄 Component BatchingDemo vừa Re-render!");

  const handleClick = () => {
    // Trong React 18, 2 lần setState này sẽ được GOM LẠI thành 1 LẦN re-render duy nhất!
    setCount(c => c + 1);
    setFlag(f => !f);
  };

  return (
    <div>
      <h3>Count: {count} | Flag: {flag.toString()}</h3>
      <button onClick={handleClick}>Kích hoạt 2 State Updates cùng lúc</button>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Fiber chia việc thành 2 Giai đoạn (Phases):**
   - **Render Phase (Bất đồng bộ):** So sánh VDOM, tính toán công việc. Giai đoạn này có thể bị tạm dừng, hủy bỏ hoặc chạy lại bởi Fiber Reconciler.
   - **Commit Phase (Đồng bộ):** Áp dụng thay đổi thực tế lên Real DOM và gọi `useEffect`. Giai đoạn này chạy liên tục và không thể bị ngắt.

---

## ❌ Common Mistakes

### Sai 1 - Hiểu nhầm rằng Virtual DOM nhanh hơn DOM thật trong mọi trường hợp
Virtual DOM không nhanh hơn DOM thật về mặt tốc độ thao tác thuần túy trên 1 thẻ đơn lẻ. Điểm mạnh nhất của Virtual DOM là nó giúp lập trình viên viết mã theo phong cách **Khai báo (Declarative UI)** mà không cần tự tay viết hàng trăm dòng code tối ưu DOM thuần thủ công phức tạp.

---

## 📚 Summary

- **Virtual DOM** là bản mô phỏng cây DOM thật trên RAM nhẹ và nhanh.
- **Reconciliation & Diffing Algorithm** so sánh cây VDOM cũ/mới để tìm các thay đổi tối thiểu cần cập nhật lên Real DOM.
- **React Fiber** hỗ trợ chia nhỏ công việc (Interruptible Rendering) nâng cao độ mượt mà của giao diện.
- **Automatic Batching** gom nhóm nhiều lần cập nhật State thành 1 lượt re-render duy nhất.

---

## 📝 Quiz

### Question 1
Mục đích cốt lõi của Virtual DOM trong kiến trúc của React là gì?

A. Thay thế hoàn toàn mã JavaScript  
B. Cho phép lập trình viên viết UI khai báo và giúp React tự động tính toán các thay đổi DOM thật tối thiểu bằng thuật toán Diffing Algorithm  
C. Tự động lưu dữ liệu vào CSDL  
D. Tăng tốc độ đường truyền mạng  

**Answer: B**

---

### Question 2
Cải tiến đột phá nhất mà kiến trúc React Fiber (từ React 16+) mang lại cho quy trình Render là gì?

A. Xóa bỏ hoàn toàn JSX  
B. Cho phép chia nhỏ công việc rendering thành các đơn vị nhỏ có thể bị tạm dừng (Interruptible Rendering) để ưu tiên các tương tác mượt mà của người dùng  
C. Bắt buộc viết mã bằng TypeScript  
D. Không cần dùng `useEffect`  

**Answer: B**

---

### Question 3
Cơ chế "Automatic Batching" trong React 18 giải quyết bài toán nào?

A. Tự động mã hóa mật khẩu  
B. Gom nhóm nhiều câu lệnh cập nhật State liên tiếp thành duy nhất 1 lần Re-render để tối ưu hiệu năng  
C. Tự động xóa file rác  
D. Tự động kiểm tra lỗi cú pháp  

**Answer: B**
