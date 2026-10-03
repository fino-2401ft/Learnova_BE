---
id: redux-toolkit-m3-l3
course: State Management — Redux Toolkit & Modern State
module: Giải pháp thay thế Redux
title: Comparing State Solutions: Redux vs Zustand vs Context vs TanStack Query
order: 3
difficulty: Advanced
estimatedTime: 240
---
# Comparing State Solutions: Redux vs Zustand vs Context vs TanStack Query

## 🎯 Learning Objectives

Sau bài học này, bạn me:
- So sánh toàn diện ưu nhược điểm của 4 giải pháp quản lý State hàng đầu: **Context API**, **Redux Toolkit (RTK)**, **Zustand**, và **TanStack Query**.
- Làm chủ Ma Trận Ra Quyết Định Kiến Trúc (Architecture Decision Matrix) cho các dự án React ở mọi quy mô.
- Thiết kế mô hình kết hợp đa tầng (**Hybrid State Architecture Pattern**) phân chia rõ ràng trách nhiệm giữa Client State và Server State trong ứng dụng Enterprise.
- Đánh giá tác động của từng giải pháp lên dung lượng đóng gói (**Bundle Size**) và độ phức tạp mã nguồn (Developer Experience).
- Refactor chuyển đổi mã nguồn mượt mà từ các giải pháp cồng kềnh sang các kiến trúc hiện đại tối giản.

---

## 📖 Definition

### 1. Bảng So Sánh Chi Tiết Toàn Diện 4 Giải Pháp State Management

| Tiêu chí Đánh giá | React Context API | Redux Toolkit (RTK) | Zustand | TanStack Query |
|---|---|---|---|---|
| **Phân loại Trách nhiệm** | Shared UI / Prop Drilling | Global Client State | Global Client State | Server State & Caching |
| **Dung lượng Bundle Size** | **0 KB** (Tích hợp sẵn) | **~11 KB** | **~1 KB** (Siêu nhẹ) | **~13 KB** |
| **Yêu cầu Provider?** | **CÓ** (`<Context.Provider>`) | **CÓ** (`<Provider>`) | **KHÔNG CẦN** | **CÓ** (`<QueryClientProvider>`) |
| **Độ phức tạp Mã nguồn** | Thấp | Trung bình - Cao | Rất thấp (Tối giản) | Thấp (Tự động hóa API) |
| **Hiệu năng Re-render** | Dễ bị thừa nếu không bóc tách | Rất cao (dùng Selector) | Rất cao (dùng Selector) | Rất cao (Automatic Deduplication) |
| **Caching API Server** | KHÔNG | Có (RTK Query) | KHÔNG | **MẠNH NHẤT THẾ GIỚI** |
| **Công cụ Debugging** | Cơ bản | **Redux DevTools** (Mạnh nhất) | Redux DevTools | **React Query DevTools** |
| **Kịch bản Khuyên dùng** | Theme, Auth, Local Modal | Dự án Enterprise siêu lớn | Dự án vừa & lớn hiện đại | **Mọi ứng dụng gọi API** |

---

## 2. Mô Hình Phối Hợp Đa Tầng (Hybrid State Architecture Pattern)

Trong các ứng dụng React sản phẩm hiện đại, tư duy đúng đắn nhất là **không phụ thuộc 100% vào một thư viện duy nhất**, mà phối hợp chuyên biệt hóa trách nhiệm theo đúng thế mạnh của từng công cụ:

```text
┌────────────────────────────────────────────────────────────────────────┐
│             MÔ HÌNH PHỐI HỢP NGUYÊN TẮC HYBRID STATE ARCHITECTURE       │
└────────────────────────────────────────────────────────────────────────┘

 [ 1. SERVER STATE ] ─────────> TanStack Query / RTK Query
                                (100% API Calls, Caching, Refetch)

 [ 2. GLOBAL CLIENT STATE ] ──> Zustand / Redux Toolkit
                                (Cart, User Preferences, Layout State)

 [ 3. SCOPED SHARED STATE ] ──> React Context API
                                (Local Form Wizard, Compound Component)

 [ 4. LOCAL COMPONENT STATE ] ─> useState / useReducer
                                (Input text, Toggle dropdown, Hover)
```

---

## 3. Thác Quyết Định Kiến Trúc (Decision Flowchart)

Khi chuẩn bị khởi tạo một State mới, hãy đặt 4 câu hỏi theo thứ tự sau:

```text
                             State này từ đâu ra?
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
       [ Nạp từ API Server ]                      [ Tạo ra ở Browser ]
               │                                             │
               ▼                                             ▼
    Dùng TANSTACK QUERY                       State có cần chia sẻ giữa
     (hoặc RTK Query)                         nhiều trang độc lập không?
                                                             │
                                              ┌──────────────┴──────────────┐
                                              ▼                             ▼
                                           [ CÓ ]                        [ KHÔNG ]
                                              │                             │
                                              ▼                             ▼
                                      Dùng ZUSTAND                 Dùng useState() /
                                    (hoặc Redux Toolkit)            Context API
```

---

## 💻 Syntax

### Complete Hybrid Architecture Integration Pattern
```tsx
// 1. TanStack Query quản lý Server State
const { data: products } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });

// 2. Zustand quản lý Global Client State (Giỏ hàng)
const addToCart = useCartStore((s) => s.addToCart);

// 3. useState quản lý Local Component State (Số lượng chọn)
const [quantity, setQuantity] = useState(1);
```

---

## 📝 Example 1 - Phối Hợp Zustand (Client State) và TanStack Query (Server State) Chuẩn Doanh Nghiệp

```tsx
// src/features/catalog/CatalogPage.tsx
import React from "react";
import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";

// 1. ZUSTAND STORE: Quản lý trạng thái Bộ lọc giao diện (Client State)
interface FilterStore {
  category: string;
  sortBy: "price_asc" | "price_desc" | "name";
  setCategory: (cat: string) => void;
  setSortBy: (sort: "price_asc" | "price_desc" | "name") => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  category: "all",
  sortBy: "name",
  setCategory: (category) => set({ category }),
  setSortBy: (sortBy) => set({ sortBy })
}));

// 2. TANSTACK QUERY: Gọi API lấy dữ liệu tự động đồng bộ theo Zustand Filter Store (Server State)
async function fetchCatalogApi(category: string, sortBy: string) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts?cat=${category}&sort=${sortBy}`);
  if (!res.ok) throw new Error("Lỗi nạp danh sách sản phẩm");
  return res.json();
}

export function CatalogPage() {
  // Trích xuất State lọc từ Zustand
  const { category, sortBy, setCategory, setSortBy } = useFilterStore();

  // TanStack Query tự động gọi lại API nạp data mới mỗi khi Zustand State (category, sortBy) thay đổi!
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["catalog", category, sortBy],
    queryFn: () => fetchCatalogApi(category, sortBy),
    staleTime: 1000 * 60 * 5 // Cache 5 phút
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sàn Sản Phẩm (Hybrid Architecture)</h1>

      {/* Bộ Lọc UI gắn với Zustand */}
      <div className="flex space-x-4 mb-6 p-4 bg-slate-100 rounded-xl">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 rounded border">
          <option value="all">Tất cả danh mục</option>
          <option value="electronics">Điện tử</option>
          <option value="books">Sách</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="p-2 rounded border">
          <option value="name">Sắp xếp theo tên</option>
          <option value="price_asc">Giá tăng dần</option>
        </select>
      </div>

      {/* Hiển thị Dữ liệu Server State từ TanStack Query */}
      {isLoading ? (
        <p className="text-slate-500">⏳ Đang tải dữ liệu từ Server...</p>
      ) : isError ? (
        <p className="text-red-500">❌ Đã xảy ra lỗi API</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products?.map((p: any) => (
            <div key={p.id} className="p-4 border rounded-xl bg-white shadow-sm">
              <h3 className="font-bold">{p.title}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📝 Example 2 - Refactor Từ Redux Cồng Kềnh Sang Zustand Ngắn Gọn (Chuyển Đổi Thực Tế)

```javascript
// ❌ CẤU TRÚC CŨ (Redux Toolkit): Phải tạo slice, export action, reducer, configure store...
// const filterSlice = createSlice({
//   name: 'filter',
//   initialState: { search: '' },
//   reducers: { setSearch: (state, action) => { state.search = action.payload; } }
// });

// ✅ CẤU TRÚC MỚI (Zustand): Chỉ 6 dòng code cực kỳ ngắn gọn, không cần Provider!
import { create } from "zustand";

export const useSearchStore = create((set) => ({
  search: "",
  setSearch: (search) => set({ search })
}));
```

---

## ⚠️ Notes

1. **Khi Nào Nên Chọn Redux Toolkit Thay Vì Zustand?**
   - Khi công ty bạn có quy chuẩn mã nguồn (Coding Standard) bắt buộc dùng Redux.
   - Khi dự án có đội ngũ lớn hàng trăm dev cần cấu trúc Slices/Actions nghiêm ngặt.
   - Khi cần khả năng Time-travel Debugging cực kỳ sâu của Redux DevTools trong các ứng dụng tài chính/ngân hàng.
2. **Khi Nào Nên Chọn Zustand?**
   - Cho 90% các dự án React vừa và lớn hiện đại muốn phát triển nhanh, giảm mã rườm rà và tối ưu Bundle Size (~1KB).

---

## ❌ Common Mistakes

### Sai 1 - Cố tình dùng Context API cho State biến đổi liên tục toàn ứng dụng
Context API không được thiết kế cho các State biến đổi với tần suất cao (High-frequency state updates như vị trí con trỏ chuột, dữ liệu ô input real-time). Việc này sẽ làm trễ và đơ giao diện do Re-render lan truyền toàn bộ cây Component con.

---

## 📚 Summary

- **Context API:** Tốt nhất cho Shared UI State nhỏ, ít thay đổi (Theme, Auth).
- **Zustand:** Tốt nhất cho Client State toàn cục với cú pháp siêu nhẹ (~1KB) và không cần `<Provider>`.
- **Redux Toolkit:** Tốt nhất cho ứng dụng Enterprise cực lớn cần quy chuẩn chặt chẽ và Redux DevTools sâu.
- **TanStack Query:** Giải pháp số 1 thế giới cho Server State, API Caching, và Sync dữ liệu.
- Áp dụng mô hình **Hybrid Architecture**: Dùng TanStack Query cho Server State + Zustand cho Client State.

---

## 📝 Quiz

### Question 1
Thư viện nào dưới đây được đánh giá là giải pháp số 1 thế giới dành riêng cho việc quản lý Server State (API Data Fetching, Caching, Invalidation, Synchronization) trong ứng dụng React?

A. React Context API  
B. TanStack Query (React Query)  
C. Redux Core  
D. LocalStorage  

**Explanation:**  
TanStack Query được xây dựng chuyên biệt để xử lý 100% các bài toán bất đồng bộ của Server State bao gồm Caching, Deduplication, Stale Revalidation, và Automated Invalidation mà không cần lập trình viên phải tự viết mã thủ công.

**Answer: B**

---

### Question 2
Trong mô hình kiến trúc Hybrid State Architecture của một ứng dụng React sản phẩm hiện đại, sự phân chia trách nhiệm chuẩn nhất giữa Zustand và TanStack Query là gì?

A. Zustand quản lý Server State, TanStack Query quản lý CSS  
B. TanStack Query quản lý 100% dữ liệu máy chủ (Server State / API Caching), trong khi Zustand quản lý các trạng thái giao diện máy khách toàn cục (Global Client State như Cart, Theme)  
C. Cả hai làm cùng 1 việc trùng lặp  
D. Zustand thay thế hoàn toàn HTML  

**Explanation:**  
Mô hình Hybrid phân chia đúng thế mạnh: TanStack Query đảm nhận toàn bộ dữ liệu từ API Server (nạp, cache, làm tươi), còn Zustand đảm nhận các trạng thái Client thuần túy (giỏ hàng, cài đặt UI) với dung lượng siêu nhẹ 1KB.

**Answer: B**

---

### Question 3
Nhược điểm lớn nhất về mặt hiệu năng của việc lạm dụng React Context API cho các State thay đổi với tần suất cao (High-frequency state updates) là gì?

A. Context API làm tăng dung lượng file build lên 50MB  
B. Khi giá trị Context Provider thay đổi, tất cả các Component con đăng ký tiêu thụ Context đó đều bị bắt buộc Re-render lại, gây trễ lag giao diện  
C. Context API không chạy được trên trình duyệt Chrome  
D. Context API bị xóa khỏi React 18  

**Explanation:**  
React Context API không có cơ chế Selector tự động như Zustand hay Redux. Mỗi khi value của `Context.Provider` thay đổi, toàn bộ các Component gọi `useContext` đều bị re-render lại, gây ảnh hưởng hiệu năng nghiêm trọng nếu state đó thay đổi liên tục.

**Answer: B**
