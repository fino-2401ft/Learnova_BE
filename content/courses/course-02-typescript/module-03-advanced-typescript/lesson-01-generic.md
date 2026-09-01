---
id: ts-m3-l1
course: TypeScript
module: Advanced TypeScript
title: Generic
order: 1
difficulty: Intermediate
estimatedTime: 40
---
# Generic

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Generic là gì.
- Khai báo Generic Function.
- Khai báo Generic Class.
- Khai báo Generic Interface.
- Biết khi nào nên sử dụng Generic.

---

## 📖 Definition

Trong lập trình, đôi khi chúng ta muốn một hàm hoặc một Class có thể làm việc với **nhiều kiểu dữ liệu khác nhau**.

Ví dụ:

- number
- string
- boolean
- object

Nếu không dùng Generic, chúng ta phải viết nhiều hàm giống nhau.

Ví dụ:

```typescript
function printNumber(value: number) {
    return value;
}

function printString(value: string) {
    return value;
}
```

Hai hàm trên chỉ khác kiểu dữ liệu.

TypeScript cung cấp **Generic** để viết một lần nhưng sử dụng được cho nhiều kiểu dữ liệu.

Generic giúp:

- Tái sử dụng code.
- Giữ được Type Safety.
- Giảm trùng lặp mã nguồn.

---

## 💻 Syntax

### Generic Function

```typescript
function functionName<T>(value: T): T {

    return value;

}
```

---

### Generic Class

```typescript
class Box<T> {

}
```

---

### Generic Interface

```typescript
interface ApiResponse<T> {

}
```

---

## 📝 Example 1 - Generic Function

```typescript
function identity<T>(value: T): T {

    return value;

}

console.log(identity(100));

console.log(identity("TypeScript"));
```

Output

```text
100
TypeScript
```

### Giải thích

`T` là kiểu dữ liệu tổng quát.

TypeScript sẽ tự suy luận:

```text
identity<number>(100)

identity<string>("TypeScript")
```

---

## 📝 Example 2 - Generic Class

```typescript
class Box<T> {

    constructor(

        public value: T

    ) {}

}

const numberBox = new Box<number>(100);

const stringBox = new Box<string>("Hello");

console.log(numberBox.value);

console.log(stringBox.value);
```

Output

```text
100
Hello
```

### Giải thích

Class `Box` có thể lưu bất kỳ kiểu dữ liệu nào.

---

## 📝 Example 3 - Generic Interface

```typescript
interface ApiResponse<T> {

    success: boolean;

    data: T;

}

const response: ApiResponse<string> = {

    success: true,

    data: "Login Success"

};

console.log(response);
```

Output

```text
{
  success: true,
  data: 'Login Success'
}
```

### Giải thích

`data` có thể là:

- string
- number
- object
- array

tùy theo Generic Type.

---

## ⚠️ Notes

### 1. Generic Type

```typescript
<T>
```

`T` là tên phổ biến nhất.

Ngoài ra có thể dùng:

```typescript
<K>

<V>

<E>
```

---

### 2. Multiple Generic Types

```typescript
function pair<T, U>(

    first: T,

    second: U

) {

    return [first, second];

}
```

Ví dụ

```typescript
pair(1, "A");
```

Output

```text
[1, 'A']
```

---

### 3. Generic Array

```typescript
const numbers: Array<number> = [

    1,

    2,

    3

];
```

Đây là cách viết Generic của mảng.

---

### 4. Generic Constraint

Có thể giới hạn Generic.

```typescript
function printLength<T extends {

    length: number

}>(value: T) {

    console.log(value.length);

}
```

Ví dụ

```typescript
printLength("TypeScript");

printLength([1,2,3]);
```

Output

```text
10
3
```

---

### 5. Ứng dụng thực tế

Generic được sử dụng rất nhiều trong:

- Promise<T>
- Array<T>
- Map<K,V>
- Set<T>
- Axios Response<T>
- Repository<T> trong NestJS

---

## 🌍 Real World Example

```typescript
interface ApiResponse<T> {

    success: boolean;

    data: T;

}

interface User {

    id: number;

    name: string;

}

const response: ApiResponse<User> = {

    success: true,

    data: {

        id: 1,

        name: "Alice"

    }

};

console.log(response.data.name);
```

Output

```text
Alice
```

Trong các REST API, dữ liệu trả về thường được mô tả bằng Generic để có thể tái sử dụng cho nhiều loại dữ liệu khác nhau.

---

## ❌ Common Mistakes

### Sai 1 - Dùng any thay Generic

Sai

```typescript
function identity(value: any) {

    return value;

}
```

Đúng

```typescript
function identity<T>(value: T): T {

    return value;

}
```

---

### Sai 2 - Khai báo Generic nhưng không sử dụng

Sai

```typescript
function test<T>(value: number) {

}
```

Nếu không dùng `T` thì không cần Generic.

---

### Sai 3 - Truy cập thuộc tính không tồn tại

Sai

```typescript
function print<T>(value: T) {

    console.log(value.length);

}
```

Output

```text
Property 'length' does not exist.
```

Đúng

```typescript
function print<T extends {

    length: number

}>(value: T) {

    console.log(value.length);

}
```

---

### Sai 4 - Nhầm Generic với Any

`any`

- Mất kiểm tra kiểu dữ liệu.

`Generic`

- Giữ nguyên kiểu dữ liệu ban đầu.
- Type Safety tốt hơn.

---

## 📚 Summary

- Generic giúp viết code dùng được với nhiều kiểu dữ liệu.
- Generic Function nhận và trả về đúng kiểu dữ liệu truyền vào.
- Generic có thể áp dụng cho Function, Class và Interface.
- Generic Constraint giúp giới hạn kiểu dữ liệu.
- Generic được sử dụng rộng rãi trong các thư viện và framework như React, NestJS và Axios.

---

## 📝 Quiz

### Question 1

Ký hiệu nào dùng để khai báo Generic?

A.

```typescript
()
```

B.

```typescript
{}
```

C.

```typescript
<>
```

D.

```typescript
[]
```

**Answer: C**

**Giải thích:** Cặp `<>` khai báo tham số kiểu, đặt ngay sau tên hàm hoặc tên class. Nó là **tham số của kiểu**, giống cách `()` là tham số của giá trị.

---

### Question 2

Đâu là khai báo Generic Function đúng?

A.

```typescript
function print(value: any)
```

B.

```typescript
function print<T>(value: T): T
```

C.

```typescript
function<T> print(value)
```

D.

```typescript
function print(value<T>)
```

**Answer: B**

**Giải thích:** Tham số kiểu `<T>` phải đứng ngay sau tên hàm, trước danh sách tham số. Phương án A dùng `any` nên mất hẳn thông tin kiểu ở đầu ra; C và D đặt sai vị trí. Khác biệt thực tế giữa A và B: với B, gọi `print("abc")` cho kết quả kiểu `string`, còn với A thì kết quả là `any` và mọi kiểm tra phía sau đều vô hiệu.
