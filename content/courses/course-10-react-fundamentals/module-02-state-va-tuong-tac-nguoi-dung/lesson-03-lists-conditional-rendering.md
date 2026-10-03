---
id: react-fundamentals-m2-l3
course: React Fundamentals
module: State và tương tác người dùng
title: Lists & Conditional Rendering
order: 3
difficulty: Beginner
estimatedTime: 240
---
# Lists & Conditional Rendering

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Biến đổi mảng dữ liệu thành danh sách phần tử giao diện JSX bằng phương thức `map()`.
- Hiểu tầm quan trọng của thuộc tính **`key` prop** và quy trình React Reconciliation.
- Áp dụng các mẫu Render có điều kiện (Conditional Rendering): Toán tử 3 ngôi (Ternary), Toán tử `&&`, Early Return Pattern.
- Xử lý các trường hợp giao diện đặc biệt: Trạng thái đang tải dữ liệu (Loading State) và Trạng thái danh sách rỗng (Empty State).
- Tránh các cạm bẫy phổ biến khi dùng toán tử `&&` với số `0`.

---

## 📖 Definition

### 1. Render Danh Sách (Rendering Lists)
Trong React, để hiển thị một tập hợp các phần tử giống nhau (như danh sách sản phẩm, tin tức, người dùng), ta dùng phương thức `map()` của mảng để chuyển đổi từng phần tử dữ liệu thành một đoạn mã JSX tương ứng.

### 2. Thuộc tính `key` Prop trong React
Khi bạn render một danh sách các thẻ trong React, mỗi phần tử JSX trong danh sách **bắt buộc phải có một thuộc tính `key` với giá trị duy nhất (Unique Key)**.

- **Vai trò của `key`:** `key` giúp thuật toán so sánh DOM ảo của React (**Reconciliation / Diffing Algorithm**) nhận biết chính xác phần tử nào đã bị thay đổi, thêm mới hay xóa bỏ.
- **Giá trị chuẩn cho `key`:** Sử dụng ID duy nhất đến từ CSDL (như `item.id`, `user.uuid`). Hạn chế tối đa việc sử dụng chỉ số mảng (`index`) làm `key` khi danh sách có thao tác sắp xếp, thêm/xóa phần tử.

### 3. Conditional Rendering (Render Có Điều Kiện)
Conditional Rendering là kỹ thuật quyết định đoạn mã JSX nào sẽ được hiển thị ra màn hình dựa trên các điều kiện dữ liệu hiện tại (như trạng thái đăng nhập, dữ liệu đang tải, phân quyền người dùng).

Các kỹ thuật phổ biến:
- **Ternary Operator (`condition ? <A/> : <B/>`):** Chọn 1 trong 2 nhánh giao diện.
- **Logical AND Operator (`condition && <A/>`):** Hiển thị giao diện `<A/>` khi điều kiện đúng, ngược lại không hiển thị gì.
- **Early Return Pattern:** Sử dụng câu lệnh `if` ở đầu hàm Component để trả về giao diện Loading/Error trước khi chạy logic chính.

---

## 💻 Syntax

### List Rendering với Key
```jsx
const items = [{ id: "A1", name: "Táo" }, { id: "B2", name: "Cam" }];

return (
  <ul>
    {items.map(item => (
      <li key={item.id}>{item.name}</li>
    ))}
  </ul>
);
```

### Conditional Rendering Patterns
```jsx
// 1. Ternary Operator
{isLoggedIn ? <UserAvatar /> : <LoginButton />}

// 2. Short-circuit &&
{unreadCount > 0 && <span className="badge">{unreadCount}</span>}

// 3. Early Return
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
```

---

## 📝 Example 1 - Render danh sách bài học kèm thuộc tính Key chuẩn mực

```jsx
export function LessonList({ lessons }) {
  // Early return nếu danh sách chưa sẵn sàng
  if (!lessons || lessons.length === 0) {
    return <div className="empty-state">📌 Chưa có bài học nào trong khóa này!</div>;
  }

  return (
    <div className="lesson-container">
      <h3>Danh sách bài học ({lessons.length})</h3>
      <ul className="lesson-list">
        {lessons.map((lesson) => (
          <li key={lesson.id} className={`lesson-item ${lesson.isFree ? "free" : ""}`}>
            <span className="title">{lesson.title}</span>
            <span className="duration">{lesson.duration} phút</span>
            {lesson.isFree ? (
              <button className="btn-preview">Học thử</button>
            ) : (
              <span className="lock-icon">🔒 Khóa</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📝 Example 2 - Xử lý đầy đủ các trạng thái Loading, Error và Data State

```jsx
import { useState } from "react";

export function UserProfileCard({ userId }) {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Early Return 1: Đang tải dữ liệu
  if (isLoading) {
    return <div className="skeleton-loader">⏳ Đang tải thông tin người dùng...</div>;
  }

  // Early Return 2: Gặp lỗi
  if (errorMessage) {
    return <div className="error-card">❌ Lỗi: {errorMessage}</div>;
  }

  // Early Return 3: Không có dữ liệu
  if (!userData) {
    return <div className="no-data">Không tìm thấy thông tin cho ID {userId}</div>;
  }

  // Render chính khi có dữ liệu
  return (
    <div className="user-card">
      <img src={userData.avatar} alt={userData.name} />
      <h2>{userData.name}</h2>
      <p>Email: {userData.email}</p>
      {userData.role === "admin" && <span className="badge-admin">Quản trị viên</span>}
    </div>
  );
}
```

---

## 📝 Example 3 - Cạm bẫy toán tử `&&` với số 0 và cách khắc phục

```jsx
export function CartNotification({ cartItems }) {
  const itemCount = cartItems.length;

  return (
    <div className="cart-header">
      🛒 Giỏ hàng
      {/* ❌ SAI: Nếu itemCount là 0, biểu thức (0 && ...) sẽ in ra số "0" lên giao diện! */}
      {/* {itemCount && <span className="badge">{itemCount}</span>} */}

      {/* ✅ ĐÚNG 1: Ép kiểu rõ ràng về Boolean */}
      {itemCount > 0 && <span className="badge">{itemCount}</span>}

      {/* ✅ ĐÚNG 2: Dùng toán tử ba ngôi */}
      {/* {itemCount > 0 ? <span className="badge">{itemCount}</span> : null} */}
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Không dùng `Math.random()` để làm `key`:** Nếu bạn viết `key={Math.random()}`, mỗi lần re-render React sẽ coi đó là một phần tử hoàn toàn mới và tiến hành phá hủy/tạo lại DOM node cũ, gây mất dữ liệu state nội bộ và làm suy giảm hiệu năng nghiêm trọng.
2. **Không dùng `index` làm `key` khi danh sách có thay đổi thứ tự:** Nếu bạn xóa phần tử ở giữa mảng hoặc sắp xếp lại mảng, việc dùng `index` làm `key` sẽ khiến React nhầm lẫn dữ liệu state giữa các phần tử với nhau.

---

## ❌ Common Mistakes

### Sai 1 - Để lọt số `0` lên giao diện do dùng toán tử `&&` không cẩn thận
```jsx
const items = [];
// ❌ Sẽ hiển thị chữ số "0" lên màn hình web thay vì không hiển thị gì!
return <div>{items.length && <List items={items} />}</div>; 

// ✅ Khắc phục: So sánh lớn hơn 0
return <div>{items.length > 0 && <List items={items} />}</div>;
```

### Sai 2 - Quên truyền thuộc tính `key` cho phần tử ngoài cùng trong `map()`
```jsx
// ❌ Cảnh báo warning trong Console: Each child in a list should have a unique "key" prop
{users.map(user => (
  <div>
    <h3>{user.name}</h3>
  </div>
))}
```

---

## 📚 Summary

- Dùng `map()` để biến đổi danh sách dữ liệu thành các đoạn JSX.
- Mỗi phần tử trong danh sách bắt buộc phải có thuộc tính **`key` độc nhất** (ưu tiên ID từ CSDL).
- Sử dụng **Ternary Operator** cho 2 nhánh giao diện và **`&&`** cho 1 nhánh giao diện.
- Luôn kiểm tra điều kiện dạng Boolean `count > 0` khi dùng `&&` để tránh lọt số `0` ra giao diện.

---

## 📝 Quiz

### Question 1
Tại sao mỗi phần tử được tạo ra từ phương thức `map()` trong React bắt buộc phải có thuộc tính `key` duy nhất?

A. Để trình duyệt tính toán kích thước chiều rộng của thẻ  
B. Giúp thuật toán Reconciliation của React xác định chính xác phần tử nào bị thay đổi, thêm hoặc xóa để tối ưu re-render  
C. Để kết nối phần tử với thuộc tính CSS Hover  
D. Bắt buộc bởi chuẩn HTML5  

**Answer: B**

---

### Question 2
Đoạn mã JSX `{count && <span>Số lượng: {count}</span>}` sẽ hiển thị gì ra màn hình khi giá trị `count = 0`?

A. Không hiển thị gì hết  
B. Chữ số `0`  
C. Thẻ `<span>Số lượng: 0</span>`  
D. Cảnh báo lỗi `NaN`  

**Answer: B**

---

### Question 3
Giá trị nào dưới đây được khuyến nghị sử dụng làm `key` prop cho các phần tử trong danh sách?

A. `Math.random()`  
B. Chỉ số phần tử mảng `index`  
C. Mã ID duy nhất từ dữ liệu CSDL (như `item.id`)  
D. Tên của Component  

**Answer: C**
