---
id: typescript-react-m3-l2
course: TypeScript for React Developers
module: Định kiểu cho hệ sinh thái
title: Typing React Router & Axios API Layer
order: 2
difficulty: Intermediate
estimatedTime: 240
---
# Typing React Router & Axios API Layer

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Định kiểu cho các tham số đường dẫn URL (**Path Params**) với `useParams<ParamsShape>()`.
- Định kiểu dữ liệu trả về từ **Data Loaders (`useLoaderData()`)** sử dụng kiểu `LoaderFunctionArgs` và `useLoaderData() as LoaderType`.
- Định kiểu cho Axios Generic Requests (`axios.get<ResponseType>()`).
- Xây dựng tầng **Typed API Service Layer** đảm bảo 100% dữ liệu đầu vào (Payload) và đầu ra (Response) đều được kiểm soát kiểu.
- Xử lý các đối tượng lỗi Axios Error với kiểu **`AxiosError<ErrorResponseData>`**.

---

## 📖 Definition

### 1. Định Kiểu Axios Requests Với Generics

Mặc định, các hàm gọi HTTP của Axios như `axios.get()` hay `axios.post()` sẽ trả về `Promise<AxiosResponse<any>>`.

Bằng cách truyền tham số Generic **`axios.get<T>()`**:
- TypeScript sẽ tự động suy luận kiểu của `response.data` thành kiểu `T`.
- VS Code lập tức cung cấp gợi ý thuộc tính chuẩn xác 100% khi bạn truy cập `response.data.title`.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   LUỒNG ĐỊNH KIỂU GENERIC AXIOS REQUEST                 │
└────────────────────────────────────────────────────────────────────────┘

 [ axios.get<Course[]>(url) ] ───> [ Response: AxiosResponse<Course[]> ]
                                                   │
                                                   ▼
                                     [ response.data: Course[] ]
```

---

## 2. Định Kiểu Data Router Loaders & Actions Trong React Router v6.4+

Khi sử dụng `loader` function trong `createBrowserRouter`:
- Tham số truyền vào `loader({ params, request })` có kiểu **`LoaderFunctionArgs`**.
- Tham số truyền vào `action({ request })` có kiểu **`ActionFunctionArgs`**.
- Trích xuất dữ liệu loader ở Component bằng `useLoaderData() as Awaited<ReturnType<typeof myLoader>>`.

---

## 💻 Syntax

### Typed Axios Request Blueprint
```typescript
import axios from "axios";

interface UserDto {
  id: string;
  name: string;
}

// Trả về Promise chứa mảng UserDto
async function getUsers(): Promise<UserDto[]> {
  const response = await axios.get<UserDto[]>("/api/users");
  return response.data; // response.data có kiểu UserDto[]
}
```

---

## 📝 Example 1 - Xây Dựng Typed Axios Client VÀ Typed API Service Layer

```typescript
// src/services/typedCourseService.ts
import axios, { AxiosError } from "axios";

export interface CourseDto {
  id: string;
  title: string;
  price: number;
  category: "frontend" | "backend";
}

export interface CreateCoursePayload {
  title: string;
  price: number;
  category: "frontend" | "backend";
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: string[];
}

const apiClient = axios.create({
  baseURL: "https://api.educonnect.vn/api/v1",
  headers: { "Content-Type": "application/json" }
});

export const typedCourseService = {
  // 1. GET Request có định kiểu dữ liệu trả về CourseDto[]
  getCourses: async (category?: string): Promise<CourseDto[]> => {
    const response = await apiClient.get<CourseDto[]>("/courses", {
      params: { category }
    });
    return response.data;
  },

  // 2. GET Detail Request
  getCourseById: async (id: string): Promise<CourseDto> => {
    const response = await apiClient.get<CourseDto>(`/courses/${id}`);
    return response.data;
  },

  // 3. POST Request nhận Payload có kiểu CreateCoursePayload và trả về CourseDto
  createCourse: async (payload: CreateCoursePayload): Promise<CourseDto> => {
    const response = await apiClient.post<CourseDto>("/courses", payload);
    return response.data;
  }
};

// Helper Bắt Lỗi Axios Typed Error
export function isAxiosCustomError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError(error);
}
```

---

## 📝 Example 2 - Định Kiểu React Router Data Loader Với `LoaderFunctionArgs`

```tsx
// src/pages/TypedCourseDetailPage.tsx
import React from "react";
import { useLoaderData, useParams, LoaderFunctionArgs } from "react-router-dom";
import { typedCourseService, CourseDto } from "../services/typedCourseService";

// 1. Loader Function với tham số được định kiểu LoaderFunctionArgs
export async function courseDetailLoader({ params }: LoaderFunctionArgs): Promise<CourseDto> {
  const courseId = params.courseId;

  if (!courseId) {
    throw new Response("Missing Course ID", { status: 400 });
  }

  try {
    const course = await typedCourseService.getCourseById(courseId);
    return course;
  } catch (err) {
    throw new Response("Khóa học không tồn tại", { status: 404 });
  }
}

// 2. Path Params Shape Interface
type CourseDetailRouteParams = {
  courseId: string;
};

// 3. Component Giao Diện
export function TypedCourseDetailPage() {
  // Định kiểu cho useParams
  const { courseId } = useParams<CourseDetailRouteParams>();

  // Ép kiểu chuẩn cho useLoaderData
  const course = useLoaderData() as CourseDto;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl border shadow-sm space-y-3">
      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
        URL PARAM: #{courseId}
      </span>
      <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
      <p className="text-lg font-semibold text-emerald-600">{course.price.toLocaleString()} VNĐ</p>
      <span className="inline-block text-xs bg-slate-100 px-2.5 py-1 rounded uppercase">
        {course.category}
      </span>
    </div>
  );
}
```

---

## 📝 Example 3 - Xử Lý Bắt Lỗi Axios Typed Error An Toàn Trong UI Component

```tsx
// src/components/CreateCourseTypedForm.tsx
import React, { useState } from "react";
import { typedCourseService, isAxiosCustomError } from "../services/typedCourseService";

export function CreateCourseTypedForm() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(500000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const newCourse = await typedCourseService.createCourse({
        title,
        price,
        category: "frontend"
      });
      alert(`✅ Tạo thành công khóa học ID: ${newCourse.id}`);
      setTitle("");
    } catch (err: unknown) {
      // Bắt lỗi Typed Axios Error bằng Type Guard
      if (isAxiosCustomError(err)) {
        // Gợi ý thuộc tính err.response.data.message an toàn!
        setErrorMessage(err.response?.data?.message || "Lỗi nạp dữ liệu từ máy chủ");
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Đã xảy ra lỗi không xác định");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-xl max-w-md space-y-4 bg-white">
      <h3 className="font-bold text-lg">Tạo Khóa Học (Typed Axios)</h3>

      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          ❌ {errorMessage}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Tên khóa học:</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Giá tiền:</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full border p-2 rounded text-sm"
          required
        />
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium">
        Tạo Mới
      </button>
    </form>
  );
}
```

---

## ⚠️ Notes

1. **Luôn Định Kiểu Cho Generic Response Trong Axios:** Khi gọi `axios.get<T>()`, hãy luôn cung cấp interface `T` để `response.data` nhận đúng kiểu dữ liệu, tránh tình trạng `response.data` bị coi là `any`.

---

## ❌ Common Mistakes

### Sai 1 - Truy cập `err.response.data.message` mà không qua Type Guard
```typescript
// ❌ SAI: err có kiểu unknown/any, nếu err không có response sẽ gây crash Uncaught TypeError!
catch (err) {
  alert(err.response.data.message);
}

// ✅ ĐÚNG CHUẨN: Sử dụng axios.isAxiosError(err)
catch (err) {
  if (axios.isAxiosError(err)) {
    alert(err.response?.data?.message);
  }
}
```

---

## 📚 Summary

- Dùng **`axios.get<ResponseType>()`** để định kiểu dữ liệu trả về cho `response.data`.
- Định kiểu cho Loader tham số bằng **`LoaderFunctionArgs`**.
- Ép kiểu cho `useLoaderData()` bằng **`as LoaderResultType`**.
- Kiểm tra lỗi Axios an toàn với Type Guard **`axios.isAxiosError(err)`**.

---

## 📝 Quiz

### Question 1
Tham số Generics nào được truyền vào hàm `axios.get<T>(url)` để quy định kiểu dữ liệu của `response.data` trả về?

A. Kiểu tham số URL  
B. Kiểu dữ liệu của đối tượng JSON trong `response.data`  
C. Kiểu của Header  
D. Kiểu của Status Code  

**Explanation:**  
Khi truyền Generic `axios.get<T>(url)`, Axios sẽ tự động gán kiểu cho thuộc tính `response.data` thành kiểu `T`, giúp các dòng code tiêu thụ nhận gợi ý Intellisense chính xác.

**Answer: B**

---

### Question 2
Interface chuẩn nào được nhập từ `react-router-dom` để định kiểu cho tham số `({ params, request })` nhận vào của một hàm Data Router `loader`?

A. `LoaderProps`  
B. `LoaderFunctionArgs`  
C. `RouteLoaderContext`  
D. `LoaderEvent`  

**Explanation:**  
`LoaderFunctionArgs` là interface do React Router v6 cung cấp sẵn chứa định nghĩa chuẩn cho đối tượng `{ params, request }` truyền vào hàm `loader`.

**Answer: B**

---

### Question 3
Hàm Type Guard nào của thư viện Axios cho phép bạn kiểm tra và ép kiểu an toàn cho một đối tượng lỗi `err: unknown` trong khối `catch`?

A. `axios.checkError(err)`  
B. `axios.isAxiosError(err)`  
C. `axios.hasError(err)`  
D. `axios.validate(err)`  

**Explanation:**  
Hàm `axios.isAxiosError(err)` là một Type Guard kiểm tra xem đối tượng `err` có phải là một instance của `AxiosError` hay không, giúp truy cập thuộc tính `err.response` an toàn 100%.

**Answer: B**
