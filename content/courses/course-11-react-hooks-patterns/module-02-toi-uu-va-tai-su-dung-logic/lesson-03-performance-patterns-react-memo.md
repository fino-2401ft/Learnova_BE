---
id: react-hooks-patterns-m2-l3
course: React Hooks & Patterns Nâng Cao
module: Tối ưu và tái sử dụng logic
title: Performance Patterns & React.memo
order: 3
difficulty: Advanced
estimatedTime: 240
---
# Performance Patterns & React.memo

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân biệt 4 nguyên nhân chính kích hoạt Re-render trong React.
- Làm chủ HOC **`React.memo`** để ngăn chặn Re-render không cần thiết cho Component con khi Props không thay đổi.
- Viết custom comparison function cho `React.memo` khi làm việc với đối tượng Props phức tạp.
- Đo lường và xác định nghẽn hiệu năng giao diện bằng **React Developer Tools Profiler**.
- Áp dụng các mẫu thiết kế tối ưu hóa cấu trúc Component (như Moving State Down, Passing Component as Children).

---

## 📖 Definition

### 1. Khi nào một React Component re-render?
Một Component trong React sẽ được lên lịch re-render khi xảy ra 1 trong 4 lý do:
1. **State nội bộ thay đổi** (`useState`, `useReducer`).
2. **Component cha (Parent) re-render** (Mặc định, tất cả các con cũng sẽ bị re-render theo!).
3. **Context Value thay đổi** (khi component có dùng `useContext`).
4. **Props truyền vào bị thay đổi.**

### 2. High-Order Component `React.memo`
Mặc định trong React, khi một Component cha re-render, toàn bộ cây Component con của nó sẽ **bị re-render lại**, ngay cả khi Props truyền xuống con không hề thay đổi.

`React.memo` là một HOC (Higher-Order Component) giúp bọc ngoài một Component.
- Trước khi re-render Component con, `React.memo` sẽ thực hiện **Shallow Comparison (So sánh nông `===`)** giữa Props mới và Props cũ.
- Nếu tất cả Props **giữ nguyên giá trị**, React sẽ bỏ qua lượt re-render của Component con đó và tái sử dụng kết quả HTML render từ lượt trước.

---

## 💻 Syntax

### React.memo Basic Usage
```jsx
import { memo } from "react";

// Bọc Component bằng memo
export const ChildComponent = memo(function ChildComponent({ title, count }) {
  console.log("Child render");
  return <div>{title}: {count}</div>;
});
```

### Custom Props Comparison Function
```jsx
export const AdvancedCard = memo(
  function AdvancedCard({ user }) {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    // Trả về true nếu muốn BỎ QUA re-render (Props bằng nhau)
    // Trả về false nếu muốn KÍCH HOẠT re-render
    return prevProps.user.id === nextProps.user.id &&
           prevProps.user.updatedAt === nextProps.user.updatedAt;
  }
);
```

---

## 📝 Example 1 - Sửa lỗi Re-render thừa với `React.memo` kết hợp `useCallback`

```jsx
import { useState, useCallback, memo } from "react";

// Component con nặng render được bọc React.memo
const ExpensiveUserItem = memo(({ user, onDelete }) => {
  console.log(`[RENDER CON] UserItem ID ${user.id} vừa render lại`);
  return (
    <div className="user-item">
      <span>{user.name}</span>
      <button onClick={() => onDelete(user.id)}>Xóa</button>
    </div>
  );
});

export function UserListApp() {
  const [users, setUsers] = useState([
    { id: 1, name: "Nguyễn Văn A" },
    { id: 2, name: "Trần Văn B" }
  ]);
  const [counter, setCounter] = useState(0);

  // ✅ BẮT BUỘC: Phải dùng useCallback giữ cố định hàm onDelete,
  // nếu không React.memo sẽ thấy onDelete là hàm mới ở mỗi lượt render -> Thất bại!
  const handleDeleteUser = useCallback((id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  return (
    <div>
      <h2>Bộ đếm phụ: {counter}</h2>
      <button onClick={() => setCounter(c => c + 1)}>+ Tăng biến đếm</button>

      <h3>Danh sách người dùng:</h3>
      {/* Tăng counter sẽ KHÔNG làm các ExpensiveUserItem bị re-render lại */}
      {users.map(user => (
        <ExpensiveUserItem key={user.id} user={user} onDelete={handleDeleteUser} />
      ))}
    </div>
  );
}
```

---

## 📝 Example 2 - Tối ưu hóa hiệu năng KHÔNG CẦN `React.memo` bằng cách Tách nhỏ State (Moving State Down)

```jsx
// ❌ CÁCH XẤU: State ô gõ phím đặt ở thẻ cha làm cả bảng dữ liệu nặng re-render mỗi lần gõ!
export function BadLayout() {
  const [text, setText] = useState("");
  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <VeryHeavyChartData /> {/* Re-render liên tục mỗi lần gõ 1 ký tự! */}
    </div>
  );
}

// ✅ CÁCH TỐT (Moving State Down): Đưa ô input và state của nó xuống Component riêng
function SearchInput() {
  const [text, setText] = useState("");
  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}

export function GoodLayout() {
  return (
    <div>
      <SearchInput /> {/* Khi gõ chữ, chỉ SearchInput re-render! */}
      <VeryHeavyChartData /> {/* Giữ nguyên không hề bị re-render */}
    </div>
  );
}
```

---

## ⚠️ Notes

1. **`React.memo` chỉ so sánh nông (Shallow Comparison):** Nếu bạn truyền một Prop dạng Object `{ a: 1 }` hoặc Array `[1, 2]` trực tiếp mà không qua `useMemo`, `React.memo` vẫn thấy địa chỉ ô nhớ khác nhau và vẫn tiến hành re-render Component con!
2. **Quy trình tối ưu hóa 3 bước:** 
   1. Đo lường xác định đúng vị trí bị lag với React Profiler.
   2. Tối ưu cấu trúc Component trước (Moving State Down / Passing as Children).
   3. Mới dùng tới `React.memo`, `useMemo`, `useCallback`.

---

## ❌ Common Mistakes

### Sai 1 - Bọc `React.memo` cho Component con nhưng lại truyền Inline Function từ cha
```jsx
// ❌ Sai: Inline function () => handleDelete(id) tạo mới địa chỉ ô nhớ mỗi lượt render -> Vô hiệu hóa React.memo!
<ChildMemoComponent onClick={() => handleDelete(id)} />

// ✅ Đúng: Dùng useCallback cho handler trước khi truyền
<ChildMemoComponent onClick={handleDeleteCallback} />
```

---

## 📚 Summary

- Component re-render khi: State đổi, Props đổi, Context đổi, hoặc **Parent re-render**.
- **`React.memo`** ngăn Component con re-render lại nếu Props không thay đổi (Shallow Compare).
- `React.memo` chỉ thực sự phát huy tác dụng khi các Props dạng hàm/đối tượng được giữ cố định bằng `useCallback` / `useMemo`.
- Ưu tiên phương pháp tái cấu trúc Component (Moving State Down) trước khi lạm dụng `React.memo`.

---

## 📝 Quiz

### Question 1
Mặc định trong React, khi một Component cha (Parent) re-render thì điều gì sẽ xảy ra với tất cả các Component con của nó?

A. Tất cả Component con đều sẽ bị re-render theo  
B. Component con chỉ re-render nếu được kết nối CSDL  
C. Component con bị hủy khỏi DOM  
D. Component con không bị ảnh hưởng  

**Answer: A**

---

### Question 2
HOC `React.memo` giúp tối ưu hóa hiệu năng bằng cơ chế nào?

A. Tự động chuyển mã nguồn thành WebAssembly  
B. So sánh các Props cũ và mới; nếu Props giữ nguyên giá trị thì bỏ qua lượt re-render của Component con  
C. Lưu dữ liệu vào LocalStorage  
D. Tự động xóa các file rác  

**Answer: B**

---

### Question 3
Tại sao một Component con được bọc `React.memo` vẫn bị re-render lại khi Component cha re-render nếu bạn truyền một inline callback function (như `onClick={() => doSomething()}`)?

A. Do React bị lỗi  
B. Do inline function tạo ra một địa chỉ ô nhớ mới hoàn toàn ở mỗi lượt render của cha, làm phép so sánh nông (`===`) của `React.memo` đánh giá là Props đã thay đổi  
C. Do `React.memo` không hỗ trợ hàm  
D. Do thẻ HTML không hỗ trợ click  

**Answer: B**
