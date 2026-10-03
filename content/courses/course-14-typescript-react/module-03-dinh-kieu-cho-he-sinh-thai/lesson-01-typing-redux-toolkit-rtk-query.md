---
id: typescript-react-m3-l1
course: TypeScript for React Developers
module: Định kiểu cho hệ sinh thái
title: Typing Redux Toolkit & RTK Query
order: 1
difficulty: Intermediate
estimatedTime: 240
---
# Typing Redux Toolkit & RTK Query

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Trích xuất kiểu dữ liệu chuẩn của Redux Store với **`RootState`** và **`AppDispatch`**.
- Tạo các Typed Hooks tùy chỉnh **`useAppDispatch`** và **`useAppSelector`** giúp loại bỏ việc gán kiểu thủ công ở từng Component.
- Khai báo kiểu chính xác cho `PayloadAction<T>` trong các Slices của Redux Toolkit.
- Định kiểu cho `createAsyncThunk` sử dụng cấu hình **`AsyncThunkConfig`** (định kiểu cho `state`, `rejectValue`).
- Định kiểu cho API Endpoints trong **RTK Query** (`builder.query<ResultType, QueryArg>`).

---

## 📖 Definition

### 1. Tại Sao Cần Typed Redux Hooks (`useAppDispatch` & `useAppSelector`)?

Nếu bạn sử dụng `useSelector` và `useDispatch` gốc của `react-redux`:
- Mỗi lần viết `useSelector((state) => state.auth)` ➔ `state` sẽ có kiểu `any` hoặc `unknown` nếu bạn không tự ép kiểu `(state: RootState) => ...`.
- Lệnh `dispatch(myAsyncThunk())` không nhận diện được các Thunks bất đồng bộ.

Bằng cách tạo cặp Typed Hooks chuẩn chuẩn **`useAppDispatch`** và **`useAppSelector`** tại file `store.ts`:
- **100% Autocompletion:** Chỉ cần gõ `useAppSelector(state => state.)`, VS Code lập tự gợi ý chính xác tất cả các Slices sẵn có!
- **Dispatch Thunk An Toàn:** `useAppDispatch` nhận diện hoàn hảo các Async Thunk Promises.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   QUY TRÌNH ĐỊNH KIỂU REDUX TOOLKIT STORE               │
└────────────────────────────────────────────────────────────────────────┘

  [ configureStore ] ───> export type RootState = ReturnType<typeof store.getState>
                          export type AppDispatch = typeof store.dispatch
                                         │
                                         ▼
                 [ export const useAppDispatch = () => useDispatch<AppDispatch>() ]
                 [ export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector ]
```

---

## 2. Định Kiểu `createSlice` và `PayloadAction<T>`

Trong `createSlice`, mọi hàm reducer đều nhận 2 tham số: `(state, action: PayloadAction<T>)`:
- `PayloadAction<T>` được nhập từ `@reduxjs/toolkit`.
- `T` là kiểu dữ liệu chính xác của `action.payload`.

---

## 3. Định Kiểu `createAsyncThunk` Với `rejectValue`

Cú pháp Generics đầy đủ của `createAsyncThunk`:
`createAsyncThunk<ReturnedData, ThunkArg, { state: RootState, rejectValue: ErrorType }>`

---

## 💻 Syntax

### Store Typing Setup Blueprint
```typescript
import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: { auth: authReducer }
});

// Trích xuất RootState và AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Xuất ra Typed Hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## 📝 Example 1 - Định Kiểu Chuẩn Cho `courseSlice` Với `PayloadAction` Và `createAsyncThunk`

```typescript
// src/store/courseSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

export interface CourseItem {
  id: string;
  title: string;
  price: number;
}

export interface CourseState {
  items: CourseItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  items: [],
  isLoading: false,
  error: null
};

// 1. Async Thunk có định kiểu Generics đầy đủ: <ReturnedData, ThunkArg, ThunkApiConfig>
export const fetchCoursesThunk = createAsyncThunk<
  CourseItem[],
  { category: string },
  { state: RootState; rejectValue: string }
>(
  "courses/fetchByCategory",
  async ({ category }, { rejectWithValue }) => {
    try {
      const res = await fetch(`https://api.example.com/courses?cat=${category}`);
      if (!res.ok) return rejectWithValue("Không thể nạp danh sách khóa học");
      const data: CourseItem[] = await res.json();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Lỗi máy chủ");
    }
  }
);

// 2. Slice với định kiểu PayloadAction
const courseSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    addCourse: (state, action: PayloadAction<CourseItem>) => {
      state.items.push(action.payload);
    },
    removeCourse: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoursesThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCoursesThunk.fulfilled, (state, action: PayloadAction<CourseItem[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchCoursesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Lỗi không xác định";
      });
  }
});

export const { addCourse, removeCourse } = courseSlice.actions;
export default courseSlice.reducer;
```

---

## 📝 Example 2 - Định Kiểu RTK Query Service Endpoints (`builder.query<ResultType, QueryArg>`)

```typescript
// src/store/courseApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Course {
  id: string;
  title: string;
  price: number;
}

export interface CreateCourseDto {
  title: string;
  price: number;
}

export const courseApi = createApi({
  reducerPath: "courseApi",
  baseQuery: fetchBaseQuery({ baseUrl: "https://api.example.com/v1" }),
  tagTypes: ["Course"],
  endpoints: (builder) => ({
    // 💡 Generic 1: Kiểu trả về (Course[]), Generic 2: Tham số truyền vào (string)
    getCoursesByCategory: builder.query<Course[], string>({
      query: (category) => `courses?category=${category}`,
      providesTags: ["Course"]
    }),

    // 💡 Generic 1: Kiểu trả về (Course), Generic 2: Tham số truyền vào (CreateCourseDto)
    createCourse: builder.mutation<Course, CreateCourseDto>({
      query: (newCourse) => ({
        url: "courses",
        method: "POST",
        body: newCourse
      }),
      invalidatesTags: ["Course"]
    })
  })
});

export const { useGetCoursesByCategoryQuery, useCreateCourseMutation } = courseApi;
```

---

## 📝 Example 3 - Sử Dụng Typed Hooks Trong Component Với Full Autocompletion

```tsx
// src/components/CourseManager.tsx
import React from "react";
import { useAppDispatch, useAppSelector } from "../store/store";
import { fetchCoursesThunk, removeCourse } from "../store/courseSlice";

export function CourseManager() {
  // useAppDispatch tự động gợi ý các Async Thunk
  const dispatch = useAppDispatch();

  // useAppSelector tự động gợi ý tất cả các Slice: state.courses, state.auth
  const { items: courses, isLoading, error } = useAppSelector((state) => state.courses);

  const handleFetch = () => {
    dispatch(fetchCoursesThunk({ category: "frontend" }));
  };

  const handleRemove = (id: string) => {
    dispatch(removeCourse(id));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Quản Lý Khóa Học (Typed Redux)</h2>
        <button onClick={handleFetch} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium">
          Fetch API
        </button>
      </div>

      {isLoading && <p>⏳ Đang nạp dữ liệu...</p>}
      {error && <p className="text-red-500">❌ {error}</p>}

      <div className="space-y-2">
        {courses.map((course) => (
          <div key={course.id} className="p-3 border rounded-lg flex justify-between items-center">
            <span className="font-medium">{course.title}</span>
            <button onClick={() => handleRemove(course.id)} className="text-red-600 text-sm font-bold">
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

1. **Luôn Tạo File `store.ts` Xuất `useAppDispatch` và `useAppSelector`:** Không bao giờ import trực tiếp `useDispatch` và `useSelector` gốc từ `react-redux` ở các file UI Components. Hãy dùng cặp Typed Hooks đã được cấu hình tập trung.

---

## ❌ Common Mistakes

### Sai 1 - Import `useDispatch` gốc và gọi Async Thunk gây lỗi TypeScript
```typescript
// ❌ SAI: useDispatch() gốc không hiểu Async Thunks, báo lỗi Argument of type AsyncThunkAction...
const dispatch = useDispatch();
dispatch(fetchCoursesThunk()); 

// ✅ ĐÚNG CHUẨN: Sử dụng Typed Hook useAppDispatch
const dispatch = useAppDispatch();
dispatch(fetchCoursesThunk());
```

---

## 📚 Summary

- Trích xuất `RootState` từ `store.getState` và `AppDispatch` từ `store.dispatch`.
- Tạo cặp Typed Hooks **`useAppDispatch`** và **`useAppSelector`** tại `store.ts`.
- Định kiểu hàm Reducer bằng **`PayloadAction<T>`**.
- Định kiểu `builder.query<ResultType, QueryArg>` trong RTK Query.

---

## 📝 Quiz

### Question 1
Cú pháp TypeScript chuẩn nào được sử dụng để tự động trích xuất kiểu dữ liệu toàn cục `RootState` đại diện cho tất cả các Slices trong Redux Store?

A. `type RootState = typeof store.state;`  
B. `type RootState = ReturnType<typeof store.getState>;`  
C. `type RootState = store.RootState;`  
D. `type RootState = Express.State;`  

**Explanation:**  
`store.getState` là hàm trả về đối tượng State toàn cục của Redux Store. Toán tử `ReturnType<typeof store.getState>` tự động trích xuất kiểu trả về của hàm này thành kiểu `RootState`.

**Answer: B**

---

### Question 2
Trong RTK Query, hai tham số Generics truyền vào `builder.query<ResultType, QueryArg>` lần lượt đại diện cho những gì?

A. Generic 1 là kiểu lỗi, Generic 2 là kiểu dữ liệu  
B. Generic 1 là Kiểu dữ liệu kết quả trả về từ API (`ResultType`), Generic 2 là Kiểu tham số truyền vào hàm query (`QueryArg`)  
C. Generic 1 là string, Generic 2 là number  
D. Cả hai giống hệt nhau  

**Explanation:**  
Trong RTK Query `builder.query<ResultType, QueryArg>`, Generic thứ nhất đại diện cho kiểu dữ liệu response trả về từ Server, và Generic thứ hai đại diện cho kiểu dữ liệu của tham số truyền vào endpoint function.

**Answer: B**

---

### Question 3
Tại sao bạn nên dùng `useAppSelector` thay cho `useSelector` gốc của thư viện `react-redux` trong các file Component?

A. `useAppSelector` làm ứng dụng chạy nhanh hơn  
B. `useAppSelector` đã được đính kèm kiểu `RootState` toàn cục, cung cấp gợi ý IntelliSense 100% tên tất cả các Slices mà không cần ép kiểu thủ công ở từng file  
C. `useSelector` gốc bị xóa khỏi React  
D. Cả A và C  

**Explanation:**  
`useAppSelector` được định kiểu sẵn bằng `TypedUseSelectorHook<RootState>`. Nhờ đó, khi viết `useAppSelector(state => state.)`, VS Code lập tức gợi ý đầy đủ thuộc tính của Store mà bạn không cần phải gán `(state: RootState)` thủ công ở mỗi Component.

**Answer: B**
