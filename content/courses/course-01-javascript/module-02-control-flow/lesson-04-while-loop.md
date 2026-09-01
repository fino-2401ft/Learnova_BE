---
id: js-m2-l4
course: JavaScript Fundamentals
module: Control Flow
title: Vòng lặp while
order: 4
difficulty: Beginner
estimatedTime: 25
---

# Vòng lặp while

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Viết `while` và `do...while`.
- Biết khi nào `while` phù hợp hơn `for`.
- Tránh vòng lặp vô hạn.
- Nhận ra vòng lặp đồng bộ đang chặn event loop.

---

## 📖 Definition

`while` lặp **chừng nào điều kiện còn truthy**. Khác với `for`, nó không có sẵn ba phần khởi tạo / điều kiện / cập nhật — bạn tự lo.

`do...while` giống `while` nhưng kiểm tra điều kiện **sau** mỗi lần chạy, nên thân vòng lặp luôn chạy ít nhất một lần.

Khi nào chọn `while` thay vì `for`: **khi không biết trước số lần lặp**. Ví dụ đọc dữ liệu tới khi hết, thử lại tới khi thành công, hoặc phân trang tới khi không còn trang nào.

---

## ⚙️ Syntax

```javascript
while (điều_kiện) {
  // lặp khi còn truthy
}

do {
  // chạy ít nhất một lần
} while (điều_kiện);
```

### Example 1 - `while` cơ bản

```javascript
let i = 0;

while (i < 5) {
  console.log(i);
  i++; // QUÊN dòng này là lặp vô hạn
}
```

Với số lần lặp biết trước như thế này thì `for` gọn hơn, vì cả ba phần nằm trên cùng một dòng và khó quên.

### Example 2 - `do...while` chạy ít nhất một lần

```javascript
let input;

do {
  input = prompt('Nhập số từ 1 đến 10:');
} while (Number(input) < 1 || Number(input) > 10);
```

Phải hỏi ít nhất một lần rồi mới kiểm tra được — đúng lúc `do...while` phát huy tác dụng.

```javascript
// Khác biệt khi điều kiện sai ngay từ đầu
let n = 10;

while (n < 5) console.log('while');     // không in gì
do { console.log('do'); } while (n < 5); // in 'do' một lần
```

### Example 3 - Không biết trước số lần lặp

```javascript
/** Lấy toàn bộ dữ liệu qua API phân trang, không biết trước có bao nhiêu trang. */
async function fetchAll(url) {
  const items = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`${url}?page=${page}&limit=100`);
    const { data, meta } = await res.json();

    items.push(...data);

    hasMore = page < meta.totalPages;
    page += 1;
  }

  return items;
}
```

### Example 4 - Thử lại với thời gian chờ tăng dần

```javascript
async function fetchWithRetry(url, maxAttempts = 3) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;

    try {
      return await fetch(url);
    } catch (error) {
      // Hết lượt thử thì ném lỗi ra ngoài, không nuốt.
      if (attempt >= maxAttempts) throw error;

      // Chờ lâu dần: 200ms, 400ms, 800ms — tránh dồn dập vào server đang quá tải.
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 100));
    }
  }
}
```

### Example 5 - Vòng lặp vô hạn có chủ ý kèm điều kiện thoát

```javascript
let cursor = null;

while (true) {
  const { items, nextCursor } = await fetchPage(cursor);

  process(items);

  if (!nextCursor) break; // điều kiện thoát nằm giữa thân vòng lặp
  cursor = nextCursor;
}
```

`while (true)` chấp nhận được khi điều kiện thoát nằm ở giữa thân vòng lặp — viết bằng `while (điều_kiện)` sẽ phải lặp lại một đoạn code trước vòng lặp.

---

## 📌 Notes

- **Mọi `while` đều phải có thứ gì đó làm điều kiện tiến tới sai.** Thiếu là treo.
- **`while (true)` phải có `break` hoặc `return`** ở một nhánh chắc chắn tới được.
- **Vòng lặp đồng bộ chặn event loop.** Trong Node.js, một `while` chạy lâu làm cả server đứng im — không request nào được xử lý.
- Nên đặt trần số vòng lặp cho những vòng phụ thuộc dữ liệu bên ngoài, phòng khi API trả về sai.

---

## 🌍 Real World Example

```javascript
/**
 * Dọn phiên đăng nhập hết hạn theo từng lô.
 *
 * Không xoá một phát toàn bộ: một câu DELETE trên hàng trăm nghìn dòng sẽ khoá
 * bảng khá lâu và làm nghẽn mọi request đang đăng nhập.
 */
async function cleanupExpiredSessions(prisma) {
  const BATCH_SIZE = 1000;
  const MAX_BATCHES = 100; // trần an toàn: đề phòng điều kiện xoá viết sai

  let deleted = 0;
  let batches = 0;

  while (batches < MAX_BATCHES) {
    const expired = await prisma.session.findMany({
      where: { expiresAt: { lt: new Date() } },
      select: { sessionId: true },
      take: BATCH_SIZE,
    });

    if (expired.length === 0) break; // hết việc

    await prisma.session.deleteMany({
      where: { sessionId: { in: expired.map((s) => s.sessionId) } },
    });

    deleted += expired.length;
    batches += 1;

    // Nhường event loop giữa các lô để request khác được phục vụ.
    await new Promise((resolve) => setImmediate(resolve));
  }

  return { deleted, batches };
}
```

Hai chi tiết đáng chú ý: `MAX_BATCHES` là dây bảo hiểm — nếu điều kiện `expiresAt` viết sai và luôn tìm thấy bản ghi, vòng lặp vẫn dừng thay vì chạy mãi. Và `setImmediate` nhường quyền cho event loop, để công việc nền không làm server ngừng phản hồi.

---

## ⚠️ Common Mistakes

**Sai 1 — Quên cập nhật biến điều kiện**

```javascript
let i = 0;
while (i < 5) {
  console.log(i); // treo vĩnh viễn
}
```

**Sai 2 — Sửa biến điều kiện bên trong nhánh `if`**

```javascript
while (i < 10) {
  if (dieuKien) i++;  // nhánh còn lại không tăng -> có thể treo
}
```

**Sai 3 — Vòng lặp đồng bộ nặng trong Node.js**

```javascript
// Server đứng im suốt thời gian này
while (Date.now() - start < 5000) { }
```

**Sai 4 — `while (true)` mà không có lối thoát chắc chắn**

Điều kiện `break` nằm trong nhánh có thể không bao giờ tới được.

**Sai 5 — Không đặt trần cho vòng lặp phụ thuộc API**

API trả sai `totalPages` là vòng lặp chạy tới vô tận.

---

## 📋 Summary

- `while` lặp chừng nào điều kiện còn truthy; `do...while` chạy trước rồi mới kiểm tra nên luôn chạy ít nhất một lần.
- Chọn `while` khi không biết trước số lần lặp: phân trang, thử lại, đọc tới khi hết dữ liệu.
- Mọi vòng lặp phải có thứ khiến điều kiện tiến tới sai; `while (true)` phải có `break` chắc chắn tới được.
- Vòng lặp đồng bộ chạy lâu sẽ chặn event loop và làm cả server Node ngừng phản hồi.
- Vòng lặp phụ thuộc dữ liệu bên ngoài nên có trần số vòng làm dây bảo hiểm.

---

## 📝 Quiz

### Question 1

Đoạn code sau in ra gì?

```javascript
let n = 10;
while (n < 5) console.log('A');
do { console.log('B'); } while (n < 5);
```

A. `A` rồi `B`

B. Chỉ `A`

C. Chỉ `B` — `while` kiểm tra trước nên không chạy lần nào, còn `do...while` chạy thân rồi mới kiểm tra.

D. Không in gì cả.

**Answer: C**

**Giải thích:** `n` bằng 10 nên điều kiện `n < 5` sai ngay từ đầu. `while` kiểm tra trước khi chạy nên bỏ qua hoàn toàn. `do...while` chạy thân vòng lặp trước rồi mới kiểm tra, nên luôn chạy ít nhất một lần bất kể điều kiện.

---

### Question 2

Vì sao vòng lặp dọn dữ liệu theo lô nên có hằng `MAX_BATCHES` dù đã có `break` khi hết bản ghi?

A. Để giới hạn bộ nhớ mà vòng lặp sử dụng.

B. Vì `break` không hoạt động trong vòng lặp bất đồng bộ.

C. Vì nó là dây bảo hiểm: nếu điều kiện lọc viết sai và truy vấn luôn trả về bản ghi, vòng lặp vẫn dừng thay vì chạy mãi.

D. Vì Prisma giới hạn số lần truy vấn trong một hàm.

**Answer: C**

**Giải thích:** `break` chỉ hoạt động khi giả định "sẽ có lúc hết bản ghi" là đúng. Nếu điều kiện xoá viết sai — chẳng hạn xoá theo một trường không bao giờ thay đổi — thì truy vấn luôn trả về đủ 1000 dòng và vòng lặp không bao giờ thoát. Trần số vòng biến một lỗi treo vô hạn thành một lỗi dừng sớm và ghi được vào log.
