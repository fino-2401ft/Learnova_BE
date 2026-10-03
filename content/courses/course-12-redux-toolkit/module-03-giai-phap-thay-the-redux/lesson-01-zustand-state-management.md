---
id: redux-toolkit-m3-l1
course: State Management — Redux Toolkit & Modern State
module: Giải pháp thay thế Redux
title: Zustand — Lightweight State Management Alternative
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Zustand — Lightweight State Management Alternative

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích tại sao **Zustand** trở thành thư viện quản lý trạng thái toàn cục siêu nhẹ (Lightweight State Management) được các cộng đồng React lớn yêu thích và lựa chọn thay thế cho Redux Toolkit.
- Khởi tạo và xây dựng Store với hàm `create()` của Zustand mà không cần bất kỳ Provider Component nào bọc ngoài ứng dụng.
- Định nghĩa các thuộc tính State và hàm biến đổi Actions trong cùng một Store tập trung ngắn gọn.
- Sử dụng các Middleware mạnh mẽ của Zustand như **`persist`** (tự động lưu vĩnh viễn State vào `localStorage`) và **`devtools`** (kết nối Redux DevTools).
- Đọc và ghi dữ liệu Zustand Store từ các file JavaScript/TypeScript thuần túy nằm bên ngoài React Components.
- Áp dụng kỹ thuật trích xuất dữ liệu bằng Selectors để tối ưu hóa hiệu năng Re-render.

---

## 📖 Definition

### 1. Tại Sao Zustand Trở Thành Xu Hướng Hàng Đầu?

Trong nhiều dự án React vừa và lớn, việc thiết lập Redux Toolkit (với Slices, configureStore, Provider, Typed Hooks) đôi khi tạo ra quá nhiều rào cản mã nguồn (Boilerplate).

**Zustand** (tiếng Đức nghĩa là *"Trạng thái"*) được xây dựng bởi nhóm phát triển Poimandres (tác giả của React Spring, Jotai, Three.js) với các ưu điểm vượt trội:

1. **Siêu Nhẹ (Micro Bundle Size):** Dung lượng file chỉ **~1KB** (gấp 10 lần nhỏ hơn Redux Toolkit).
2. **Không Cần `<Provider>`:** Ứng dụng của bạn hoàn toàn sạch sẽ, không có tình trạng "Provider Hell" lồng nhau 10 tầng (`<AuthProvider><ThemeProvider><StoreProvider>...`).
3. **API Cực Kỳ Tối Giản:** State và Actions nằm chung 1 file duy nhất. Không có Action Types hay Reducers phức tạp.
4. **Truy Cập Ngoại Vi (Transient State Access):** Có thể đọc và dispatch state từ bất kỳ hàm utility, Axios Interceptor, hay Router Guard nào ngoài React Component via `useStore.getState()` và `useStore.setState()`.
5. **Hiệu Năng Tự Động Tối Ưu:** Component chỉ Re-render khi thuộc tính được chọn qua Selector thực sự bị thay đổi.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   KIẾN TRÚC TỐI GIẢN CỦA ZUSTAND STORE                 │
└────────────────────────────────────────────────────────────────────────┘

   [ External JS File / Axios ] ─── read/write via ──┐
                                                    │
                                                    ▼
 [ React Component ] ───( Selector Hook )───> [ Zustand Store ]
        ▲                                     ( State + Actions )
        └──────────── ( Auto Re-render ) ───────────┘
```

---

## 2. Hàm `set` và `get` Trong Zustand

Khi định nghĩa một Store bằng `create((set, get) => ({ ... }))`:

- **`set(partialStateOrUpdater)`**: Hàm dùng để cập nhật State. Nhờ cơ chế gộp nông (Shallow Merge), bạn chỉ cần truyền vào phần thuộc tính muốn thay đổi: `set({ count: 10 })`.
- **`get()`**: Hàm dùng để đọc State hiện tại của Store bên trong các Actions (ví dụ: `const currentCart = get().cart`).

---

## 3. Persistent State Với Middleware `persist`

Middleware `persist` của Zustand tự động đóng gói toàn bộ hoặc một phần State của Store và lưu vĩnh viễn vào `localStorage` (hoặc `sessionStorage`). Khi người dùng F5 tải lại trang web, Zustand sẽ tự động khôi phục (**Rehydrate**) lại dữ liệu đó vào RAM trong 0ms.

---

## 💻 Syntax

### 1. Định nghĩa Zustand Store Đơn Giản
```typescript
import { create } from "zustand";

interface BearState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

export const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 })
}));
```

### 2. Sử dụng Store trong React Component
```tsx
function BearCounter() {
  // 💡 BẮT BUỘC: Dùng Selector trích xuất đúng thuộc tính "bears" để tránh Re-render thừa!
  const bears = useBearStore((state) => state.bears);
  const increasePopulation = useBearStore((state) => state.increasePopulation);

  return (
    <div>
      <h1>Số lượng gấu: {bears}</h1>
      <button onClick={increasePopulation}>+ Thêm Gấu</button>
    </div>
  );
}
```

---

## 📝 Example 1 - Tạo `useCartStore` Quản Lý Giỏ Hàng Tính Tổng Tiền Tự Động (TypeScript)

```typescript
// src/store/useCartStore.ts
import { create } from "zustand";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

interface CartStore {
  cart: CartItem[];
  addToCart: (product: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  // Getters tính toán
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],

  // 1. Action Thêm vào giỏ
  addToCart: (product) => set((state) => {
    const existingIndex = state.cart.findIndex(item => item.id === product.id);
    if (existingIndex > -1) {
      const updatedCart = [...state.cart];
      updatedCart[existingIndex].quantity += 1;
      return { cart: updatedCart };
    }
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),

  // 2. Action Xóa khỏi giỏ
  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter(item => item.id !== id)
  })),

  // 3. Action Tăng/Giảm số lượng
  updateQuantity: (id, delta) => set((state) => ({
    cart: state.cart
      .map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[]
  })),

  // 4. Action Xóa sạch
  clearCart: () => set({ cart: [] }),

  // 5. Getter đọc State bằng hàm get()
  getTotalItems: () => {
    return get().cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}));
```

---

## 📝 Example 2 - Tự Động Đồng Bộ LocalStorage Bằng `persist` và Kết Nối `devtools`

```typescript
// src/store/useAuthStore.ts
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthStore {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: { user: UserProfile; token: string }) => void;
  logout: () => void;
}

// Kết hợp cả devtools (Redux DevTools) và persist (LocalStorage)
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,

        login: (data) => set({
          user: data.user,
          token: data.token,
          isAuthenticated: true
        }, false, "auth/login"), // Tham số thứ 3 định danh tên Action trong DevTools

        logout: () => set({
          user: null,
          token: null,
          isAuthenticated: false
        }, false, "auth/logout")
      }),
      {
        name: "educonnect_auth_storage", // Tên key trong localStorage
        partialize: (state) => ({ token: state.token, user: state.user }) // Chỉ lưu token và user, bỏ qua isAuthenticated
      }
    ),
    { name: "AuthStore" }
  )
);
```

---

## 📝 Example 3 - Đọc & Ghi Zustand Store Từ File Axios Interceptors Ngoài React Component

```typescript
// src/services/apiClient.ts
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const apiClient = axios.create({
  baseURL: "https://api.educonnect.vn/api/v1"
});

// 💡 ĐỌC STORE NGOÀI REACT COMPONENT: Dùng useAuthStore.getState()
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 💡 GHI STORE NGOÀI REACT COMPONENT: Dùng useAuthStore.getState().logout()
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token hết hạn. Tự động đăng xuất từ Axios Interceptor!");
      // Gọi trực tiếp Action logout ngoài React Component!
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## ⚠️ Notes

1. **Luôn Luôn Sử Dụng Selectors:** Tuyệt đối không viết `const store = useCartStore()` trong Component. Việc trích xuất toàn bộ `store` sẽ khiến Component đó re-render lại ở **MỌI LẦN** bất kỳ biến nào trong Zustand Store thay đổi. Hãy luôn dùng selector: `const cart = useCartStore(s => s.cart)`.
2. **So Sánh Nông Khi Chọn Nhiều Properties (Shallow):** Nếu bạn muốn chọn nhiều thuộc tính cùng lúc, dùng `useShallow`:
   ```typescript
   import { useShallow } from 'zustand/react/shallow';
   const { cart, clearCart } = useCartStore(useShallow(s => ({ cart: s.cart, clearCart: s.clearCart })));
   ```

---

## ❌ Common Mistakes

### Sai 1 - Destructure toàn bộ Store trực tiếp từ Hook
```tsx
// ❌ SAI TAI HẠI: Component này sẽ bị Re-render bất cứ khi nào BẤT KỲ state nào trong Store bị đổi!
function BadCartBadge() {
  const { cart, user, settings } = useCartStore(); // Re-render thừa!
  return <span>{cart.length}</span>;
}

// ✅ ĐÚNG CHUẨN ZUSTAND:
function GoodCartBadge() {
  const cartLength = useCartStore(state => state.cart.length); // Chỉ re-render khi cart.length đổi!
  return <span>{cartLength}</span>;
}
```

---

## 📚 Summary

- **Zustand** là thư viện State Management siêu nhẹ (~1KB), có API tối giản và **không cần `<Provider>`**.
- Khai báo Store dễ dàng bằng `create((set, get) => ({ state, actions }))`.
- Middleware **`persist`** tự động lưu và khôi phục State từ `localStorage`.
- Dễ dàng đọc/ghi State ngoài React Component qua **`useStore.getState()`**.
- Luôn trích xuất dữ liệu bằng **Selectors** để triệt tiêu hiện tượng Re-render thừa.

---

## 📝 Quiz

### Question 1
Ưu điểm đột phá mấu chốt của Zustand so với Redux Toolkit khi tích hợp vào một ứng dụng React là gì?

A. Zustand bắt buộc phải dùng với CSDL PostgreSQL  
B. Zustand không cần bất kỳ Provider Component nào bọc ngoài ứng dụng, dung lượng siêu nhẹ (~1KB) và có lượng mã rườm rà (Boilerplate) cực kỳ nhỏ  
C. Zustand chỉ hoạt động được trên trình duyệt Firefox  
D. Zustand chạy chậm hơn Redux 10 lần  

**Explanation:**  
Zustand nổi tiếng với triết lý thiết kế tối giản: Không có Provider bọc ngoài ứng dụng, dung lượng tệp tin cực kỳ nhỏ (~1KB), và State cùng Actions nằm chung trong 1 file đơn giản, giúp xóa bỏ hoàn toàn boilerplate code.

**Answer: B**

---

### Question 2
Phương thức nào của Zustand Store cho phép lập trình viên đọc trực tiếp trạng thái State hiện tại bên trong các file JavaScript/TypeScript thuần túy nằm bên ngoài React Components (như trong Axios Interceptor)?

A. `useStore.readState()`  
B. `useStore.getState()`  
C. `useStore.extract()`  
D. `useStore.fetch()`  

**Explanation:**  
Zustand cho phép truy cập và tương tác với Store từ môi trường ngoài React bằng cách gọi `useStore.getState()` để đọc dữ liệu và `useStore.setState()` để dispatch thay đổi.

**Answer: B**

---

### Question 3
Để tránh hiện tượng Re-render thừa cho Component khi sử dụng Zustand, cách trích xuất dữ liệu nào sau đây là đúng chuẩn?

A. `const store = useCartStore();`  
B. `const cart = useCartStore((state) => state.cart);`  
C. `const cart = window.useCartStore.cart;`  
D. `const cart = useCartStore.get("cart");`  

**Explanation:**  
Zustand sử dụng Selector function `(state) => state.cart` để thu hẹp phạm vi dữ liệu tiêu thụ. Component sẽ chỉ bị Re-render lại khi và chỉ khi thuộc tính được chọn bởi Selector bị thay đổi giá trị.

**Answer: B**
