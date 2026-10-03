---
id: react-router-api-m1-l2
course: React Router & API Integration
module: Định tuyến với React Router
title: Protected Routes & Auth Flow
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Protected Routes & Auth Flow

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích kiến trúc bảo vệ các tuyến đường riêng tư (**Protected Routes**) và phân quyền người dùng theo vai trò (**Role-based Authorization**).
- Khởi tạo và thiết kế Component Wrapper **`<ProtectedRoute />`** sử dụng thẻ declarative **`<Navigate />`**.
- Trích xuất và lưu trữ vị trí trang cũ bằng đối tượng `location.state` để thực hiện tự động chuyển hướng quay trở lại (**Redirect Back**) sau khi đăng nhập thành công.
- Xây dựng luồng Đăng nhập / Đăng xuất hoàn chỉnh (**Authentication Flow**) kết hợp React Context hoặc Redux State.
- Xử lý các tuyến đường công khai chỉ truy cập khi chưa đăng nhập (**Public Only Routes**) ngăn người dùng đã đăng nhập quay lại trang Login/Register.
- Quản lý trạng thái chờ xác thực (Auth Loading State) tránh hiện tượng nôn nóng redirect nhầm người dùng.

---

## 📖 Definition

### 1. Protected Routes (Tuyến Đường Được Bảo Vệ) Là Gì?

Trong các ứng dụng web thực tế, hệ thống luôn được chia làm 2 vùng định tuyến chính:
1. **Public Routes (Tuyến đường công khai):** Ai cũng có thể truy cập (như Trang chủ `/`, Trang giới thiệu `/about`, Trang danh sách khóa học `/courses`).
2. **Private / Protected Routes (Tuyến đường riêng tư):** Bắt buộc phải xác thực danh tính (như Dashboard `/dashboard`, Trang thanh toán `/checkout`, Hồ sơ cá nhân `/profile`, hay Admin Panel `/admin`).

**Protected Route** đóng vai trò là một Component wrapper "người gác cổng" (Guard Component):
- Nó đọc trạng thái đăng nhập hiện tại (`isAuthenticated`) và danh sách quyền hạn (`roles`).
- **Nếu hợp lệ:** Cho phép render nội dung trang con (`children` hoặc `<Outlet />`).
- **Nếu chưa đăng nhập:** Lập tức chặn lại và điều hướng người dùng sang trang `/login`.
- **Nếu không đủ quyền:** Điều hướng người dùng sang trang `/unauthorized` (Mã lỗi 403).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   LUỒNG ĐỊNH TUYẾN PROTECTED ROUTE                      │
└────────────────────────────────────────────────────────────────────────┘

 [ User truy cập /dashboard ] ───> [ ProtectedRoute Wrapper ]
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
            [ Chưa Đăng Nhập ]                                  [ Đã Đăng Nhập ]
                    │                                                   │
          Lưu location.state                               Check Role có khớp không?
          Redirect ➔ /login                                     ┌───────┴───────┐
                                                                ▼               ▼
                                                           [ Đủ Quyền ]   [ Sai Quyền ]
                                                                │               │
                                                           Render Page   Redirect /403
```

---

## 2. Thẻ `<Navigate />` Và Thuộc Tính `replace`

Khi người dùng bị chặn truy cập một trang riêng tư, React Router sử dụng thẻ `<Navigate />` để thực hiện điều hướng ngay lập tức tại thời điểm Component render:

- **`to="/login"`**: Đường dẫn đích cần chuyển hướng sang.
- **`replace={true}`**: Khi bật `replace`, lượt điều hướng này sẽ **ghi đè** lên dòng lịch sử hiện tại trong History Stack của trình duyệt thay vì đẩy thêm 1 dòng mới vào.
- *Tại sao `replace` lại quan trọng?* Nếu không có `replace`, khi bị đẩy sang trang `/login`, người dùng bấm nút "Back" trên trình duyệt sẽ lại bị đẩy ngược lại trang bị cấm, tạo thành vòng lặp điều hướng vô tận!

---

## 3. Kỹ Thuật Redirect Back Với `location.state`

Một trải nghiệm người dùng (UX) rất tệ là: Người dùng đang chọn mua hàng tại trang `/checkout`, bị yêu cầu đăng nhập, sau khi đăng nhập thành công hệ thống lại đẩy họ về trang chủ `/` thay vì đưa họ quay lại `/checkout`.

Để khắc phục:
1. Khi chặn người dùng tại `ProtectedRoute`, ta đính kèm vị trí hiện tại vào state của `<Navigate>`:
   ```jsx
   <Navigate to="/login" state={{ from: location }} replace />
   ```
2. Tại trang `LoginPage`, đọc lại đối tượng `location.state?.from` và tự động điều hướng quay trở lại đúng trang cũ sau khi đăng nhập thành công.

---

## 💻 Syntax

### Protected Route Wrapper Pattern
```jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isLoadingAuth } = useAuth();
  const location = useLocation();

  // 1. Nếu đang kiểm tra Token từ LocalStorage -> Hiện Loading UI (Không nôn nóng redirect!)
  if (isLoadingAuth) {
    return <div>⏳ Đang xác thực phiên đăng nhập...</div>;
  }

  // 2. Chưa đăng nhập -> Chuyển hướng sang /login kèm vết trang cũ
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Đã đăng nhập nhưng sai quyền -> Chuyển hướng sang /403
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Hợp lệ -> Cho phép truy cập nội dung
  return children;
}
```

---

## 📝 Example 1 - Định Cấu Hình Protected Routes Trong Router Tree (`createBrowserRouter`)

```jsx
// src/router/appRouter.jsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";

import { MainLayout } from "../layouts/MainLayout";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { AdminPanelPage } from "../pages/AdminPanelPage";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "unauthorized", element: <UnauthorizedPage /> },

      // Route Công khai Chỉ dành cho người CHƯA ĐĂNG NHẬP (Ngăn truy cập lại /login khi đã auth)
      {
        path: "login",
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        )
      },

      // Route riêng tư yêu cầu ĐÃ ĐĂNG NHẬP (Mọi role)
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )
      },

      // Route riêng tư chỉ dành cho quản trị viên (ADMIN ROLE ONLY)
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPanelPage />
          </ProtectedRoute>
        )
      }
    ]
  }
]);
```

---

## 📝 Example 2 - Xử Lý Redirect Back Sau Khi Đăng Nhập Thành Công Tại `LoginPage`

```jsx
// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Đọc lại trang cũ từ location.state. Mặc định nếu không có thì đẩy về /dashboard
  const fromPage = location.state?.from?.pathname || "/dashboard";

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try {
      // Giả lập gọi API Đăng nhập
      await login(email, password);

      alert(`✅ Đăng nhập thành công! Đang chuyển hướng về: ${fromPage}`);

      // 💡 REDIRECT BACK: Điều hướng quay lại đúng trang người dùng định truy cập trước đó!
      navigate(fromPage, { replace: true });
    } catch (err) {
      alert("❌ Đăng nhập thất bại. Kiểm tra lại thông tin!");
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border shadow-md">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Đăng Nhập Hệ Thống</h2>
      {location.state?.from && (
        <p className="text-xs bg-amber-50 text-amber-800 p-2 rounded mb-4">
          ⚠️ Bạn cần đăng nhập trước khi truy cập trang <strong>{location.state.from.pathname}</strong>.
        </p>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          Đăng Nhập
        </button>
      </form>
    </div>
  );
}
```

---

## 📝 Example 3 - Component `PublicOnlyRoute` Tự Động Đánh Hướng Người Dùng Đã Xác Thực

```jsx
// src/router/PublicOnlyRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Tự động đẩy người dùng ĐÃ đăng nhập rời khỏi các trang như /login hay /register
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <div>⏳ Đang tải...</div>;
  }

  // Nếu ĐÃ đăng nhập rồi mà cố truy cập /login -> Tự động chuyển thẳng vào /dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
```

---

## ⚠️ Notes

1. **Luôn Bật Thuộc Tính `replace={true}` Khi Auth Redirect:** Khi điều hướng người dùng chưa đăng nhập sang `/login`, bắt buộc phải truyền `replace={true}` vào thẻ `<Navigate>` hoặc câu lệnh `navigate()`. Nếu không có `replace`, nút "Back" trên trình duyệt sẽ bị kẹt trong vòng lặp redirect.
2. **Xử Lý Cờ `isLoadingAuth` Thận Trọng:** Khi ứng dụng vừa khởi chạy và đang đọc JWT Token từ LocalStorage/Cookie (mất khoảng 100ms), cờ `isLoadingAuth` phải bằng `true`. Hãy hiển thị giao diện Loading chờ thay vì vội vàng đẩy người dùng ra trang `/login`.

---

## ❌ Common Mistakes

### Sai 1 - Quên lưu lại `location.state` làm mất vết trang cũ của người dùng
```jsx
// ❌ SAI: Chặn người dùng nhưng không ghi nhớ họ đang ở trang nào
<Navigate to="/login" replace />

// ✅ ĐÚNG CHUẨN UX DOANH NGHIỆP:
const location = useLocation();
<Navigate to="/login" state={{ from: location }} replace />
```

---

## 📚 Summary

- **Protected Routes** đóng vai trò gác cổng kiểm tra trạng thái xác thực và phân quyền (Roles).
- Thẻ **`<Navigate to="..." replace />`** thực hiện điều hướng lập tức và ghi đè lịch sử trình duyệt.
- Dùng **`location.state`** để lưu giữ vị trí trang cũ phục vụ tính năng Redirect Back sau đăng nhập.
- **Public Only Routes** đẩy người dùng đã đăng nhập rời khỏi các trang Login/Register.
- Luôn kiểm tra cờ **`isLoadingAuth`** trước khi thực hiện bất kỳ lệnh redirect nào.

---

## 📝 Quiz

### Question 1
Mục đích cốt lõi của Component Wrapper `<ProtectedRoute />` trong ứng dụng React là gì?

A. Tự động mã hóa CSDL  
B. Kiểm tra trạng thái xác thực và phân quyền của người dùng trước khi cho phép truy cập vào các tuyến đường riêng tư  
C. Tải file CSS nhanh hơn  
D. Tự động điền mật khẩu  

**Explanation:**  
Component `<ProtectedRoute />` đóng vai trò gác cổng (Guard), đọc thông tin xác thực từ Context/Redux. Nếu người dùng đủ điều kiện thì cho phép render giao diện trang riêng tư, ngược lại sẽ chặn và redirect về trang `/login` hoặc `/403`.

**Answer: B**

---

### Question 2
Thuộc tính `replace={true}` trong thẻ `<Navigate />` giải quyết bài toán trải nghiệm người dùng nào khi điều hướng bảo mật?

A. Đổi màu giao diện sang màu đỏ  
B. Ghi đè dòng lịch sử duyệt web hiện tại, ngăn người dùng bị kẹt trong vòng lặp điều hướng vô tận khi bấm nút "Back" trên trình duyệt  
C. Xóa toàn bộ CSDL  
D. Reload lại trang web  

**Explanation:**  
Nếu không dùng `replace={true}`, lượt redirect sang `/login` sẽ bị đẩy thêm 1 dòng vào History Stack. Khi người dùng ở trang `/login` bấm nút "Back", trình duyệt sẽ quay lại trang cấm và lập tức bị `ProtectedRoute` đẩy ngược lại `/login`, tạo thành vòng lặp vô tận.

**Answer: B**

---

### Question 3
Việc truyền đối tượng `state={{ from: location }}` vào thẻ `<Navigate />` khi chặn người dùng chưa đăng nhập mang lại lợi ích gì cho trải nghiệm người dùng (UX)?

A. Giúp lưu mật khẩu an toàn  
B. Cho phép trang Login đọc lại vị trí trang cũ mà người dùng đang dở dang để tự động chuyển hướng người dùng quay lại đúng trang đó sau khi đăng nhập thành công  
C. Tăng tốc độ đăng nhập  
D. Bắt buộc bởi React  

**Explanation:**  
Bằng cách lưu đối tượng `location` hiện tại vào `state` của lượt redirect, trang `/login` có thể truy cập `location.state.from` và điều hướng người dùng quay lại đúng trang họ đang tương tác dở (Redirect Back) thay vì đẩy họ về trang chủ.

**Answer: B**
