---
id: testing-performance-m2-l1
course: Testing, Quality Assurance & Performance Optimization
module: Kiểm thử nâng cao
title: Mocking API Layer with MSW (Mock Service Worker)
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Mocking API Layer with MSW (Mock Service Worker)

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích tại sao **Mock Service Worker (MSW v2)** là giải pháp Mocking API số 1 thế giới hiện nay, vượt trội hoàn toàn so với việc mock `axios.get` hay `window.fetch` thủ công.
- Cấu hình **MSW Node Server (`setupServer`)** cho môi trường Kiểm thử tự động (Unit / Integration Tests).
- Cấu hình **MSW Service Worker (`setupWorker`)** cho môi trường Trình duyệt Cục bộ (Development Mode).
- Khai báo các **Request Handlers (`http.get`, `http.post`)** và trả về dữ liệu giả lập với `HttpResponse.json()`.
- Giả lập các kịch bản lỗi mạng phức tạp (**HTTP Status 401, 500, Network Errors**).
- Ghi đè câu trả lời API cho từng bài test cụ thể với **`server.use()`**.

---

## 📖 Definition

### 1. Tại Sao MSW Lại Đột Phá Hơn Cách Mock API Truyền Thống?

Trong các dự án cũ, để test một Component gọi API, lập trình viên thường dùng `vi.spyOn(axios, 'get').mockResolvedValue(...)`.

Cách làm này bộc lộ 3 nhược điểm lớn:
1. **Phụ thuộc vào thư viện HTTP:** Nếu bạn đổi từ `axios` sang `fetch()` hoặc `RTK Query`, toàn bộ 100 bài test của bạn sẽ bị hỏng.
2. **Không test được Interceptors:** Mã nguồn mock đã bỏ qua toàn bộ luồng xử lý của Axios Interceptors.
3. **Không dùng được ở môi trường Dev:** Không thể tận dụng dữ liệu mock khi chạy thử ứng dụng trên trình duyệt.

**Mock Service Worker (MSW)** hoạt động ở lớp **Mạng Hệ Thống (Network Level)**:
- MSW chặn đứng các HTTP Request ngay tại cổng giao tiếp mạng (thông qua Service Worker API trên trình duyệt hoặc Node `http` Interceptor).
- Mã nguồn React của bạn gọi `axios.get()` hay `fetch()` hoàn toàn bình thường như đang giao tiếp với Server thật.
- MSW bắt được request và trả về phản hồi giả lập `HttpResponse.json()` trong vài mili giây.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   KIẾN TRÚC MOCK NETWORK-LEVEL CỦA MSW V2              │
└────────────────────────────────────────────────────────────────────────┘

 [ Component ] ───( fetch / axios )───> [ CỔNG MẠNG HỆ THỐNG ]
                                                  │
                                       (MSW Interceptor Chặn)
                                                  │
                                                  ▼
 [ Component ] <───( HttpResponse.json ) ─── [ MSW Handler ]
```

---

## 2. Cú Pháp MSW v2 (`http` & `HttpResponse`)

Từ phiên bản MSW v2, cú pháp đã được chuẩn hóa theo chuẩn Fetch API hiện đại:
- `rest.get()` (v1 cũ) ➔ **`http.get()` (v2 mới)**.
- `res(ctx.json())` (v1 cũ) ➔ **`HttpResponse.json()` (v2 mới)**.

---

## 💻 Syntax

### MSW v2 Server Setup Blueprint
```typescript
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// 1. Khai báo Handlers
export const handlers = [
  http.get("https://api.educonnect.vn/api/v1/courses", () => {
    return HttpResponse.json([
      { id: "1", title: "Khóa học React MSW", price: 500000 }
    ]);
  })
];

// 2. Khởi tạo Node Server cho Vitest
export const server = setupServer(...handlers);
```

---

## 📝 Example 1 - Khởi Tạo Handlers & Cấu Hình MSW Server Trong Vitest (`src/mocks/server.ts`)

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock API lấy danh sách khóa học (GET)
  http.get("https://api.educonnect.vn/api/v1/courses", () => {
    return HttpResponse.json(
      [
        { id: "C-101", title: "React Masterclass", price: 1500000 },
        { id: "C-102", title: "TypeScript Pro", price: 1200000 }
      ],
      { status: 200 }
    );
  }),

  // Mock API tạo khóa học mới (POST)
  http.post("https://api.educonnect.vn/api/v1/courses", async ({ request }) => {
    const body = (await request.json()) as { title: string; price: number };

    if (!body.title) {
      return HttpResponse.json(
        { message: "Tiêu đề khóa học không được để trống" },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { id: "C-" + Date.now(), title: body.title, price: body.price },
      { status: 201 }
    );
  })
];
```

```typescript
// src/test/setup.ts (Tích hợp MSW vào Vitest Lifecycle)
import { beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../mocks/handlers";

export const server = setupServer(...handlers);

// Bật MSW Server trước khi chạy tất cả bài test
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset lại các handlers tạm thời sau mỗi bài test
afterEach(() => server.resetHandlers());

// Tắt MSW Server sau khi test xong toàn bộ
afterAll(() => server.close());
```

---

## 📝 Example 2 - Test Integration Thành Công Với MSW Cấu Hình Mặc Định

```tsx
// src/components/CourseListFetcher.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CourseListFetcher } from "./CourseListFetcher";

describe("Integration Test với MSW: CourseListFetcher", () => {
  it("nên nạp và hiển thị danh sách khóa học từ MSW Mock Server", async () => {
    render(<CourseListFetcher />);

    // Khẳng định màn hình Loading xuất hiện
    expect(screen.getByText(/đang nạp dữ liệu/i)).toBeInTheDocument();

    // Chờ MSW trả về dữ liệu mock thành công
    const courseTitle1 = await screen.findByText(/React Masterclass/i);
    const courseTitle2 = await screen.findByText(/TypeScript Pro/i);

    expect(courseTitle1).toBeInTheDocument();
    expect(courseTitle2).toBeInTheDocument();
  });
});
```

---

## 📝 Example 3 - Ghi Đè MSW Handler Để Test Kịch Bản Server Bị Lỗi 500 (`server.use()`)

```tsx
// src/components/CourseListErrorHandling.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/setup";
import { CourseListFetcher } from "./CourseListFetcher";

describe("MSW Error Handling Test: CourseListFetcher", () => {
  it("nên hiển thị thông báo lỗi 500 khi Server bị sự cố", async () => {
    // 💡 GHI ĐÈ HANDLER: Giả lập API /courses bị lỗi Server 500 chỉ duy nhất trong bài test này!
    server.use(
      http.get("https://api.educonnect.vn/api/v1/courses", () => {
        return HttpResponse.json(
          { message: "Lỗi kết nối cơ sở dữ liệu nghiêm trọng!" },
          { status: 500 }
        );
      })
    );

    render(<CourseListFetcher />);

    // Chờ thông báo lỗi xuất hiện trên DOM
    const errorMessage = await screen.findByText(/Lỗi kết nối cơ sở dữ liệu/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
```

---

## ⚠️ Notes

1. **Luôn Gọi `server.resetHandlers()` Trong `afterEach`:** Việc gọi `server.resetHandlers()` đảm bảo các kịch bản ghi đè lỗi (`server.use()`) ở bài test này không bị rò rỉ sang làm hỏng các bài test thành công ở file khác.

---

## ❌ Common Mistakes

### Sai 1 - Dùng cú pháp MSW v1 cũ (`rest.get` & `res(ctx.json())`) trong MSW v2
```typescript
// ❌ SAI (CÚ PHÁP MSW V1 CŨ ĐÃ BỊ LOẠI BỎ IN V2):
rest.get("/api/users", (req, res, ctx) => res(ctx.json([])));

// ✅ ĐÚNG CHUẨN MSW V2 HIỆN ĐẠI:
http.get("/api/users", () => HttpResponse.json([]));
```

---

## 📚 Summary

- **MSW (Mock Service Worker)** chặn HTTP Request ở cấp độ mạng mạng (Network Level).
- Giúp bài test độc lập 100% với việc mã nguồn dùng `axios`, `fetch` hay `RTK Query`.
- Dùng **`setupServer`** cho môi trường Vitest/Node.js.
- Cú pháp MSW v2 chuẩn mực: **`http.get()`** và **`HttpResponse.json()`**.
- Dùng **`server.use()`** để giả lập các kịch bản Server Lỗi 500 / 401 cho từng bài test cụ thể.

---

## 📝 Quiz

### Question 1
Ưu điểm đột phá mấu chốt nhất của Mock Service Worker (MSW) so với việc mock các hàm `axios.get` hay `fetch` thủ công là gì?

A. MSW giúp code chạy nhanh hơn 100 lần  
B. MSW hoạt động ở cấp độ mạng (Network Level), chặn đứng request một cách ngầm định, giúp mã nguồn ứng dụng gọi API tự nhiên 100% không bị phụ thuộc vào thư viện HTTP nào  
C. MSW tự động viết code CSS  
D. Cả A và C  

**Explanation:**  
MSW chặn các HTTP requests trực tiếp ở Network level. Nhờ đó, ứng dụng React của bạn chạy code gọi API thật 100% (bao gồm cả Interceptors, Axios config), bài test hoàn toàn độc lập với việc mã nguồn thay đổi thư viện gọi API.

**Answer: B**

---

### Question 2
Trong phiên bản MSW v2 hiện đại, bộ đôi lớp đối tượng chuẩn nào được sử dụng để định nghĩa Request Handler và tạo ra đối tượng Response giả lập?

A. `rest.get()` và `res(ctx.json())`  
B. `http.get()` và `HttpResponse.json()`  
C. `mock.get()` and `MockResponse.send()`  
D. `api.get()` và `ApiResponse.create()`  

**Explanation:**  
MSW v2 chuyển đổi sang cú pháp chuẩn Fetch API với `http.get('/url', () => ...)` và trả về kết quả bằng `HttpResponse.json(data, { status: 200 })`.

**Answer: B**

---

### Question 3
Phương thức nào được gọi trên đối tượng `server` để ghi đè tạm thời một MSW Handler (như giả lập Server bị lỗi 500) dành riêng cho duy nhất 1 bài test cụ thể?

A. `server.override()`  
B. `server.use()`  
C. `server.replace()`  
D. `server.set()`  

**Explanation:**  
`server.use(newHandler)` cho phép bạn chèn hoặc ghi đè tạm thời một HTTP handler mới vào đầu danh sách xử lý của MSW server, rất hữu ích để test các kịch bản lỗi 401/500 cho từng case test riêng biệt.

**Answer: B**
