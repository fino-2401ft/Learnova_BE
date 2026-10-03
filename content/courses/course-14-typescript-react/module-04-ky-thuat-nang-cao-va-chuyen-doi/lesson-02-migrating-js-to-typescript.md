---
id: typescript-react-m4-l2
course: TypeScript for React Developers
module: Kỹ thuật nâng cao và chuyển đổi
title: Migrating JS to TypeScript & Best Practices
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Migrating JS to TypeScript & Best Practices

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Làm chủ lộ trình chuyển đổi mã nguồn từng bước (**Step-by-Step Migration Strategy**) từ dự án JavaScript thuần sang TypeScript không gián đoạn tính năng.
- Cấu hình cờ **`allowJs: true`** trong `tsconfig.json` cho phép file `.js` và `.ts` cùng tồn tại song song.
- Chuyển đổi các file JSX thành TSX và sửa chữa các lỗi TypeScript phổ biến nhất trong dự án thực tế.
- Tự động sinh ra định kiểu TypeScript từ các file **JSDoc** có sẵn.
- Cài đặt và quản lý các gói khai báo kiểu cộng đồng từ **DefinitelyTyped (`@types/lodash`, `@types/node`)**.
- Áp dụng danh sách quy tắc Vàng (Best Practices) khi phát triển dự án React với TypeScript.

---

## 📖 Definition

### 1. Chiến Lược Chuyển Đổi Không Gián Đoạn (Incremental Migration Strategy)

Một sai lầm chiến lược của nhiều đội ngũ phát triển là dừng toàn bộ dự án trong 2 tuần để đổi hàng trăm file `.js` sang `.ts` cùng lúc. Việc này tạo ra hàng nghìn lỗi compiler, gây tắc nghẽn merge code và dễ làm phát sinh lỗi dở dang.

**Chiến lược Chuyển Đổi Từng Bước (Incremental Migration):**
1. **Bước 1:** Cài đặt TypeScript và cấu hình `tsconfig.json` với cờ `"allowJs": true`. Trình biên dịch sẽ cho phép file `.js` và `.ts` sống chung hòa bình.
2. **Bước 2:** Định nghĩa các tệp tin lưu trữ Kiểu dữ liệu gốc (`src/types/`).
3. **Bước 3:** Chuyển đổi các hàm tiện ích thuần (Utils, Helpers, API Services) từ `.js` sang `.ts`.
4. **Bước 4:** Chuyển đổi các Component nhỏ không có phụ thuộc từ `.jsx` sang `.tsx`.
5. **Bước 5:** Chuyển đổi các trang giao diện chính và bật dần các cờ kiểm tra nghiêm ngặt (`strict: true`).

```text
┌────────────────────────────────────────────────────────────────────────┐
│               LỘ TRÌNH CHUYỂN ĐỔI INCREMENTAL MIGRATION                │
└────────────────────────────────────────────────────────────────────────┘

 [ Phase 1: tsconfig allowJs: true ] ───> [ Phase 2: Create src/types/ ]
                                                        │
 [ Phase 4: Migrate Components ]     <─── [ Phase 3: Migrate Utils/Services ]
            │
            ▼
 [ Phase 5: Enable strict: true ] ───> [ 100% TYPED CODEBASE! ]
```

---

## 2. Gói Khai Báo Kiểu Community `@types/*` (DefinitelyTyped)

Nhiều thư viện JavaScript cũ (như `lodash`, `qs`, `express`) được viết bằng JS thuần nên không đi kèm file định kiểu `.d.ts`.

Khi bạn `import _ from 'lodash'`, TypeScript sẽ báo lỗi không tìm thấy module.

Giải pháp: Cài đặt gói khai báo kiểu bổ sung từ dự án cộng đồng **DefinitelyTyped**:
`npm install -D @types/lodash @types/qs`

---

## 💻 Syntax

### Migration tsconfig.json Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    
    /* CẤU HÌNH CHO PHÉP MIGRATION TỪNG BƯỚC */
    "allowJs": true,          // Cho phép import file .js vào file .ts
    "checkJs": false,         // Chưa bắt lỗi type trên file .js cũ
    "noImplicitAny": false,   // Tạm thời cho phép any ngầm định trong giai đoạn đầu
    "strict": false           // Tạm tắt strict mode, sẽ bật lại khi hoàn thành 80%
  },
  "include": ["src"]
}
```

---

## 📝 Example 1 - Chuyển Đổi File Utility `formatters.js` Sang `formatters.ts` Với JSDoc Preserve

File cũ `formatters.js` (JavaScript với JSDoc):
```javascript
/**
 * Format số tiền sang VNĐ
 * @param {number} amount 
 * @returns {string}
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
```

File mới `formatters.ts` (TypeScript thuần sạch):
```typescript
// src/utils/formatters.ts

export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export function formatDate(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Ngày không hợp lệ";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}
```

---

## 📝 Example 2 - Chuyển Đổi Component `UserProfileCard.jsx` Sang `UserProfileCard.tsx`

Component cũ `UserProfileCard.jsx`:
```jsx
// UserProfileCard.jsx
export function UserProfileCard({ user, onEdit }) {
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Sửa</button>
    </div>
  );
}
```

Component mới `UserProfileCard.tsx` (Đã được định kiểu an toàn 100%):
```tsx
// src/components/UserProfileCard.tsx
import React from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "admin" | "student";
}

interface UserProfileCardProps {
  user: UserProfile;
  onEdit: (userId: string) => void;
  className?: string;
}

export function UserProfileCard({ user, onEdit, className = "" }: UserProfileCardProps) {
  return (
    <div className={`p-4 border rounded-xl bg-white shadow-sm flex justify-between items-center ${className}`}>
      <div className="flex items-center space-x-3">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="font-bold text-slate-900">{user.name}</h3>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>

      <button
        onClick={() => onEdit(user.id)}
        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition-colors"
      >
        Chỉnh sửa
      </button>
    </div>
  );
}
```

---

## 📝 Example 3 - Bảng Quy Tắc Vàng (Best Practices Checklist) Khi Lập Trình React TypeScript

```text
┌────────────────────────────────────────────────────────────────────────┐
│           CHECKLIST QUY TẮC VÀNG CHO DỰ ÁN REACT TYPESCRIPT            │
└────────────────────────────────────────────────────────────────────────┘
  1. [ ] CẤM lạm dụng kiểu `any`. Dùng `unknown` + Type Guards khi không chắc chắn.
  2. [ ] Khai báo interface cho toàn bộ Component Props và API Responses.
  3. [ ] BẬT `strict: true` và `strictNullChecks: true` trong tsconfig.json.
  4. [ ] Dùng `useAppDispatch` và `useAppSelector` cho Redux Toolkit.
  5. [ ] Dùng `React.ReactNode` làm kiểu dữ liệu chuẩn cho thuộc tính `children`.
  6. [ ] Tạo thư mục `src/types/` lưu trữ tập trung các Interfaces dùng chung.
  7. [ ] Tận dụng Type Inference: Không khai báo kiểu thừa cho hằng số rõ ràng (`const a = 1`).
```

---

## ⚠️ Notes

1. **Không Khai Báo Kiểu Thừa Thãi (Over-typing):** TypeScript có khả năng tự động suy luận kiểu (Type Inference) rất thông minh. Khi bạn viết `const name = "Nguyễn Long"`, TypeScript đã tự hiểu `name` có kiểu `string`. Việc viết `const name: string = "Nguyễn Long"` là dư thừa không cần thiết.

---

## ❌ Common Mistakes

### Sai 1 - Dùng cờ `// @ts-ignore` tràn lan để che giấu lỗi
```typescript
// ❌ SAI NGUY HIỂM: Dùng @ts-ignore tắt báo lỗi mà không sửa nguyên nhân gốc rễ!
// @ts-ignore
const total = user.score + 10; 

// ✅ ĐÚNG CHUẨN: Xử lý null check hoặc gán kiểu chính xác
const total = (user.score ?? 0) + 10;
```

---

## 📚 Summary

- Chuyển đổi mã nguồn theo lộ trình từng bước (**Incremental Migration**) bằng cờ `"allowJs": true`.
- Chuyển đổi từ Utils/Services ➔ UI Components nhỏ ➔ Pages chính.
- Cài đặt gói `@types/library` cho các thư viện JS thuần.
- Tránh over-typing, tận dụng khả năng tự suy luận kiểu (**Type Inference**).
- Tránh dùng `any` và `// @ts-ignore`. Bật cờ `strict: true` khi hoàn thành migration.

---

## 📝 Quiz

### Question 1
Cờ cấu hình nào trong `tsconfig.json` cho phép tệp tin `.js` và `.ts` sống chung hòa bình và import lẫn nhau trong giai đoạn chuyển đổi từng bước (Incremental Migration)?

A. `"allowJs": true`  
B. `"checkJs": true`  
C. `"strict": false`  
D. `"noImplicitAny": false`  

**Explanation:**  
Cờ `"allowJs": true` cho phép trình biên dịch TypeScript chấp nhận và xử lý cả các tệp tin `.js` lẫn `.ts` trong cùng một dự án, giúp đội ngũ phát triển chuyển đổi từng file một mà không làm ngưng trệ dự án.

**Answer: A**

---

### Question 2
Khi cài đặt một thư viện JavaScript cũ không đi kèm tập tin định kiểu `.d.ts` (như `lodash`), bạn nên cài đặt gói khai báo kiểu bổ sung nào từ cộng đồng DefinitelyTyped?

A. `npm install lodash-types`  
B. `npm install -D @types/lodash`  
C. `npm install typescript-lodash`  
D. `npm install ts-lodash`  

**Explanation:**  
Dự án cộng đồng DefinitelyTyped lưu trữ tất cả các gói khai báo kiểu cho các thư viện JS thuần dưới namespace `@types/package-name` (ví dụ `@types/lodash`, `@types/express`, `@types/react`).

**Answer: B**

---

### Question 3
Hành vi nào dưới đây được coi là Anti-pattern nguy hiểm làm vô hiệu hóa khả năng bảo vệ của TypeScript trong dự án thực tế?

A. Bật cờ `strict: true`  
B. Lạm dụng kiểu `any` và dùng câu lệnh `// @ts-ignore` tràn lan để che giấu các thông báo lỗi thay vì sửa nguyên nhân gốc rễ  
C. Khai báo interface cho Props  
D. Dùng Generics  

**Explanation:**  
Việc dùng `any` và `// @ts-ignore` tràn lan sẽ tắt bỏ sự kiểm tra của trình biên dịch TypeScript, làm cho mã nguồn trở về trạng thái nguy hiểm của JS thuần và dễ phát sinh lỗi runtime crash ứng dụng.

**Answer: B**
