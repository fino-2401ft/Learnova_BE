---
id: react-hooks-patterns-m3-l2
course: React Hooks & Patterns Nâng Cao
module: Hook nâng cao và mẫu component
title: React Concurrent Features: useTransition & useDeferredValue
order: 2
difficulty: Advanced
estimatedTime: 240
---
# React Concurrent Features: useTransition & useDeferredValue

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững kiến trúc **Concurrent React (React Đồng Thời)** trong React 18+.
- Phân biệt giữa **Urgent Updates** (Cập nhật cấp thiết) và **Non-urgent / Transition Updates** (Cập nhật có thể tạm hoãn).
- Làm chủ Hook **`useTransition`** để đánh dấu các lượt cập nhật state nặng mà không làm khựng gõ phím.
- Sử dụng Hook **`useDeferredValue`** để trì hoãn việc tính toán dữ liệu đầu ra dựa trên một giá trị state.
- Cải thiện đáng kể chỉ số hiệu năng **INP (Interaction to Next Paint)** cho các ứng dụng giao diện lớn.

---

## 📖 Definition

### 1. Concurrent React là gì?
Trước React 18, quá trình Rendering là một chuỗi tác vụ liên tục và không thể bị gián đoạn (Blocking Render).

Từ React 18, **Concurrent React** cho phép React tạm dừng, hủy bỏ hoặc tiếp tục quá trình rendering của các tác vụ phụ để ưu tiên cho các tương tác cấp thiết hơn của người dùng.

### 2. Urgent vs Transition Updates
React phân chia các tác vụ cập nhật giao diện làm 2 loại:
- **Urgent Updates (Cấp thiết):** Các phản hồi trực tiếp từ hành động người dùng như gõ phím, click nút, chọn tab. Cần phản hồi ngay lập tức để người dùng không cảm thấy lag.
- **Transition Updates (Tạm hoãn được):** Việc thay đổi nội dung trang, chuyển đổi danh sách kết quả lọc gồm 5.000 phần tử. Các tác vụ này có thể chấp nhận trễ vài mili giây mà không gây cảm giác sững ứng dụng.

### 3. `useTransition` vs `useDeferredValue`
- **`useTransition()`:** Trả về `[isPending, startTransition]`. Dùng `startTransition(() => setState())` để đánh dấu hành động setState đó thuộc loại ưu tiên thấp (Non-urgent).
- **`useDeferredValue(value)`:** Nhận vào một giá trị `value` và trả về một bản sao hoãn lại của giá trị đó. Dùng khi bạn nhận một prop/state từ ngoài vào và muốn hoãn quá trình render lại của component con theo giá trị đó.

---

## 💻 Syntax

### useTransition Syntax
```jsx
import { useState, useTransition } from "react";

const [isPending, startTransition] = useTransition();

const handleChange = (e) => {
  // 1. Urgent update: Ô input nhảy chữ ngay lập tức
  setInputValue(e.target.value);

  // 2. Transition update: Danh sách lọc 10.000 items chạy ngầm không làm đơ input
  startTransition(() => {
    setSearchQuery(e.target.value);
  });
};
```

### useDeferredValue Syntax
```jsx
import { useDeferredValue } from "react";

function HugeList({ query }) {
  // Trì hoãn giá trị query cho đến khi luồng chính rỗi
  const deferredQuery = useDeferredValue(query);
  // ... Render với deferredQuery
}
```

---

## 📝 Example 1 - Tối ưu ô tìm kiếm mượt mà với `useTransition`

```jsx
import { useState, useTransition } from "react";

// Giả lập danh sách 10.000 phần tử
const bigData = Array.from({ length: 10000 }, (_, i) => `Sản phẩm thứ ${i + 1}`);

export function SmoothSearchApp() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleInputChange = (e) => {
    // Urgent: Ô input hiển thị ký tự ngay lập tức!
    setText(e.target.value);

    // Non-urgent: Phép lọc 10.000 items được tạm hoãn không làm khựng gõ phím
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  const filteredItems = bigData.filter(item => item.includes(query));

  return (
    <div className="container">
      <h2>Tìm kiếm sản phẩm mượt mà (Concurrent React)</h2>
      <input value={text} onChange={handleInputChange} placeholder="Gõ từ khóa tìm kiếm..." />

      {/* Hiển thị trạng thái đang tính toán ngầm */}
      {isPending && <span className="spinner">⏳ Đang cập nhật danh sách...</span>}

      <ul style={{ opacity: isPending ? 0.6 : 1 }}>
        {filteredItems.slice(0, 100).map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📝 Example 2 - Trì hoãn Render Component nặng với `useDeferredValue`

```jsx
import { useState, useDeferredValue, memo } from "react";

// Component con nặng render
const HeavyList = memo(({ searchKeyword }) => {
  console.log(`[RENDER HEAVY] Đang render danh sách cho từ khóa: "${searchKeyword}"`);
  const items = Array.from({ length: 5000 }, (_, i) => `${searchKeyword} - Item ${i}`);

  return (
    <ul>
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  );
});

export function DeferredDemoApp() {
  const [keyword, setKeyword] = useState("");

  // ✅ Hoãn giá trị keyword: Khi gõ phím, keyword đổi ngay lập tức nhưng deferredKeyword sẽ đợi luồng chính rỗi mới đổi
  const deferredKeyword = useDeferredValue(keyword);
  const isStale = keyword !== deferredKeyword; // Kiểm tra xem giá trị có đang bị trễ không

  return (
    <div>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Gõ từ khóa..." />
      
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <HeavyList searchKeyword={deferredKeyword} />
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Khác biệt giữa Debounce và Concurrent Features:**
   - **Debounce:** Hoãn việc thực thi lại một khoảng thời gian cố định (như 500ms). Người dùng bắt buộc phải chờ 500ms.
   - **Concurrent React (`useTransition`):** Không có khoảng hoãn cố định. Nếu máy máy tính mạnh, nó sẽ render gần như ngay lập tức. Nếu máy yếu, nó sẽ ưu tiên luồng gõ phím mượt trước rồi mới render danh sách sau.

---

## ❌ Common Mistakes

### Sai 1 - Bọc các thao tác Async / API calls bên trong `startTransition`
```jsx
// ❌ Sai: startTransition chỉ dùng cho các câu lệnh setState ĐỒNG BỘ!
startTransition(async () => {
  const res = await fetch(...);
  setData(res);
});

// ✅ Đúng:
const res = await fetch(...);
startTransition(() => {
  setData(res);
});
```

---

## 📚 Summary

- **Concurrent React** cho phép ngắt luồng render để ưu tiên tương tác người dùng mượt mà.
- **Urgent Updates** (nhập liệu input) cần phản hồi tức thì; **Transition Updates** (kết quả lọc) có thể tạm hoãn.
- **`useTransition`** trả về `[isPending, startTransition]` dùng để bọc hàm `setState` ưu tiên thấp.
- **`useDeferredValue`** trì hoãn việc tính toán dựa trên giá trị của một biến.

---

## 📝 Quiz

### Question 1
Tính năng Concurrent React trong React 18+ giải quyết vấn đề gì cho trải nghiệm người dùng?

A. Tự động mã hóa CSDL  
B. Cho phép tạm dừng hoặc ưu tiên các tác vụ render giúp các tương tác cấp thiết (như gõ phím) không bị giật lag  
C. Thay thế hoàn toàn Redux  
D. Tự động tải file CSS  

**Answer: B**

---

### Question 2
Hook nào trả về trạng thái `isPending` giúp hiển thị hiệu ứng Loading trong khi đang tính toán một lượt cập nhật State có độ ưu tiên thấp?

A. `useDeferredValue`  
B. `useTransition`  
C. `useMemo`  
D. `useLayoutEffect`  

**Answer: B**

---

### Question 3
Điểm khác biệt mấu chốt giữa `useTransition` và kỹ thuật Debounce truyền thống là gì?

A. Debounce chạy nhanh hơn  
B. Debounce hoãn cố định theo một khoảng thời gian (ms), trong khi `useTransition` thích ứng linh hoạt theo tốc độ phần cứng thiết bị  
C. `useTransition` chỉ dùng cho điện thoại  
D. Cả hai hoàn toàn giống nhau  

**Answer: B**
