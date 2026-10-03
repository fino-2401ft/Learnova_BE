---
id: nextjs-fullstack-m2-l1
course: Next.js, Full-stack React & Enterprise System Architecture
module: Lấy dữ liệu và mutation
title: Data Fetching Strategies: SSR, SSG & ISR
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Data Fetching Strategies: SSR, SSG & ISR

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân biệt 3 chiến lược nạp dữ liệu đỉnh cao trong Next.js: **Static Site Generation (SSG)**, **Server-Side Rendering (SSR)**, và **Incremental Static Regeneration (ISR)**.
- Sử dụng API **`fetch()` được mở rộng của Next.js** để điều khiển cơ chế Caching (`force-cache`, `no-store`).
- Cấu hình tự động làm tươi dữ liệu theo thời gian **Time-based Revalidation (`revalidate: seconds`)**.
- Kích hoạt làm mới bộ đệm theo yêu cầu **On-Demand Revalidation** với **`revalidatePath()`** và **`revalidateTag()`**.
- Tiền biên dịch danh sách các trang tĩnh động với hàm **`generateStaticParams()`**.
- Quản lý các chế độ Rendering nâng cao để đạt đỉnh hiệu năng Core Web Vitals và SEO.

---

## 📖 Definition

### 1. Phân Biên 3 Chiến Lược Rendering Trong Next.js App Router

| Chiến lược Rendering | Mô tả Bản chất | Khi nào Sử dụng? | Cú pháp Fetch trong Next.js |
|---|---|---|---|
| **SSG (Static Site Generation)** | Biên dịch HTML tĩnh 1 lần duy nhất tại thời điểm **Build Time**. | Trang giới thiệu, Blog, Điều khoản dịch vụ (Ít thay đổi) | `fetch(url, { cache: 'force-cache' })` |
| **SSR (Server-Side Rendering)** | Biên dịch HTML tĩnh động cho **MỌI LƯỢT REQUEST** của người dùng. | Bảng điều khiển cá nhân, Trang thông tin thời gian thực | `fetch(url, { cache: 'no-store' })` |
| **ISR (Incremental Static Regeneration)** | Tạo HTML tĩnh tại Build time, và **TỰ ĐỘNG TẠO LẠI TRANG TĨNH NGẦM** sau mỗi $N$ giây. | Trang Chi tiết Sản phẩm, Trang Tin tức (Cần tốc độ SSG nhưng data cập nhật) | `fetch(url, { next: { revalidate: 60 } })` |

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CHIẾN LƯỢC TẠO TRANG TĨNH NGẦM ISR (REVALIDATE: 60)   │
└────────────────────────────────────────────────────────────────────────┘

 [ Request phút thứ 1 ] ───> Trả về Trang Tĩnh từ Cache RAM (Tốc độ 5ms!)
 [ Request phút thứ 2 ] ───> Trả về Trang Tĩnh cũ + Trigger Rebuild ngầm ở Server
 [ Request phút thứ 3 ] ───> Trả về TRANG TĨNH MỚI ĐÃ ĐƯỢC CẬP NHẬT!
```

---

## 2. Tiền Biên Dịch Dynamic Routes Với `generateStaticParams()`

Khi bạn có 1,000 khóa học (`/courses/[id]`), nếu dùng SSR, mỗi lần người dùng bấm vào một khóa học, Server lại phải query DB và render lại trang từ đầu.

**`generateStaticParams()`** cho phép bạn trả về danh sách 1,000 ID khóa học tại thời điểm Build Time. Next.js sẽ **tự động biên dịch sẵn 1,000 file HTML tĩnh** cho tất cả các khóa học đó! Người dùng bấm vào bất kỳ khóa học nào đều nhận được file HTML tĩnh ngay lập tức trong **5ms**.

---

## 💻 Syntax

### Data Fetching Cache Options Blueprint
```typescript
// 1. SSG (Static Site Generation - Mặc định)
const ssgData = await fetch("https://api.example.com/data", { cache: "force-cache" });

// 2. SSR (Server-Side Rendering - Dynamic)
const ssrData = await fetch("https://api.example.com/data", { cache: "no-store" });

// 3. ISR (Incremental Static Regeneration - Revalidate sau 60 giây)
const isrData = await fetch("https://api.example.com/data", { next: { revalidate: 60 } });
```

---

## 📝 Example 1 - Áp Dụng ISR (Incremental Static Regeneration) Cho Trang Chi Tiết Sản Phẩm

```tsx
// app/products/[id]/page.tsx

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

// 1. Hàm fetch áp dụng ISR Revalidate sau mỗi 120 giây
async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`https://api.educonnect.vn/api/v1/products/${id}`, {
    // 💡 ISR CONFIG: Coi file HTML tĩnh là tươi trong 120 giây. Sau 120s, tự động rebuild ngầm!
    next: { revalidate: 120, tags: ["product-detail"] }
  });

  if (!res.ok) throw new Error("Không thể nạp thông tin sản phẩm");
  return res.json();
}

// 2. Component Server
export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-4 bg-white rounded-2xl border shadow-sm my-8">
      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
        ⚡ ISR PAGE (REVALIDATE: 120s)
      </span>
      <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
      <p className="text-2xl font-black text-blue-600">{product.price.toLocaleString()} VNĐ</p>
      <p className="text-slate-600">{product.description}</p>
    </div>
  );
}
```

---

## 📝 Example 2 - Tiền Biên Dịch Trang Tĩnh Hàng Loạt Với `generateStaticParams()`

```tsx
// app/blog/[slug]/page.tsx

interface Post {
  slug: string;
  title: string;
  content: string;
}

// 1. Hàm generateStaticParams trả về danh sách tất cả các slugs cần build tĩnh trước!
export async function generateStaticParams() {
  const posts: Post[] = await fetch("https://api.educonnect.vn/api/v1/posts").then((r) => r.json());

  // Trả về mảng đối tượng matching với params { slug: string }
  return posts.map((post) => ({
    slug: post.slug
  }));
}

// 2. Component Trang Chi Tiết
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post: Post = await fetch(`https://api.educonnect.vn/api/v1/posts/${params.slug}`).then((r) => r.json());

  return (
    <article className="max-w-2xl mx-auto p-8 space-y-4">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <div className="prose">{post.content}</div>
    </article>
  );
}
```

---

## 📝 Example 3 - Kích Hoạt On-Demand Revalidation Với `revalidateTag()` Trong Route Handler API

```typescript
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// API Route cho phép Admin bấm nút làm tươi cache sản phẩm ngay lập tức!
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  // Kiểm tra Secret Token bảo mật
  if (secret !== process.env.MY_SECRET_REVALIDATE_TOKEN) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  // 💡 ON-DEMAND REVALIDATION: Xóa sạch cache của tất cả các trang có gắn tag "product-detail"!
  revalidateTag("product-detail");

  // Hoặc làm tươi cụ thể 1 tuyến đường
  revalidatePath("/products/[id]", "page");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
```

---

## ⚠️ Notes

1. **Khác biệt `cache: 'force-cache'` và `cache: 'no-store'`:**
   - **`force-cache`**: Tương đương SSG (Mặc định). Next.js sẽ lưu bộ đệm kết quả vĩnh viễn cho đến khi bạn chủ động xóa cache.
   - **`no-store`**: Tương đương SSR. Next.js bỏ qua hoàn toàn bộ đệm và gửi request tới API Server ở mọi lượt người dùng truy cập.

---

## ❌ Common Mistakes

### Sai 1 - Dùng `cache: 'no-store'` cho các trang dữ liệu tĩnh không bao giờ thay đổi
Dùng `cache: 'no-store'` cho các trang dữ liệu tĩnh sẽ làm tăng tải cho CSDL và kéo tụt chỉ số hiệu năng LCP của trang web xuống rõ rệt.

---

## 📚 Summary

- **SSG (`cache: 'force-cache'`)**: Tạo HTML tĩnh 1 lần lúc build, tốc độ tải tức thì 5ms.
- **SSR (`cache: 'no-store'`)**: Dựng HTML động ở Server cho mỗi lượt request.
- **ISR (`next: { revalidate: N }`)**: Kết hợp đỉnh cao của SSG và SSR, tự động làm tươi trang tĩnh ngầm sau mỗi N giây.
- **`generateStaticParams()`**: Tiền biên dịch sẵn hàng loạt file HTML tĩnh cho các Dynamic Routes `[id]`.
- **`revalidateTag()` / `revalidatePath()`**: Làm mới bộ đệm trang tĩnh theo yêu cầu (On-Demand).

---

## 📝 Quiz

### Question 1
Chiến lược nạp dữ liệu nào trong Next.js cho phép trang web đạt tốc độ siêu tốc của Static Site Generation (SSG) nhưng vẫn tự động cập nhật và tạo lại trang tĩnh ngầm ở background sau một khoảng thời gian cố định ($N$ giây)?

A. Client-Side Rendering (CSR)  
B. Incremental Static Regeneration (ISR)  
C. Server-Side Rendering (SSR)  
D. Direct Database Query  

**Explanation:**  
ISR (Incremental Static Regeneration) cho phép bạn giữ lợi thế tốc độ 5ms của trang tĩnh SSG, đồng thời tự động cập nhật trang tĩnh đó ngầm sau mỗi khoảng thời gian `revalidate: N` giây khi có người dùng truy cập.

**Answer: B**

---

### Question 2
Tùy chọn cấu hình `fetch()` nào trong Next.js được sử dụng để chuyển một Server Component sang chế độ Server-Side Rendering (SSR - Dynamic), buộc Next.js phải bỏ qua bộ đệm và gọi lại API mới ở MỌI lượt request?

A. `cache: 'force-cache'`  
B. `cache: 'no-store'`  
C. `cache: 'always'`  
D. `cache: 'reload'`  

**Explanation:**  
Truyền `{ cache: 'no-store' }` vào lệnh `fetch()` hướng dẫn Next.js không lưu trữ bộ đệm kết quả, biến trang đó thành Dynamic SSR và thực thi lệnh gọi API trên Server ở mỗi lượt truy cập của người dùng.

**Answer: B**

---

### Question 3
Hàm đặc biệt nào được xuất ra trong một tập tin Dynamic Route `app/blog/[slug]/page.tsx` để thông báo cho Next.js biết danh sách các tham số `slug` cần được tiền biên dịch thành các tệp HTML tĩnh trước tại thời điểm Build Time?

A. `getStaticProps()`  
B. `generateStaticParams()`  
C. `buildStaticRoutes()`  
D. `fetchParams()`  

**Explanation:**  
`generateStaticParams()` thay thế cho `getStaticPaths` cũ của Pages Router. Nó trả về mảng các đối tượng tham số `[ { slug: 'bai-1' }, { slug: 'bai-2' } ]`, giúp Next.js tạo sẵn các file HTML tĩnh tương ứng tại Build time.

**Answer: B**
