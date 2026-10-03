---
id: react-router-api-m3-l1
course: React Router & API Integration
module: Bảo mật và triển khai
title: Deployment & CI/CD
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Deployment & CI/CD

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Giải thích toàn bộ quy trình biên dịch, tối ưu hóa và đóng gói ứng dụng React cho môi trường Production với **`npm run build`**.
- Phân tích nguyên nhân gốc rễ và giải quyết triệt để sự cố **Lỗi 404 Not Found do Client-Side Routing khi Refresh (F5)** trên máy chủ web.
- Cấu hình máy chủ Web (Nginx, Vercel, Netlify) thực hiện cơ chế **Single Page Application Rewrite Fallback về `/index.html`**.
- Áp dụng kỹ thuật chia nhỏ tập tin mã nguồn (**Code Splitting & Lazy Loading**) với `React.lazy()` và `<Suspense />`.
- Xây dựng đường ống tự động hóa kiểm thử và triển khai **CI/CD Pipeline (Continuous Integration / Continuous Deployment)** với **GitHub Actions**.
- Mô phỏng ứng dụng Production ngay tại môi trường máy cục bộ với lệnh `npm run preview`.

---

## 📖 Definition

### 1. Quy Trình Biên Dịch Production (Production Build Process)

Khi phát triển (Development), mã nguồn React được chia thành hàng trăm tập tin `.jsx/.tsx` độc lập giúp lập trình viên dễ đọc.

Khi thực hiện lệnh `npm run build`, công cụ **Vite (hoặc Rollup/Webpack)** sẽ tiến hành:
1. **Transpilation:** Biến đổi JSX và TypeScript sang JavaScript thuần tương thích với trình duyệt.
2. **Minification & Tree Shaking:** Loại bỏ khoảng trắng, đổi tên biến ngắn gọn và loại bỏ các đoạn mã không sử dụng (Dead Code).
3. **Bundling:** Gom nhóm các tập tin mã nguồn và thư viện thành các Chunks tĩnh nhỏ gọn trong thư mục **`dist/`**.

---

## 2. Sự Cố Lỗi 404 Khi Refresh Trang Trong Ứng Dụng SPA

Một trong những sự cố phổ biến nhất khi đưa ứng dụng React SPA lên máy chủ web tĩnh (Nginx, Apache):

1. Khi người dùng truy cập trang chủ `https://mysite.com/`, Server trả về file `dist/index.html`. React Router nạp lên thành công.
2. Người dùng click chuyển hướng sang trang `https://mysite.com/courses/101`. React Router chuyển giao diện mượt mà không reload trang.
3. Người dùng **nhấn F5 (Refresh trình duyệt)** tại URL `https://mysite.com/courses/101`.
4. Trình duyệt gửi HTTP GET Request hỏi Máy chủ Web: *"Cho tôi xin file nằm ở đường dẫn `/courses/101/index.html`"*.
5. Vì trên ổ cứng của Máy chủ chỉ có duy nhất file `dist/index.html` ở trang chủ, tập tin `/courses/101/index.html` **KHÔNG TỒN TẠI** ➔ Máy chủ trả về lỗi **404 Not Found**!

```text
┌────────────────────────────────────────────────────────────────────────┐
│             GIẢI PHÁP SPA REWRITE FALLBACK VỀ INDEX.HTML               │
└────────────────────────────────────────────────────────────────────────┘

 [ Request: /courses/101 ] ───> [ Web Server (Nginx/Vercel) ]
                                             │
                                    (File không tồn tại)
                                             │
                                             ▼
                               [ Fallback: Trả về /index.html ]
                                             │
                                             ▼
                               [ React Router Tiếp Quản ]
                              (Render CourseDetail Component)
```

---

## 3. Code Splitting & Lazy Loading

Mặc định, Vite sẽ gom toàn bộ mã nguồn của tất cả các trang (Trang chủ, Trang Admin, Trang Dashboard) vào duy nhất 1 tập tin JavaScript khổng lồ.

**Lazy Loading (`React.lazy`)** cho phép bạn chia nhỏ tập tin build thành các Chunks độc lập. Trình duyệt chỉ nạp tập tin JS của trang Admin khi và chỉ khi người dùng thực sự di chuyển vào đường dẫn `/admin`.

---

## 💻 Syntax

### 1. React.lazy & Suspense Code Splitting Pattern
```jsx
import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Tải trang bất đồng bộ (Lazy Loading)
const HomePage = lazy(() => import("./pages/HomePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      // BẮT BUỘC: Bọc trong Suspense để hiển thị Loading UI khi đang tải JS Chunk
      <Suspense fallback={<div className="p-8 text-center">⏳ Đang tải module trang...</div>}>
        <HomePage />
      </Suspense>
    )
  }
]);
```

---

## 📝 Example 1 - Cấu Hình Vercel Rewrite Fallback (`vercel.json`)

Đặt tập tin `vercel.json` tại thư mục gốc của dự án:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

*Giải thích:* Cấu hình này hướng dẫn Vercel tự động chuyển hướng tất cả các HTTP Request (`/(.*)`) về tập tin gốc `/index.html` nếu không tìm thấy tập tin tĩnh thực tế, giúp React Router tiếp quản định tuyến và loại bỏ hoàn toàn lỗi 404 khi F5.

---

## 📝 Example 2 - Cấu Hình Máy Chủ Nginx Web Server Cho React SPA (`nginx.conf`)

```nginx
server {
    listen 80;
    server_name educonnect.vn;
    root /var/www/my-react-app/dist;
    index index.html;

    # Cấu hình xử lý Client-Side Routing
    location / {
        # Thử tìm file tĩnh $uri hoặc thư mục $uri/
        # NẾU KHÔNG CÓ -> Tự động Fallback về /index.html!
        try_files $uri $uri/ /index.html;
    }

    # Tối ưu Caching cho các tập tin tĩnh (JS, CSS, Ảnh) trong 1 năm
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 📝 Example 3 - Đường Ống CI/CD Tự Động Với GitHub Actions (`.github/workflows/deploy.yml`)

```yaml
name: React CI/CD Pipeline

on:
  push:
    branches: [ "main" ] # Chạy tự động mỗi khi push code lên nhánh main

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: 1. Checkout mã nguồn
        uses: actions/checkout@v3

      - name: 2. Cài đặt môi trường Node.js 18
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: 3. Cài đặt thư viện phụ thuộc (Dependencies)
        run: npm ci

      - name: 4. Kiểm tra lỗi mã nguồn (Linting)
        run: npm run lint

      - name: 5. Kiểm tra lỗi Type (TypeScript Check)
        run: npx tsc --noEmit

      - name: 6. Đóng gói ứng dụng Production (Build)
        run: npm run build
        env:
          VITE_API_BASE_URL: https://api.educonnect.vn/api/v1

      - name: 7. Triển khai lên Vercel Production
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## ⚠️ Notes

1. **Thử Nghiệm Môi Trường Production Với `npm run preview`:** Sau khi chạy `npm run build`, bạn nên khởi chạy lệnh `npm run preview`. Lệnh này sẽ bật một HTTP Server địa phương phục vụ chính các tập tin trong thư mục `dist/` giúp bạn phát hiện sớm các lỗi đóng gói trước khi đẩy code lên host thật.
2. **Bảo Vệ API Key Bí Mật:** Luôn thêm các file chứa biến môi trường nhạy cảm như `.env.local` vào tập tin `.gitignore` để không bị lộ trên GitHub.

---

## ❌ Common Mistakes

### Sai 1 - Đặt tên biến môi trường trong Vite thiếu tiền tố `VITE_`
```bash
# ❌ SAI: Vite sẽ BỎ QUA không nhúng biến này vào mã nguồn trình duyệt!
API_URL=https://api.educonnect.vn 

# ✅ ĐÚNG CHUẨN VITE:
VITE_API_URL=https://api.educonnect.vn
```

### Sai 2 - Quên bọc Component `lazy()` bằng `<Suspense>`
```jsx
const Dashboard = lazy(() => import("./Dashboard"));

// ❌ SAI: Thăng cấp lỗi crash app "A React component suspended while rendering..."
return <Dashboard />;

// ✅ ĐÚNG:
return (
  <Suspense fallback={<div>Loading...</div>}>
    <Dashboard />
  </Suspense>
);
```

---

## 📚 Summary

- **`npm run build`** biên dịch và đóng gói ứng dụng thành các tập tin tĩnh nén nhỏ trong thư mục `dist/`.
- Cần cấu hình **Rewrite Fallback về `/index.html`** trên Nginx/Vercel để sửa triệt để lỗi 404 khi F5 refresh trang trong SPA.
- Sử dụng **`React.lazy`** và **`<Suspense>`** để thực hiện Code Splitting, giúp giảm dung lượng tập tin nạp ban đầu.
- Đặt tên biến môi trường với tiền tố **`VITE_`** trong các dự án Vite.
- Xây dựng đường ống **CI/CD GitHub Actions** tự động hóa kiểm thử và triển khai.

---

## 📝 Quiz

### Question 1
Nguyên nhân gốc rễ gây ra sự cố lỗi 404 Not Found khi người dùng nhấn F5 Refresh trình duyệt tại đường dẫn `/courses/101` trên máy chủ web chưa được cấu hình cho ứng dụng React SPA là gì?

A. Do đường truyền Internet bị ngắt  
B. Do Máy chủ Web tĩnh cố gắng tìm kiếm một tập tin thực tế trên ổ cứng tên là `/courses/101/index.html` vốn không tồn tại, thay vì trả về `/index.html` gốc cho React Router tự xử lý  
C. Do thư viện React bị xóa  
D. Do file CSS bị lỗi  

**Explanation:**  
Trong ứng dụng SPA, chỉ có duy nhất 1 tập tin `index.html` thực tế ở trang gốc. Khi người dùng refresh tại `/courses/101`, web server tĩnh tìm file `/courses/101/index.html` trên ổ cứng và trả về 404 vì không có file đó. Giải pháp là cấu hình server rewrite mọi request về `/index.html`.

**Answer: B**

---

### Question 2
Cặp công cụ nào trong React được sử dụng để thực hiện kỹ thuật Lazy Loading (Code Splitting) nhằm chia nhỏ các tập tin JavaScript và hiển thị giao diện chờ trong lúc nạp module mới?

A. `React.memo` và `useMemo`  
B. `React.lazy()` và `<Suspense fallback={...}>`  
C. `useContext` và `useReducer`  
D. `createSlice` và `configureStore`  

**Explanation:**  
`React.lazy()` cho phép nạp động một Component dạng bất đồng bộ `const Page = lazy(() => import('./Page'))`, và `<Suspense fallback={<Loading />}>` chịu trách nhiệm bắt trạng thái đang tải đó để hiển thị giao diện chờ UI.

**Answer: B**

---

### Question 3
Lệnh CLI nào được sử dụng trong các dự án Vite để khởi chạy một HTTP Web Server thử nghiệm các tập tin đóng gói Production ngay tại môi trường máy local sau khi chạy `npm run build`?

A. `npm run dev`  
B. `npm run preview`  
C. `npm start`  
D. `npm test`  

**Explanation:**  
Lệnh `npm run preview` của Vite sẽ bật một server tĩnh nhẹ phục vụ đúng các tập tin đã được đóng gói trong thư mục `dist/`, giúp bạn kiểm tra chính xác hành vi ứng dụng môi trường Production trước khi deploy.

**Answer: B**
