---
id: testing-performance-m3-l2
course: Testing, Quality Assurance & Performance Optimization
module: Tối ưu hiệu năng
title: Code-Splitting, Dynamic Imports & Tree Shaking
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Code-Splitting, Dynamic Imports & Tree Shaking

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Giải thích nguyên lý tối ưu hóa dung lượng tập tin đóng gói (**Bundle Size Optimization**) giúp tăng tốc độ tải trang ban đầu.
- Áp dụng kỹ thuật phân tách mã nguồn **Code-Splitting** với **`React.lazy()`** và **`<Suspense />`**.
- Sử dụng cú pháp **Dynamic Imports (`import()`)** cho các thư viện nặng (như Chart.js, PDF Generators, Rich Text Editors).
- Phân tích và kiểm tra cơ chế loại bỏ mã thừa **Tree Shaking** của Bundler (Vite / Rollup).
- Sử dụng công cụ **`rollup-plugin-visualizer`** để phân tích biểu đồ dung lượng tập tin build (Bundle Analyzer).
- Tối ưu hóa việc import các thư viện icon (Lucide React, FontAwesome) tránh làm phình to tập tin JS.

---

## 📖 Definition

### 1. Tại Sao Cần Code-Splitting Và Bundle Optimization?

Mặc định, khi bạn chạy lệnh `npm run build`, tất cả mã nguồn của 50 trang web và 30 thư viện npm sẽ được gom lại thành 1 tập tin `index.js` duy nhất nặng 3MB.

Khi người dùng truy cập Trang Chủ:
- Trình duyệt bắt buộc phải tải về toàn bộ 3MB tập tin JS (bao gồm cả mã nguồn trang Admin, trang Thanh toán, thư viện vẽ biểu đồ, thư viện xuất file PDF...).
- Kết quả: Người dùng trên thiết bị di động 3G/4G phải chờ 8 giây màn hình trắng trước khi trang chủ kịp hiển thị!

**Code-Splitting (Phân Tách Mã Nguồn)** giải quyết bài toán này:
- Chia nhỏ tập tin 3MB thành 1 tập tin Main Bundle nhỏ gọn (150KB) chứa mã nguồn cần thiết cho Trang Chủ.
- Tất cả các trang khác (Admin, Dashboard, Settings) và các thư viện nặng được tách thành các **JS Chunks độc lập**. Trình duyệt chỉ tải thêm Chunk đó khi người dùng thực sự click di chuyển tới trang tương ứng.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   SO SÁNH BUNDLE MONOLITH VS CODE-SPLITTING            │
└────────────────────────────────────────────────────────────────────────┘

 [ Monolith Bundle ]     ───> index.js (3MB - Tải cực chậm!)
 
 [ Code-Splitting ]     ───> main.js (150KB - Tải tức thì 0.2s!)
                               ├──> admin-chunk.js (Tải ngầm khi di chuyển)
                               └──> chart-chunk.js (Tải khi mở Modal)
```

---

## 2. Cơ Chế Tree Shaking

**Tree Shaking** là thuật ngữ mô phỏng hành động "rung cây cho lá khô rụng xuống DOM":
- Là khả năng của công cụ đóng gói (Vite/Rollup/Webpack) tự động phát hiện và **loại bỏ các đoạn mã/hàm không được sử dụng (Dead Code)** ra khỏi tập tin build cuối cùng.
- *Điều kiện để Tree Shaking hoạt động:* Mã nguồn và thư viện phải viết theo chuẩn **ES Modules (`import / export`)**, không dùng cú pháp CommonJS cũ (`require()`).

---

## 💻 Syntax

### Dynamic Import & React.lazy Blueprint
```tsx
import { lazy, Suspense } from "react";

// Tải trang bất đồng bộ khi cần
const LazyAdminDashboard = lazy(() => import("./pages/AdminDashboard"));

export function App() {
  return (
    <Suspense fallback={<div className="p-8 text-center">⏳ Đang tải module...</div>}>
      <LazyAdminDashboard />
    </Suspense>
  );
}
```

---

## 📝 Example 1 - Dynamic Import Cho Thư Viện Vẽ Biểu Đồ Nặng (Lazy Chart Component)

```tsx
// src/components/LazyChartContainer.tsx
import React, { useState, lazy, Suspense } from "react";

// 💡 DYNAMIC IMPORT: Thư viện Chart nặng (như Recharts/Chart.js) chỉ được tải về khi nút "Mở Biểu Đồ" được click!
const HeavyRevenueChart = lazy(() => import("./HeavyRevenueChart"));

export function LazyChartContainer() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div className="p-6 max-w-xl mx-auto border rounded-2xl bg-white shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Báo Cáo Doanh Thu</h3>
        <button
          onClick={() => setShowChart((prev) => !prev)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          {showChart ? "Ẩn Biểu Đồ" : "📊 Hiển Thị Biểu Đồ (Lazy Load)"}
        </button>
      </div>

      {showChart && (
        <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-500">⏳ Đang nạp module Biểu đồ...</div>}>
          <HeavyRevenueChart />
        </Suspense>
      )}
    </div>
  );
}
```

---

## 📝 Example 2 - Cấu Hình Visualizer Phân Tích Dung Lượng Bundle Trong `vite.config.ts`

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    // Tự động tạo file stats.html hiển thị biểu đồ dung lượng các thư viện sau khi build!
    visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        // Thủ công phân chia các thư viện vendor thành các Chunks độc lập
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-redux": ["@reduxjs/toolkit", "react-redux"],
          "vendor-utils": ["axios", "lodash-es", "date-fns"]
        }
      }
    }
  }
});
```

---

## 📝 Example 3 - Tối Ưu Import Thư Viện Icon Để Hỗ Trợ Tree Shaking 100%

```typescript
// ❌ SAI: Import toàn bộ tập hợp 2000 icons của Lucide làm phá hỏng Tree Shaking hoặc tăng thời gian build!
import * as Icons from "lucide-react"; 

// ✅ ĐÚNG CHUẨN TREE SHAKING: Chỉ import chính xác đúng các Icon có sử dụng!
import { ShoppingCart, User, Search, Settings } from "lucide-react";
```

---

## ⚠️ Notes

1. **Ưu Tiên Sử Dụng Thư Viện Dạng ES Modules (`lodash-es`):** Nếu dự án dùng `lodash`, hãy chuyển sang cài đặt `lodash-es` (`npm i lodash-es`). Phiên bản `lodash-es` được viết hoàn toàn bằng ES Modules, cho phép Tree Shaking dọn dẹp các hàm không dùng tới, giảm dung lượng bundle từ 70KB xuống chỉ còn 2KB!

---

## ❌ Common Mistakes

### Sai 1 - Khai báo `React.lazy()` bên trong thân một Component
```tsx
// ❌ SAI TAI HẠI: Module sẽ bị tải lại ở MỌI LẦN parent component render!
function BadParent() {
  const LazyComponent = lazy(() => import("./LazyComponent")); 
  return <LazyComponent />;
}

// ✅ ĐÚNG CHUẨN: Khai báo lazy() ở phía BÊN NGOÀI thân Component
const LazyComponent = lazy(() => import("./LazyComponent"));
function GoodParent() {
  return <LazyComponent />;
}
```

---

## 📚 Summary

- **Code-Splitting** chia nhỏ tập tin build lớn thành các Chunks nhỏ hơn, giúp tăng tốc nạp trang ban đầu.
- Sử dụng **`React.lazy()`** và **`<Suspense />`** cho việc nạp bất đồng bộ các trang và Component nặng.
- **Tree Shaking** tự động loại bỏ mã nguồn không sử dụng khi thư viện hỗ trợ ES Modules (`import/export`).
- Dùng **`rollup-plugin-visualizer`** để soi và phân tích dung lượng tập tin build.
- Sử dụng **`lodash-es`** thay cho `lodash` để bật Tree Shaking.

---

## 📝 Quiz

### Question 1
Mục đích cốt lõi của kỹ thuật Code-Splitting trong các ứng dụng React quy mô lớn là gì?

A. Để tự động mã hóa dữ liệu  
B. Chia nhỏ tập tin JavaScript đóng gói lớn thành các Chunks nhỏ gọn hơn, giúp trình duyệt chỉ tải đúng mã nguồn cần thiết cho trang hiện tại, giảm tối đa thời gian màn hình trắng ban đầu  
C. Để tự động đổi màu trang web  
D. Cả A và C  

**Explanation:**  
Code-Splitting giúp ngăn chặn việc bắt trình duyệt phải tải về toàn bộ mã nguồn của cả ứng dụng trong lần truy cập đầu tiên, bằng cách chia nhỏ thành các Chunks và chỉ tải về khi người dùng di chuyển vào trang đó.

**Answer: B**

---

### Question 2
Điều kiện bắt buộc để công cụ đóng gói (Bundler như Vite/Rollup) có thể thực hiện cơ chế Tree Shaking (Loại bỏ các đoạn mã không sử dụng) ra khỏi tập tin build cuối cùng là gì?

A. Mã nguồn và các thư viện phải sử dụng cú pháp ES Modules chuẩn (`import` và `export`)  
B. Mã nguồn phải viết bằng C++  
C. Phải chạy trên hệ điều hành Linux  
D. Cả B và C  

**Explanation:**  
Tree Shaking dựa trên cấu trúc phân tích tĩnh của ES Modules (`import/export`). Các cú pháp nạp động CommonJS kiểu cũ (`require()`) làm cho Bundler không thể xác định tĩnh đoạn code nào bị thừa để loại bỏ.

**Answer: A**

---

### Question 3
Công cụ plugin nào được tích hợp vào `vite.config.ts` để tự động sản sinh ra file báo cáo trực quan dạng hình khối (`stats.html`), giúp bạn phân tích thư viện nào đang chiếm nhiều dung lượng nhất trong tập tin build?

A. `rollup-plugin-visualizer`  
B. `vite-bundle-checker`  
C. `webpack-bundle-analyzer`  
D. `css-size-plugin`  

**Explanation:**  
`rollup-plugin-visualizer` tạo ra tệp báo cáo `stats.html` dạng TreeMap trực quan, hiển thị dung lượng chính xác (KiloBytes) của từng thư viện npm và file mã nguồn sau khi build.

**Answer: A**
