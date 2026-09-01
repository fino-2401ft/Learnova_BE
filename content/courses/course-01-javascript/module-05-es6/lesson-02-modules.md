---
id: js-m5-l2
course: JavaScript Fundamentals
module: ES6+
title: Module ES
order: 2
difficulty: Beginner
estimatedTime: 30
---

# Module ES

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Chia code thành module bằng `import` và `export`.
- Phân biệt named export và default export.
- Hiểu khác biệt giữa ES Module và CommonJS.
- Dùng dynamic import để tải module khi cần.

---

## 📖 Definition

**Module** là một file có phạm vi riêng: mọi biến khai trong đó chỉ file đó thấy, trừ khi được `export`.

JavaScript có hai hệ module đang cùng tồn tại:

| | ES Module (ESM) | CommonJS (CJS) |
|---|---|---|
| Cú pháp | `import` / `export` | `require` / `module.exports` |
| Nạp | Tĩnh, phân tích được lúc biên dịch | Động, chạy tới đâu nạp tới đó |
| Chế độ | Luôn strict | Không strict mặc định |
| Nơi dùng | Chuẩn của ngôn ngữ, trình duyệt + Node | Node truyền thống |

ESM là chuẩn chính thức và nên dùng cho code mới. CommonJS vẫn còn rất nhiều trong hệ sinh thái Node cũ.

---

## ⚙️ Syntax

```javascript
// Named export
export const PI = 3.14;
export function cong(a, b) { return a + b; }

// Default export — tối đa một cái mỗi file
export default class Calculator {}

// Import
import Calculator, { PI, cong } from './math.js';
import { cong as add } from './math.js';   // đổi tên
import * as math from './math.js';         // gom tất cả
import './styles.css';                     // chỉ chạy, không lấy gì
```

### Example 1 - Named export

```javascript
// utils/format.js
export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('vi-VN').format(date);
}

// Hoặc gom cuối file
const MAX = 100;
const MIN = 1;
export { MAX, MIN };
```

```javascript
// app.js
import { formatCurrency, formatDate } from './utils/format.js';
```

Named export có một lợi thế quan trọng: **tên phải khớp**, nên gõ sai là lỗi ngay thay vì nhận `undefined`.

### Example 2 - Default export

```javascript
// services/CourseService.js
export default class CourseService {
  list() {}
}

// Import — tên do người dùng tự đặt
import CourseService from './services/CourseService.js';
import BatCuTen from './services/CourseService.js'; // vẫn chạy
```

Vì tên tự đặt được, cùng một thứ có thể mang mười tên khác nhau trong mười file. Nhiều nhóm chọn **chỉ dùng named export** để tránh chuyện đó.

### Example 3 - Kết hợp và re-export

```javascript
// math.js
export const PI = 3.14;
export default function cong(a, b) { return a + b; }

// app.js
import cong, { PI } from './math.js';
```

```javascript
// index.js — gom nhiều module thành một cửa
export { formatCurrency, formatDate } from './format.js';
export { validateEmail } from './validate.js';
export { default as CourseService } from './CourseService.js';

// Người dùng chỉ cần một dòng import
import { formatCurrency, CourseService } from './utils/index.js';
```

### Example 4 - Dynamic import

`import` thường phải nằm ở cấp cao nhất. Cần nạp theo điều kiện thì dùng `import()` — nó trả về một Promise:

```javascript
// Chỉ nạp thư viện nặng khi thật sự cần
async function exportPdf(data) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // ...
}

// Nạp theo điều kiện
const locale = navigator.language.startsWith('vi') ? 'vi' : 'en';
const messages = await import(`./locales/${locale}.js`);
```

Dynamic import là cách chia nhỏ bundle: trình duyệt chỉ tải phần code khi người dùng chạm tới tính năng đó.

### Example 5 - ESM và CommonJS trong Node

```javascript
// CommonJS
const express = require('express');
module.exports = { cong };

// ESM
import express from 'express';
export { cong };
```

Bật ESM trong Node bằng một trong hai cách:

```json
// package.json
{ "type": "module" }
```

hoặc đặt tên file là `.mjs`.

Vài khác biệt cần nhớ khi chuyển sang ESM:

```javascript
// __dirname và __filename KHÔNG tồn tại trong ESM
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Đường dẫn tương đối phải ghi rõ đuôi file
import { cong } from './math.js'; // KHÔNG bỏ được '.js'
```

---

## 📌 Notes

- **Module chỉ chạy một lần** dù được import ở bao nhiêu nơi; kết quả được nhớ lại.
- **Module luôn ở chế độ strict**, không cần `'use strict'`.
- **`import` được hoisting**, nên đặt ở đâu trong file cũng chạy trước — nhưng vẫn nên để đầu file.
- **ESM import là liên kết sống**: giá trị export thay đổi thì bên import thấy giá trị mới. CommonJS thì sao chép lúc `require`.
- Import vòng tròn giữa hai module là mùi của thiết kế sai, nên tách phần dùng chung ra file thứ ba.

---

## 🌍 Real World Example

```javascript
// prisma/import/markdown.js — module thuần, không phụ thuộc database
export function parseFrontmatter(raw) { }
export function splitBody(body) { }
export function parseQuiz(quizMd) { }
```

```javascript
// prisma/import/courses.js — dùng module trên, thêm phần ghi database
import { PrismaClient } from '@prisma/client';
import { parseFrontmatter, splitBody } from './markdown.js';

// Hằng nội bộ: không export nên không file nào khác chạm được.
const CATALOG = [ /* ... */ ];

export async function importCourses(prisma, options) { }
```

Cách chia này cho phép test `markdown.js` mà không cần database — đúng tinh thần "module chỉ export thứ bên ngoài thật sự cần".

```javascript
// Dynamic import: chỉ nạp trình sinh PDF khi người dùng bấm xuất báo cáo
button.addEventListener('click', async () => {
  button.disabled = true;

  try {
    const { generateReport } = await import('./reports/pdf.js');
    await generateReport(data);
  } finally {
    button.disabled = false;
  }
});
```

Thư viện PDF thường nặng vài trăm KB. Đưa nó vào bundle chính nghĩa là mọi người dùng đều tải, kể cả người không bao giờ xuất báo cáo.

---

## ⚠️ Common Mistakes

**Sai 1 — Quên đuôi `.js` trong ESM của Node**

```javascript
import { cong } from './math';    // ERR_MODULE_NOT_FOUND
import { cong } from './math.js'; // đúng
```

**Sai 2 — Trộn `require` và `import` trong cùng file**

Chọn một hệ và giữ nhất quán trong toàn dự án.

**Sai 3 — Dùng `__dirname` trong ESM**

Không tồn tại; phải dựng lại từ `import.meta.url`.

**Sai 4 — Nhiều default export trong một file**

Chỉ được một.

**Sai 5 — Import vòng tròn**

```javascript
// a.js import b.js, b.js import a.js
// Một trong hai sẽ nhận undefined tại thời điểm nạp
```

Tách phần dùng chung ra file thứ ba.

---

## 📋 Summary

- Mỗi file module có phạm vi riêng; chỉ thứ được `export` mới ra ngoài được.
- Named export bắt tên phải khớp nên gõ sai là lỗi ngay; default export cho tự đặt tên nên dễ mất nhất quán.
- ESM là chuẩn của ngôn ngữ; CommonJS là hệ cũ của Node, dùng `require`/`module.exports`.
- Trong ESM của Node: phải ghi đuôi `.js`, và `__dirname` phải dựng lại từ `import.meta.url`.
- `import()` động trả về Promise — dùng để tải theo điều kiện và chia nhỏ bundle.

---

## 📝 Quiz

### Question 1

Trong ES Module chạy trên Node, `import { cong } from './math'` bị lỗi. Vì sao?

A. Vì `cong` phải là default export.

B. Vì ESM yêu cầu ghi rõ đuôi file: phải viết `'./math.js'`.

C. Vì đường dẫn tương đối không dùng được trong ESM.

D. Vì thiếu `"type": "module"` trong `package.json`.

**Answer: B**

**Giải thích:** CommonJS tự thử thêm `.js`, `.json`, `/index.js` khi phân giải đường dẫn. ESM thì không — nó theo đúng chuẩn phân giải URL nên đường dẫn phải đầy đủ. Đây là khác biệt hay làm người mới chuyển từ `require` sang `import` vấp phải.

---

### Question 2

Vì sao nhiều nhóm chọn chỉ dùng named export thay vì default export?

A. Vì default export chạy chậm hơn.

B. Vì với default export, người import tự đặt tên tuỳ ý nên cùng một thứ có thể mang nhiều tên khác nhau ở nhiều file, và gõ sai tên khi import named thì lỗi hiện ra ngay.

C. Vì default export không hoạt động trong trình duyệt.

D. Vì một file chỉ được có tối đa một named export.

**Answer: B**

**Giải thích:** Named export buộc tên phải khớp với tên đã export, nên IDE tự động hoàn thành được và gõ sai là lỗi ngay lúc nạp module. Default export cho tự do đặt tên, dẫn tới cùng một service xuất hiện dưới ba bốn cái tên khác nhau trong dự án, và việc tìm kiếm theo tên trở nên không đáng tin.
