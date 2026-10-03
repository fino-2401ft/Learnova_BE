---
id: react-router-api-m2-l1
course: React Router & API Integration
module: Tích hợp API và form
title: Axios & API Service Layer
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Axios & API Service Layer

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích các ưu điểm vượt trội của thư viện **Axios** so với `fetch()` API thuần trong các dự án sản phẩm doanh nghiệp.
- Khởi tạo **Axios Custom Instance** với các cấu hình nền tảng (`baseURL`, `timeout`, `headers`).
- Xây dựng **Request Interceptor** để tự động đính kèm `Authorization Bearer Token` vào mọi HTTP Request gửi đi.
- Xây dựng **Response Interceptor** tập trung để xử lý tự động nạp lại Token hết hạn (**Refresh Token Rotation**) và giải quấn dữ liệu `response.data`.
- Tổ chức tầng **API Service Layer** phân rã theo Module giúp bóc tách 100% logic mạng ra khỏi React UI Components.
- Cấu hình các biến môi trường của Vite (`import.meta.env.VITE_API_URL`) an toàn.

---

## 📖 Definition

### 1. Tại Sao Dự Án Doanh Nghiệp Ưu Tiên Axios Thay Cho Fetch API Thuần?

Mặc dù `fetch()` là một Web API được tích hợp sẵn trong tất cả các trình duyệt hiện đại, nhưng việc sử dụng `fetch()` thuần trong các dự án lớn thường bộc lộ nhiều điểm hạn chế:

1. **Phải parse JSON thủ công:** Mỗi lần gọi `fetch()`, bạn phải viết 2 bước `const res = await fetch()` và `const data = await res.json()`.
2. **Không tự động ném lỗi khi gặp HTTP Status 4xx/5xx:** `fetch()` chỉ reject Promise khi có lỗi kết nối mạng (Network Error). Với các lỗi như `401 Unauthorized` hay `500 Server Error`, `fetch()` vẫn coi là Resolved Promise! Bạn phải tự viết `if (!res.ok) throw new Error()`.
3. **Thiếu tính năng Interceptors:** Không có cách nào để chèn một middleware toàn cục tự động gắn Token hoặc tự động Refresh Token cho hàng trăm câu lệnh `fetch()`.

**Axios** giải quyết triệt để tất cả các vấn đề này:
- Tự động parse dữ liệu JSON trả về trong `response.data`.
- Tự động ném ngoại lệ (Reject Promise) khi gặp mã HTTP Status 4xx/5xx.
- Hỗ trợ **Interceptors** (Bộ đánh chặn HTTP Request & Response) toàn cục.
- Hỗ trợ theo dõi tiến trình nạp/tải tệp tin (**Upload/Download Progress**).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   LUỒNG HOẠT ĐỘNG CỦA AXIOS INTERCEPTORS               │
└────────────────────────────────────────────────────────────────────────┘

 [ React UI Component ] ───> [ Request Interceptor ] ──( Auto-attach Token )──> [ Server ]
                                                                                   │
 [ React UI Component ] <─── [ Response Interceptor ] <──( Auto Unwrap .data / )───┘
                                                           ( Refresh Token 401 )
```

---

## 2. Axios Interceptors (Bộ Đánh Chặn HTTP Toàn Cục)

Interceptors đóng vai trò như các Middleware đứng gác ở cổng giao tiếp HTTP giữa ứng dụng React và Server Backend:

1. **Request Interceptor (Bộ đánh chặn Request):**
   - Chạy **TRƯỚC KHI** một HTTP Request thực sự được phát đi qua mạng.
   - Thường dùng để: Đọc JWT Token từ LocalStorage/Redux và tự động gắn vào Header `Authorization: Bearer <token>`.
2. **Response Interceptor (Bộ đánh chặn Response):**
   - Chạy **NGAY KHI** Server vừa gửi phản hồi về nhưng trước khi dữ liệu được trả cho hàm `.then()` hay `await`.
   - Thường dùng để: Trích xuất ngắn gọn `response.data`, hoặc khi phát hiện lỗi `401 Unauthorized` thì tự động kích hoạt API cấp lại Token mới (Refresh Token) và gửi lại request cũ hoàn toàn ngầm định.

---

## 3. Kiến Trúc Tầng API Service Layer (Service Pattern)

Một sai lầm phổ biến là viết trực tiếp các câu lệnh `axios.get('https://api.domain.com/v1/courses/101')` bên trong file Component.

**API Service Layer** gom nhóm tất cả các hàm gọi API theo từng module nghiệp vụ (như `authService.ts`, `courseService.ts`, `userService.ts`):
- Giúp mã nguồn UI Component cực kỳ sạch sẽ.
- Khi Server Backend thay đổi cấu trúc URL API, bạn chỉ cần sửa ở 1 nơi duy nhất trong file Service.

---

## 💻 Syntax

### Axios Custom Instance & Interceptors Blueprint
```javascript
import axios from "axios";

// 1. Tạo Custom Instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://api.example.com/v1",
  timeout: 10000, // Timeout sau 10 giây
  headers: {
    "Content-Type": "application/json"
  }
});

// 2. Request Interceptor: Tự động gắn Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Tự động unwrap .data và xử lý 401
apiClient.interceptors.response.use(
  (response) => response.data, // Trả thẳng .data cho caller
  (error) => {
    if (error.response?.status === 401) {
      // Logic xử lý logout hoặc refresh token...
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 📝 Example 1 - Thiết Kế Tầng API Service Layer Phân Rã Theo Module Khóa Học

```javascript
// src/services/courseService.js
import apiClient from "./apiClient";

export const courseService = {
  // Lấy danh sách khóa học có bộ lọc
  getAllCourses: (params) => {
    // GET /courses?category=frontend&sort=price
    return apiClient.get("/courses", { params });
  },

  // Lấy chi tiết khóa học theo ID
  getCourseById: (id) => {
    // GET /courses/101
    return apiClient.get(`/courses/${id}`);
  },

  // Tạo mới khóa học
  createCourse: (courseData) => {
    // POST /courses
    return apiClient.post("/courses", courseData);
  },

  // Cập nhật thông tin khóa học
  updateCourse: (id, updateData) => {
    // PUT /courses/101
    return apiClient.put(`/courses/${id}`, updateData);
  },

  // Xóa khóa học
  deleteCourse: (id) => {
    // DELETE /courses/101
    return apiClient.delete(`/courses/${id}`);
  }
};
```

---

## 📝 Example 2 - Cài Đặt Cơ Chế Tự Động Refresh Token Rotation Trong Response Interceptor

```javascript
// src/services/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://api.educonnect.vn/api/v1",
  headers: { "Content-Type": "application/json" }
});

// Request Interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor với quy trình Refresh Token
apiClient.interceptors.response.use(
  (response) => response.data, // Tự động unwrap lấy .data
  async (error) => {
    const originalRequest = error.config;

    // Nếu gặp lỗi 401 Unauthorized và Request này chưa từng thử lại
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Đánh dấu đã retry 1 lần để tránh lặp vô tận

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        // Gọi API cấp Token mới
        const res = await axios.post("https://api.educonnect.vn/api/v1/auth/refresh", {
          refreshToken
        });

        const newAccessToken = res.data.accessToken;

        // Lưu lại token mới vào LocalStorage
        localStorage.setItem("access_token", newAccessToken);

        // Gán token mới vào header của request cũ vừa bị lỗi
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Gửi lại request cũ bị lỗi và trả về kết quả cho Component!
        return apiClient(originalRequest);
      } catch (refreshErr) {
        // Refresh Token cũng bị hết hạn -> Xóa sạch storage và buộc đăng xuất về /login
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 📝 Example 3 - Sử Dụng API Service Gọn Gàng Trong UI Component

```jsx
// src/components/CourseManagerContainer.jsx
import React, { useState, useEffect } from "react";
import { courseService } from "../services/courseService";

export function CourseManagerContainer() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Component gọi hàm từ Service cực kỳ ngắn gọn, không lộ URL hay Header Token!
    courseService.getAllCourses({ category: "react" })
      .then((data) => setCourses(data))
      .catch((err) => alert(`❌ Lỗi API: ${err.message}`))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khóa học này?")) return;

    try {
      await courseService.deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      alert("✅ Xóa khóa học thành công!");
    } catch (err) {
      alert("❌ Xóa thất bại!");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">⏳ Đang nạp danh sách khóa học...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Quản Lý Khóa Học (API Service Layer)</h2>
      <div className="space-y-3">
        {courses.map((course) => (
          <div key={course.id} className="p-4 border rounded-xl bg-white flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800">{course.title}</h3>
              <p className="text-sm text-slate-500">{course.price?.toLocaleString()} VNĐ</p>
            </div>
            <button
              onClick={() => handleDeleteCourse(course.id)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Biến Môi Trường Trong Vite (`import.meta.env`):** Trong các dự án khởi tạo bằng Vite, tất cả các biến môi trường bắt buộc phải bắt đầu bằng tiền tố `VITE_` (ví dụ `VITE_API_BASE_URL`). Truy cập qua `import.meta.env.VITE_API_BASE_URL`.
2. **Hủy Request Khi Component Unmount (AbortController):** Để tránh lỗi rò rỉ bộ nhớ khi người dùng di chuyển trang liên tục trong lúc API chưa kịp về, hãy truyền `signal` từ `AbortController` vào config của Axios: `apiClient.get('/url', { signal: controller.signal })`.

---

## ❌ Common Mistakes

### Sai 1 - Viết URL cứng và chèn Token thủ công rải rác ở từng Component
```jsx
// ❌ SAI TAI HẠI: Viết URL cứng dải rác khắp nơi, khi đổi domain server phải sửa 50 file!
useEffect(() => {
  axios.get("https://api.educonnect.vn/v1/courses", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
}, []);

// ✅ ĐÚNG CHUẨN: Sử dụng Axios Instance và API Service Layer
courseService.getAllCourses();
```

---

## 📚 Summary

- **Axios** hỗ trợ tự động parse JSON, tự động ném lỗi HTTP status 4xx/5xx và interceptors mạnh mẽ.
- **Request Interceptor** tự động gắn JWT Bearer Token vào header trước khi gửi request.
- **Response Interceptor** tự động unwrap dữ liệu `response.data` và xử lý cơ chế Refresh Token khi gặp lỗi `401 Unauthorized`.
- Tổ chức tầng **API Service Layer** phân rã riêng biệt giúp mã nguồn React Component vô cùng gọn gàng và dễ bảo trì.

---

## 📝 Quiz

### Question 1
Tính năng nào của Axios cho phép bạn can thiệp toàn cục để tự động xử lý hoặc chỉnh sửa các HTTP Request trước khi gửi đi và Response trước khi nhận về?

A. Axios Reducers  
B. Axios Interceptors  
C. Axios Hooks  
D. Axios Actions  

**Explanation:**  
Axios Interceptors cho phép bạn đăng ký các bộ đánh chặn (interceptors) cho cả Request (để gắn Token) và Response (để unwrap data hoặc refresh token) toàn cục cho mọi lệnh gọi API.

**Answer: B**

---

### Question 2
Điểm khác biệt mấu chốt về cách xử lý mã lỗi HTTP Status 404/500 giữa `Axios` và `fetch()` API thuần là gì?

A. Fetch tự động sửa lỗi, Axios ném lỗi  
B. Axios tự động Reject Promise khi gặp mã lỗi HTTP 4xx/5xx, trong khi Fetch vẫn Resolve Promise ngoại trừ khi có lỗi mất kết nối mạng  
C. Cả hai hoàn toàn giống nhau  
D. Axios không thể ném lỗi  

**Explanation:**  
`fetch()` API chỉ reject Promise khi có lỗi mất mạng hoàn toàn. Với mã HTTP 404 hay 500, `fetch()` vẫn coi là Resolved Promise. Ngược lại, Axios tự động ném ngoại lệ (Reject Promise) khi HTTP Status nằm ngoài dải 2xx, giúp khối `try...catch` bắt lỗi chính xác.

**Answer: B**

---

### Question 3
Trong ứng dụng React khởi tạo bằng công cụ Vite, tất cả các biến môi trường khai báo trong file `.env` chứa URL máy chủ API bắt buộc phải bắt đầu bằng tiền tố nào để có thể truy cập được từ mã trình duyệt?

A. `REACT_APP_`  
B. `VITE_`  
C. `NEXT_PUBLIC_`  
D. `ENV_`  

**Answer: B**
