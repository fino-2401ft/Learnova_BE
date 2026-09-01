---
id: node-m3-l2
course: Node.js
module: Asynchronous Programming
title: Promise
order: 2
difficulty: Beginner
estimatedTime: 45
---
# Promise

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Promise là gì.
- Biết ba trạng thái của Promise.
- Tạo và sử dụng Promise.
- Xử lý thành công và lỗi bằng `then()`, `catch()`.
- Hiểu `finally()`.
- Biết ưu điểm của Promise so với Callback.

---

## 📖 Definition

**Promise** là một đối tượng (Object) đại diện cho kết quả của một tác vụ bất đồng bộ.

Thay vì sử dụng nhiều Callback lồng nhau, Promise giúp mã nguồn:

- Dễ đọc.
- Dễ bảo trì.
- Dễ xử lý lỗi.
- Hạn chế Callback Hell.

Một Promise chỉ có thể chuyển trạng thái một lần.

---

## 💻 Syntax

### Tạo Promise

```javascript
const promise = new Promise((resolve, reject) => {

    const success = true;

    if (success) {

        resolve("Success");

    } else {

        reject("Failed");

    }

});
```

---

### Sử dụng Promise

```javascript
promise
    .then(result => {

        console.log(result);

    })
    .catch(error => {

        console.log(error);

    });
```

---

## 📝 Example 1 - Promise thành công

```javascript
const promise = new Promise((resolve, reject) => {

    resolve("Data loaded");

});

promise.then(result => {

    console.log(result);

});
```

Output

```text
Data loaded
```

### Giải thích

`resolve()` đánh dấu Promise hoàn thành thành công.

Giá trị được truyền tới `then()`.

---

## 📝 Example 2 - Promise thất bại

```javascript
const promise = new Promise((resolve, reject) => {

    reject("Cannot connect");

});

promise
    .then(result => {

        console.log(result);

    })
    .catch(error => {

        console.log(error);

    });
```

Output

```text
Cannot connect
```

### Giải thích

Nếu Promise thất bại, `catch()` sẽ nhận lỗi từ `reject()`.

---

## 📝 Example 3 - Promise với setTimeout()

```javascript
function wait() {

    return new Promise((resolve) => {

        setTimeout(() => {

            resolve("Finished");

        }, 2000);

    });

}

wait().then(result => {

    console.log(result);

});
```

Output

```text
Finished
```

### Giải thích

Promise thường được sử dụng để bao bọc các tác vụ bất đồng bộ như:

- Đọc file.
- Gửi HTTP Request.
- Truy vấn Database.

---

## ⚠️ Notes

### 1. Ba trạng thái của Promise

```text
Pending
```

Promise đang thực hiện.

↓

```text
Fulfilled
```

Hoàn thành thành công.

↓

```text
Rejected
```

Hoàn thành nhưng xảy ra lỗi.

---

### 2. then()

```javascript
promise.then(result => {

});
```

Được gọi khi Promise thành công.

---

### 3. catch()

```javascript
promise.catch(error => {

});
```

Được gọi khi Promise thất bại.

---

### 4. finally()

```javascript
promise.finally(() => {

    console.log("Done");

});
```

Luôn được thực thi dù Promise thành công hay thất bại.

---

### 5. Promise Chain

Có thể nối nhiều Promise liên tiếp.

```javascript
promise
    .then(result => {

        return result + " 1";

    })
    .then(result => {

        console.log(result);

    });
```

Điều này giúp tránh Callback Hell.

---

## 🌍 Real World Example

Giả sử đọc dữ liệu từ cơ sở dữ liệu.

```javascript
function getUser() {

    return new Promise((resolve) => {

        setTimeout(() => {

            resolve({
                id: 1,
                name: "Alice"
            });

        }, 1000);

    });

}

getUser()
    .then(user => {

        console.log(user);

    })
    .catch(error => {

        console.log(error);

    });
```

Output

```text
{
    id: 1,
    name: "Alice"
}
```

Trong thực tế, nhiều thư viện Node.js hiện đại trả về Promise thay vì Callback.

---

## ❌ Common Mistakes

### Sai 1 - Không xử lý lỗi

Sai

```javascript
promise.then(result => {

    console.log(result);

});
```

Nếu Promise bị lỗi, chương trình sẽ không xử lý được.

Đúng

```javascript
promise
    .then(result => {

        console.log(result);

    })
    .catch(error => {

        console.log(error);

    });
```

---

### Sai 2 - Gọi resolve() nhiều lần

Sai

```javascript
resolve("A");

resolve("B");
```

Chỉ lần gọi đầu tiên có hiệu lực.

---

### Sai 3 - Gọi cả resolve() và reject()

Sai

```javascript
resolve("Success");

reject("Error");
```

Promise chỉ có thể hoàn thành một lần.

---

### Sai 4 - Callback Hell với Promise

Sai

```javascript
promise.then(() => {

    anotherPromise.then(() => {

        thirdPromise.then(() => {

        });

    });

});
```

Đúng

```javascript
promise
    .then(() => anotherPromise)
    .then(() => thirdPromise);
```

Nên sử dụng Promise Chain để mã nguồn dễ đọc hơn.

---

## 📚 Summary

- Promise đại diện cho kết quả của một tác vụ bất đồng bộ.
- Promise có ba trạng thái:
  - Pending
  - Fulfilled
  - Rejected
- `then()` xử lý thành công.
- `catch()` xử lý lỗi.
- `finally()` luôn được thực thi.
- Promise giúp giảm Callback Hell và làm mã nguồn dễ bảo trì hơn.

---

## 📝 Quiz

### Question 1

Promise có bao nhiêu trạng thái?

A.

```text
2
```

B.

```text
3
```

C.

```text
4
```

D.

```text
5
```

**Answer: B**

**Giải thích:** Ba trạng thái: `pending`, `fulfilled`, `rejected`. Điều quan trọng hơn con số là Promise chỉ chuyển trạng thái **một lần** và không quay lại được — vì vậy gọi `resolve()` lần thứ hai không có tác dụng gì.


---

### Question 2

Phương thức nào được sử dụng để xử lý lỗi của Promise?

A.

```javascript
then()
```

B.

```javascript
resolve()
```

C.

```javascript
catch()
```

D.

```javascript
finally()
```

**Answer: C**

**Giải thích:** `.catch()` bắt lỗi của **mọi** bước phía trên trong chuỗi, nên một `.catch()` ở cuối là đủ. Đây chính là lợi thế lớn nhất so với callback, nơi mỗi tầng phải tự kiểm tra `if (err)`. `.finally()` thì luôn chạy nhưng không xử lý lỗi.

