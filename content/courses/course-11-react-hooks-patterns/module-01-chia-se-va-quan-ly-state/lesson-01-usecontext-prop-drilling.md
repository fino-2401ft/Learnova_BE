---
id: react-hooks-patterns-m1-l1
course: React Hooks & Patterns Nâng Cao
module: Chia sẻ và quản lý state
title: useContext — Chia Sẻ State Không Cần Prop Drilling
order: 1
difficulty: Advanced
estimatedTime: 240
---
# useContext — Chia Sẻ State Không Cần Prop Drilling

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu bài toán **Prop Drilling** và lý do tại sao truyền props qua quá nhiều tầng component trung gian gây ô nhiễm mã nguồn.
- Tạo và làm chủ kiến trúc **Context API** trong React với `createContext` và `useContext`.
- Xây dựng các Context Provider chuyên biệt (như AuthProvider, ThemeProvider) để đóng gói state toàn cục.
- Thiết kế Custom Hook bao bọc Context (như `useAuth()`) để kiểm tra an toàn scope sử dụng.
- Đánh giá trường hợp nào nên dùng Context API và khi nào nên dùng giải pháp State Management chuyên dụng.

---

## 📖 Definition

### 1. Vấn đề Prop Drilling
Trong các ứng dụng React lớn, nhiều component ở các nhánh cây giao diện khác nhau có nhu cầu truy cập cùng một dữ liệu (ví dụ: thông tin người dùng đang đăng nhập, giao diện sáng/tối Dark Mode, ngôn ngữ ứng dụng).

Nếu chỉ dùng Props tiêu chuẩn, bạn phải truyền dữ liệu đó qua hàng loạt component trung gian — vốn không hề có nhu cầu sử dụng dữ liệu đó mà chỉ đóng vai trò "chuyển tiếp". Hiện tượng này gọi là **Prop Drilling**, làm cho mã nguồn cực kỳ rườm rà, khó bảo trì và dễ vỡ khi refactor.

### 2. Context API & Hook `useContext()`
**Context API** cung cấp một cách để chia sẻ các giá trị dữ liệu cho toàn bộ cây component bên dưới mà không cần phải truyền props thủ công qua từng cấp.

Quy trình 3 bước làm việc với Context:
1. **Khởi tạo Context:** `const MyContext = createContext(defaultValue);`
2. **Cung cấp dữ liệu với Provider:** Bọc cây component trong `<MyContext.Provider value={data}>`.
3. **Tiêu thụ dữ liệu với `useContext`:** Bất kỳ component con nào nằm trong Provider đều có thể gọi `const data = useContext(MyContext)` để lấy dữ liệu trực tiếp.

---

## 💻 Syntax

### Khởi tạo & Provider Component Pattern
```jsx
import { createContext, useContext, useState } from "react";

// 1. Tạo Context
const ThemeContext = createContext(null);

// 2. Custom Provider Component
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Custom Hook bao bọc useContext
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
```

---

## 📝 Example 1 - Xây dựng AuthProvider quản lý trạng thái Đăng nhập toàn cục

```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = chưa đăng nhập

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user_token", userData.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user_token");
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider!");
  }
  return context;
}
```

---

## 📝 Example 2 - Sử dụng `useAuth` trong Navbar và Profile Page sâu bên trong cây DOM

```jsx
// src/components/Navbar.jsx
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar">
      <h1>EduConnect</h1>
      {isAuthenticated ? (
        <div className="user-menu">
          <span>Xin chào, {user.name}!</span>
          <button onClick={logout}>Đăng xuất</button>
        </div>
      ) : (
        <button onClick={() => alert("Mở modal đăng nhập")}>Đăng nhập</button>
      )}
    </nav>
  );
}

// src/components/UserProfile.jsx (Nằm sâu trong cây component)
export function UserProfile() {
  const { user } = useAuth();
  if (!user) return <p>Vui lòng đăng nhập để xem thông tin.</p>;

  return (
    <div className="profile-card">
      <h2>Hồ sơ cá nhân</h2>
      <p>Họ tên: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Quyền hạn: {user.role}</p>
    </div>
  );
}
```

---

## 📝 Example 3 - Đóng gói ứng dụng tại main.jsx với nhiều Context Providers

```jsx
// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Bọc nhiều Provider lồng nhau để bóc tách trách nhiệm */}
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
```

---

## ⚠️ Notes

1. **Vấn đề Hiệu năng Re-render của Context:** Mỗi khi `value` của `<Context.Provider value={value}>` thay đổi, **TẤT CẢ** các component có gọi `useContext(MyContext)` sẽ bị ép buộc re-render, bất kể chúng có thực sự sử dụng thuộc tính bị thay đổi đó hay không.
2. **Không lạm dụng Context cho tất cả State:** Chỉ nên dùng Context cho dữ liệu có tần suất thay đổi thấp nhưng được sử dụng ở nhiều nơi (như Auth, Theme, Language). Dữ liệu dạng danh sách thay đổi liên tục (như dữ liệu input form) nên giữ trong Local State.

---

## ❌ Common Mistakes

### Sai 1 - Gọi `useContext` ở ngoài phạm vi của Provider
```jsx
// ❌ Gọi useAuth() trong Component nằm NGOÀI <AuthProvider> -> context sẽ nhận defaultValue (null/undefined)
function AppWithoutProvider() {
  const { user } = useAuth(); // Thăng cấp lỗi: useAuth must be used within AuthProvider!
}
```

### Sai 2 - Truyền trực tiếp Object Literal vào Provider làm re-render vô ích
```jsx
// ❌ Sai: Object { user, logout } được tạo mới ở MỖI LẦN parent render -> Ép tất cả consumers re-render!
<AuthContext.Provider value={{ user, logout }}>

// ✅ Khắc phục: Dùng useMemo đóng gói đối tượng value hoặc tách state riêng
```

---

## 📚 Summary

- **Prop Drilling** xảy ra khi phải truyền props qua nhiều tầng trung gian không cần thiết.
- **Context API** (`createContext`, `<Provider>`, `useContext`) giúp chia sẻ state trực tiếp đến bất kỳ component con nào.
- Nên đóng gói Context bằng Custom Provider và Custom Hook (như `useAuth()`) để kiểm tra an toàn.
- Cẩn thận với hiệu năng re-render của Context khi giá trị Provider thay đổi liên tục.

---

## 📝 Quiz

### Question 1
Hiện tượng "Prop Drilling" trong React dùng để chỉ vấn đề gì?

A. Việc gọi API bị hoãn quá lâu  
B. Việc phải truyền Props qua quá nhiều tầng component trung gian không có nhu cầu sử dụng dữ liệu đó  
C. Lỗi cú pháp khi render danh sách  
D. Lỗi tràn bộ nhớ Stack  

**Answer: B**

---

### Question 2
Điều gì sẽ xảy ra với các component con có gọi `useContext(MyContext)` khi thuộc tính `value` của `MyContext.Provider` bị thay đổi?

A. Không có chuyện gì xảy ra  
B. Tất cả các component tiêu thụ Context đó sẽ lập tức được re-render lại  
C. Trình duyệt tự động reload  
D. Component tự động hủy khỏi DOM  

**Answer: B**

---

### Question 3
Dữ liệu nào sau đây là ứng cử viên hàng đầu thích hợp để quản lý bằng Context API?

A. Nội dung ô nhập liệu của form tìm kiếm  
B. Trạng thái giao diện Theme (Light/Dark Mode) và Thông tin xác thực người dùng (Auth User)  
C. Vị trí con trỏ chuột  
D. Biến đếm vòng lặp  

**Answer: B**
