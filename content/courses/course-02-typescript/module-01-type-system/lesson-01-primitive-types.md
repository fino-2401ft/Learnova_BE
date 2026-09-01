---
id: ts-m1-l1
course: TypeScript
module: Type System
title: Primitive Types
order: 1
difficulty: Beginner
estimatedTime: 25
---

# Primitive Types

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

* Hiểu TypeScript là gì và Type System giải quyết vấn đề gì.
* Khai báo biến với các Primitive Types phổ biến.
* Phân biệt Type Annotation và Type Inference.
* Hiểu sự khác nhau giữa `any` và `unknown`.

---

## 📖 Definition

TypeScript là một **superset của JavaScript**, nghĩa là mã JavaScript hợp lệ về cú pháp có thể được sử dụng trong TypeScript. Điểm khác biệt quan trọng là TypeScript bổ sung **Type System**, cho phép mô tả kiểu dữ liệu và phát hiện nhiều lỗi ngay trong quá trình kiểm tra code.

Type System giúp phát hiện lỗi kiểu dữ liệu trước khi chương trình chạy, đồng thời hỗ trợ IDE cung cấp gợi ý và giúp code dễ bảo trì hơn. Ví dụ, trong JavaScript, biến có thể thay đổi kiểu trong quá trình chạy:

```javascript
let age = 20;

age = "Twenty";
```

Trong TypeScript, nếu biến được khai báo là `number`, việc gán một `string` sẽ bị phát hiện:

```typescript
let age: number = 20;

age = "Twenty";
```

TypeScript sẽ báo lỗi:

```text
Type 'string' is not assignable to type 'number'.
```

Điều này giúp phát hiện vấn đề sớm thay vì chờ đến Runtime.

---

## ⚙️ Syntax

### Variable Declaration

Cú pháp khai báo biến với Type Annotation:

```typescript
let variableName: type = value;
```

Ví dụ:

```typescript
let age: number = 20;
```

### Type Inference

TypeScript có thể tự suy luận kiểu dữ liệu từ giá trị ban đầu:

```typescript
let age = 20;
```

Trong trường hợp này, TypeScript suy luận:

```text
age → number
```

Không phải lúc nào cũng cần viết Type Annotation nếu TypeScript có thể suy luận kiểu một cách rõ ràng.

### Example 1 - Primitive Types

```typescript
let name: string = "John";

let age: number = 20;

let isStudent: boolean = true;

console.log(name);
console.log(age);
console.log(isStudent);
```

Output:

```text
John
20
true
```

Ba Primitive Types thường gặp nhất trong các ví dụ cơ bản là:

* `string`: chuỗi ký tự.
* `number`: số.
* `boolean`: giá trị đúng hoặc sai.

### Example 2 - Type Inference

```typescript
let score = 95;

let language = "TypeScript";

console.log(score);
console.log(language);
```

Output:

```text
95
TypeScript
```

TypeScript tự suy luận:

```text
score    → number
language → string
```

Đây được gọi là **Type Inference**.

### Example 3 - any và unknown

`any` cho phép một biến nhận nhiều kiểu dữ liệu khác nhau:

```typescript
let value: any = 100;

value = "Hello";

value = true;

console.log(value);
```

Output:

```text
true
```

Với `unknown`, TypeScript yêu cầu kiểm tra kiểu trước khi thực hiện các thao tác phụ thuộc vào kiểu dữ liệu:

```typescript
let data: unknown = "TypeScript";

if (typeof data === "string") {
  console.log(data.toUpperCase());
}
```

Output:

```text
TYPESCRIPT
```

`any` linh hoạt nhưng làm mất phần lớn lợi ích của Type System. `unknown` an toàn hơn vì giá trị phải được kiểm tra trước khi sử dụng.

---

## 📌 Notes

* **Primitive Types** gồm các kiểu cơ bản như `string`, `number`, `boolean`, `bigint`, `symbol`, `null` và `undefined`.

* **Type Annotation** là cách chủ động chỉ định kiểu dữ liệu cho biến.

  ```typescript
  let username: string = "Alice";
  ```

* **Type Inference** cho phép TypeScript tự suy luận kiểu dữ liệu từ giá trị.

  ```typescript
  let price = 100;
  ```

  Trong trường hợp này, không cần viết:

  ```typescript
  let price: number = 100;
  ```

* **`any`** có thể nhận giá trị thuộc nhiều kiểu khác nhau nhưng làm giảm khả năng kiểm tra kiểu của TypeScript. Vì vậy nên hạn chế sử dụng khi không thực sự cần thiết.

* **`unknown`** an toàn hơn `any`. Khi một giá trị có kiểu `unknown`, cần kiểm tra hoặc thu hẹp kiểu trước khi thực hiện thao tác cụ thể.

---

## 🌍 Real World Example

Trong một ứng dụng, thông tin người dùng có thể được mô tả bằng các Primitive Types:

```typescript
const username: string = "Alice";
const age: number = 20;
const isStudent: boolean = true;

console.log(`Username: ${username}`);
console.log(`Age: ${age}`);
console.log(`Student: ${isStudent}`);
```

Output:

```text
Username: Alice
Age: 20
Student: true
```

Việc khai báo kiểu giúp thể hiện rõ dữ liệu mà biến được phép lưu trữ. Nếu vô tình gán một giá trị không đúng kiểu, TypeScript có thể phát hiện lỗi trước khi chương trình chạy.

Trong trường hợp dữ liệu đến từ nguồn mà kiểu chưa được xác định, chẳng hạn dữ liệu bên ngoài chương trình, `unknown` phù hợp hơn `any` vì buộc code phải kiểm tra kiểu trước khi sử dụng.

---

## ⚠️ Common Mistakes

**Sai 1 — Gán sai kiểu dữ liệu**

```typescript
// SAI
let age: number = "20";
```

TypeScript sẽ báo lỗi:

```text
Type 'string' is not assignable to type 'number'.
```

```typescript
// ĐÚNG
let age: number = 20;
```

Biến `age` được khai báo là `number`, vì vậy giá trị gán cho nó phải phù hợp với kiểu này.

**Sai 2 — Lạm dụng `any`**

```typescript
// SAI
let data: any;

data = 100;
data = false;
data = {};
```

`any` cho phép thay đổi kiểu tùy ý và làm giảm khả năng kiểm tra lỗi của TypeScript.

```typescript
// ĐÚNG
let data: unknown = getData();

if (typeof data === "string") {
  console.log(data.toUpperCase());
}
```

Khi chưa biết chính xác kiểu dữ liệu, `unknown` giúp code an toàn hơn.

**Sai 3 — Sử dụng `unknown` như `any`**

```typescript
// SAI
let value: unknown = "Hello";

console.log(value.toUpperCase());
```

`unknown` không cho phép gọi trực tiếp phương thức phụ thuộc vào kiểu dữ liệu.

```typescript
// ĐÚNG
let value: unknown = "Hello";

if (typeof value === "string") {
  console.log(value.toUpperCase());
}
```

Cần kiểm tra kiểu trước khi sử dụng giá trị.

**Sai 4 — Khai báo kiểu không cần thiết**

```typescript
// SAI — không sai về cú pháp, nhưng dư thừa trong trường hợp đơn giản
let score: number = 100;
```

Có thể để TypeScript tự suy luận:

```typescript
// ĐÚNG
let score = 100;
```

TypeScript có thể suy luận `score` là `number` từ giá trị `100`.

---

## 📋 Summary

* TypeScript bổ sung **Type System** cho JavaScript để hỗ trợ kiểm tra kiểu và phát hiện lỗi sớm.
* Các Primitive Types cơ bản gồm `string`, `number`, `boolean`, `bigint`, `symbol`, `null` và `undefined`.
* **Type Annotation** dùng để chủ động chỉ định kiểu dữ liệu.
* **Type Inference** cho phép TypeScript tự suy luận kiểu dữ liệu khi có đủ thông tin.
* `any` linh hoạt nhưng làm giảm khả năng kiểm tra kiểu, trong khi `unknown` an toàn hơn vì yêu cầu kiểm tra kiểu trước khi sử dụng.

---

## 📝 Quiz

### Question 1

Đoạn code nào thể hiện **Type Inference**?

A.

```typescript
let age: number = 20;
```

B.

```typescript
let age = 20;
```

C.

```typescript
number age = 20;
```

D.

```typescript
let age: any = 20;
```

**Answer: B**

**Giải thích:** Ở phương án B, TypeScript tự suy luận `age` có kiểu `number` từ giá trị `20`, nên đây là Type Inference. Phương án A sử dụng Type Annotation vì kiểu `number` được chỉ định rõ ràng.

---

### Question 2

Tại sao `unknown` thường an toàn hơn `any`?

A. `unknown` chỉ có thể chứa giá trị kiểu `string`.

B. `unknown` không thể chứa giá trị kiểu `number`.

C. `unknown` yêu cầu kiểm tra kiểu trước khi thực hiện các thao tác phụ thuộc vào kiểu dữ liệu.

D. `unknown` tự động chuyển mọi giá trị thành `string`.

**Answer: C**

**Giải thích:** `unknown` có thể chứa giá trị thuộc nhiều kiểu, nhưng TypeScript không cho phép sử dụng giá trị đó một cách tùy ý trước khi kiểu được kiểm tra. Điều này giúp tránh nhiều lỗi mà `any` có thể che giấu.
