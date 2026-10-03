---
id: react-hooks-patterns-m2-l2
course: React Hooks & Patterns Nâng Cao
module: Tối ưu và tái sử dụng logic
title: Custom Hooks
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Custom Hooks

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu bản chất và lợi ích của **Custom Hooks** trong việc tái sử dụng logic có trạng thái (Stateful Logic).
- Đặt tên và tuân thủ các quy tắc xây dựng Custom Hook (Bắt đầu bằng tiền tố `use`).
- Xây dựng các Custom Hook phổ biến trong thực tế: `useFetch`, `useLocalStorage`, `useDebounce`, `useForm`.
- Phân biệt giữa tái sử dụng Logic (Custom Hooks) và tái sử dụng Giao diện (Components).
- Nắm vững nguyên tắc: Mỗi lần gọi Custom Hook ở các Component khác nhau sẽ khởi tạo các vùng State hoàn toàn độc lập.

---

## 📖 Definition

### 1. Custom Hook là gì?
Custom Hook là một hàm JavaScript do lập trình viên tự định nghĩa, cho phép **đóng gói và tái sử dụng các đoạn logic có chứa React Hooks** (như `useState`, `useEffect`, `useCallback`) giữa nhiều Component khác nhau.

### 2. Quy tắc bắt buộc khi tạo Custom Hook
- **Tên hàm phải bắt đầu bằng chữ `use`:** Ví dụ `useFetch`, `useAuth`, `useLocalStorage`. Quy tắc này giúp linter của React nhận biết và áp dụng đúng các quy tắc kiểm tra Hooks (Rules of Hooks).
- **Chỉ gọi Hooks ở cấp cao nhất:** Bên trong Custom Hook, bạn có thể tự do gọi các React Hooks tích hợp sẵn khác (`useState`, `useEffect`...).

### 3. Lưu ý quan trọng về State cách ly
Custom Hook **KHÔNG chia sẻ dữ liệu State** giữa các Component cùng sử dụng nó. Khi hai Component `ComponentA` và `ComponentB` cùng gọi `useFetch('/api')`, mỗi Component sẽ có các biến State `data`, `isLoading` riêng biệt hoàn toàn độc lập trong bộ nhớ.

---

## 💻 Syntax

### Custom Hook Template Structure
```jsx
import { useState, useEffect } from "react";

// Tên hàm bắt đầu bằng "use"
export function useCustomLogic(initialParam) {
  const [data, setData] = useState(initialParam);

  useEffect(() => {
    // Logic tác dụng phụ...
  }, [initialParam]);

  // Trả về mảng [] hoặc đối tượng {} dữ liệu và các hàm thao tác
  return { data, setData };
}
```

---

## 📝 Example 1 - Xây dựng Custom Hook `useLocalStorage` đồng bộ dữ liệu trình duyệt

```jsx
// src/hooks/useLocalStorage.js
import { useState, useEffect } from "react";

export function useLocalStorage(key, defaultValue) {
  // Khởi tạo State từ LocalStorage nếu có
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Lỗi đọc localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Cập nhật LocalStorage mỗi khi storedValue thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Lỗi ghi localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// Sử dụng trong Component
export function SettingsApp() {
  const [theme, setTheme] = useLocalStorage("app_theme", "light");

  return (
    <div>
      <h3>Theme hiện tại: {theme}</h3>
      <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
        Đổi Theme
      </button>
    </div>
  );
}
```

---

## 📝 Example 2 - Custom Hook `useFetch` đóng gói logic gọi API và quản lý State Loading/Error

```jsx
// src/hooks/useFetch.js
import { useState, useEffect } from "react";

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setIsLoading(true);

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error status: ${res.status}`);
        return res.json();
      })
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, isLoading, error };
}

// Sử dụng gọn gàng trong Component
export function PostList() {
  const { data: posts, isLoading, error } = useFetch("https://jsonplaceholder.typicode.com/posts?_limit=3");

  if (isLoading) return <p>⏳ Đang tải bài viết...</p>;
  if (error) return <p>❌ Lỗi: {error}</p>;

  return (
    <ul>
      {posts?.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
```

---

## 📝 Example 3 - Custom Hook `useDebounce` hoãn thực thi từ khóa tìm kiếm

```jsx
// src/hooks/useDebounce.js
import { useState, useEffect } from "react";

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy timer cũ nếu value tiếp tục thay đổi trước khi hết delay ms
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Sử dụng trong ô Tìm Kiếm API
export function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 600);

  useEffect(() => {
    if (debouncedSearch) {
      console.log(`[API CALL] Gọi API tìm kiếm từ khóa: "${debouncedSearch}"`);
    }
  }, [debouncedSearch]);

  return (
    <input 
      type="text" 
      value={searchTerm} 
      onChange={(e) => setSearchTerm(e.target.value)} 
      placeholder="Nhập từ khóa tìm kiếm..." 
    />
  );
}
```

---

## ⚠️ Notes

1. **Bắt buộc tiền tố `use`:** Nếu bạn tạo một hàm tái sử dụng có gọi `useState` nhưng lại đặt tên là `fetchData()` thay vì `useFetchData()`, React Linter sẽ báo lỗi không tuân thủ Rules of Hooks.
2. **Custom Hook trả về gì?** Không có quy định cứng nhắc. Bạn có thể trả về một mảng `[value, setter]` (như `useState`), một đối tượng `{ data, isLoading, error }`, hoặc một hàm tùy ý.

---

## ❌ Common Mistakes

### Sai 1 - Tưởng rằng Custom Hook dùng chung một vùng bộ nhớ State giữa các Component
```jsx
// ❌ Hiểu nhầm: ComponentA đổi state trong useLocalStorage thì ComponentB cũng tự đổi theo ngay lập tức
// 💡 Sự thật: Mỗi component khi gọi useLocalStorage() đều khởi tạo một instance State riêng biệt độc lập!
```

---

## 📚 Summary

- **Custom Hook** là hàm JS bắt đầu bằng từ `use`, bóc tách logic chứa State/Side Effects để tái sử dụng.
- Tái sử dụng **Stateful Logic**, không tái sử dụng UI JSX.
- Mỗi lần gọi Custom Hook tại một Component sẽ tạo ra một vùng bộ nhớ State cách ly hoàn toàn.
- Giúp Component UI trở nên cực kỳ ngắn gọn, sạch sẽ và dễ viết Unit Test.

---

## 📝 Quiz

### Question 1
Quy tắc bắt buộc phải tuân thủ khi đặt tên cho một Custom Hook trong React là gì?

A. Phải kết thúc bằng từ `Component`  
B. Phải bắt đầu bằng tiền tố `use` (viết chữ thường)  
C. Phải viết HOA toàn bộ tên hàm  
D. Phải bắt đầu bằng chữ `get`  

**Answer: B**

---

### Question 2
Custom Hook trong React giúp tái sử dụng thành phần nào giữa các Component?

A. Tái sử dụng các đoạn thẻ HTML/JSX  
B. Tái sử dụng các đoạn Logic chứa trạng thái (Stateful Logic)  
C. Tái sử dụng thuộc tính CSS  
D. Tự động chia sẻ vùng nhớ State chung  

**Answer: B**

---

### Question 3
Khi hai Component A và B cùng gọi một Custom Hook `useCounter()`, mối quan hệ giữa State của Component A và B là gì?

A. Hoàn toàn cách ly và độc lập với nhau  
B. Dùng chung một vùng bộ nhớ State  
C. Component B sẽ ghi đè State của Component A  
D. Không Component nào khởi tạo được State  

**Answer: A**
