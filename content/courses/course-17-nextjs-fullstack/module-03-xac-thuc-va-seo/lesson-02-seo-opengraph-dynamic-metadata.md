---
id: nextjs-fullstack-m3-l2
course: Next.js, Full-stack React & Enterprise System Architecture
module: Xác thực và SEO
title: SEO Optimization, OpenGraph, Dynamic Metadata & Microdata
order: 2
difficulty: Advanced
estimatedTime: 240
---
# SEO Optimization, OpenGraph, Dynamic Metadata & Microdata

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững kiến thức tối ưu hóa công cụ tìm kiếm **SEO (Search Engine Optimization)** nâng cao trong Next.js App Router.
- Khai báo **Static Metadata** và **Dynamic Metadata (`generateMetadata()`)** cho các trang chi tiết bài viết/sản phẩm.
- Xây dựng các thẻ **OpenGraph (OG Tags)** và **Twitter Cards** phục vụ tính năng hiển thị ảnh xem trước đẹp mắt khi chia sẻ link lên Facebook/Zalo/Twitter.
- Tự động sinh ảnh đại diện động cho bài viết với **`ImageResponse` (`@vercel/og`)**.
- Nhúng cấu trúc dữ liệu **JSON-LD Microdata (Structured Data)** giúp Google hiển thị Rich Snippets (Đánh giá sao, giá tiền, tác giả).

---

## 📖 Definition

### 1. Dynamic Metadata với `generateMetadata()`
Với các trang tĩnh, bạn khai báo đối tượng `export const metadata: Metadata = { ... }`.

Tuy nhiên, với các trang chi tiết động (như `/courses/react-pro` hay `/blog/bai-viet-1`), thông tin tiêu đề (`title`), mô tả (`description`) và ảnh xem trước (`og:image`) phụ thuộc vào dữ liệu từ CSDL.

Next.js cung cấp hàm **`generateMetadata({ params })`**: Hàm này chạy trên Server, fetch dữ liệu bài viết và trả về đối tượng `Metadata` chính xác **TRƯỚC KHI** trang web được gửi xuống Client.

### 2. OpenGraph (OG Tags) & Dynamic OG Images
Khi ai đó paste đường link trang web của bạn lên Facebook hay Zalo, trình duyệt sẽ cào các thẻ OpenGraph (`og:title`, `og:description`, `og:image`) để tạo ra một chiếc thẻ preview hấp dẫn.

Next.js hỗ trợ hàm **`ImageResponse`** cho phép bạn tự tạo ảnh PNG xem trước động trực tiếp từ mã JSX/Tailwind!

---

## 💻 Syntax

### Dynamic Metadata Generation Syntax
```typescript
import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await fetchCourseFromDb(params.id);

  return {
    title: `${course.title} | EduConnect`,
    description: course.summary,
    openGraph: {
      title: course.title,
      description: course.summary,
      images: [course.coverImageUrl],
    },
  };
}
```

---

## 📝 Example 1 - Khai báo Dynamic Metadata chuẩn SEO đầy đủ OpenGraph & Canonical Link

```tsx
// app/courses/[id]/page.tsx
import { Metadata } from "next";

interface PageProps {
  params: { id: string };
}

// 1. Hàm sinh Metadata động chuẩn SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Fetch thông tin khóa học từ CSDL
  const course = await fetch(`https://api.example.com/courses/${params.id}`).then((r) => r.json());

  const pageTitle = `${course.title} - Khóa Học React Chuyên Sâu`;
  const pageDescription = course.description || "Học lập trình React chuẩn doanh nghiệp.";
  const canonicalUrl = `https://educonnect.vn/courses/${params.id}`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl // Thẻ canonical chống trùng lặp nội dung SEO
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "EduConnect",
      images: [
        {
          url: course.imageUrl || "https://educonnect.vn/default-og.png",
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [course.imageUrl],
    },
  };
}

// 2. Component giao diện
export default function CoursePage({ params }: PageProps) {
  return <div>Chi tiết khóa học ID: {params.id}</div>;
}
```

---

## 📝 Example 2 - Nhúng Cấu trúc Dữ liệu JSON-LD Microdata (Structured Data) cho Google Rich Snippets

```tsx
// app/courses/[id]/page.tsx

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = {
    title: "Khóa Học React Masterclass",
    description: "Lộ trình 80 bài học React chuẩn doanh nghiệp",
    price: 1500000,
    rating: 4.9,
    reviewCount: 128
  };

  // Cấu trúc JSON-LD Schema.org cho Sản phẩm/Khóa học
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "EduConnect",
      "sameAs": "https://educonnect.vn"
    },
    "offers": {
      "@type": "Offer",
      "price": course.price,
      "priceCurrency": "VND",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": course.rating,
      "reviewCount": course.reviewCount
    }
  };

  return (
    <div className="p-6">
      {/* Nhúng thẻ script chứa dữ liệu cấu trúc JSON-LD cho Google Bot */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1>{course.title}</h1>
    </div>
  );
}
```

---

## 📝 Example 3 - Tự động tạo Sitemap (`app/sitemap.ts`) và Robots.txt (`app/robots.ts`)

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://educonnect.vn";

  // Fetch danh sách ID các bài viết từ CSDL
  const courses = [{ id: "1" }, { id: "2" }];

  const courseUrls = courses.map((c) => ({
    url: `${baseUrl}/courses/${c.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...courseUrls,
  ];
}
```

---

## ⚠️ Notes

1. **Khái niệm Canonical URL:** Luôn khai báo thẻ `alternates: { canonical: url }` để thông báo cho Google biết đâu là URL chính chủ của trang web, tránh bị Google phạt giảm hạng SEO do lỗi trùng lặp nội dung (Duplicate Content).

---

## ❌ Common Mistakes

### Sai 1 - Khai báo thẻ `<head>` thủ công trong App Router thay vì dùng Metadata API
Trong Next.js App Router, tuyệt đối không tự tay viết các thẻ `<title>` hay `<meta>` thủ công bên trong JSX. Hãy luôn sử dụng đối tượng `export const metadata` hoặc hàm `generateMetadata()` được Next.js quản lý tập trung.

---

## 📚 Summary

- **`generateMetadata()`** sinh Metadata động (Title, Description, OG Tags) trên Server dựa trên tham số URL.
- Thẻ **OpenGraph (`og:image`, `og:title`)** tối ưu hiển thị xem trước khi chia sẻ link lên mạng xã hội.
- Thẻ **JSON-LD (`application/ld+json`)** giúp Google hiển thị Rich Snippets (Đánh giá sao, giá tiền).
- Tự động tạo file **`sitemap.ts`** và **`robots.ts`** cho Bot tìm kiếm.

---

## 📝 Quiz

### Question 1
Hàm bất đồng bộ nào được sử dụng trong Next.js App Router để sinh ra các thông tin Metadata (Tiêu đề, Mô tả, OpenGraph Image) động dựa trên dữ liệu từ API/CSDL trước khi gửi trang web xuống Client?

A. `getStaticProps()`  
B. `generateMetadata({ params })`  
C. `useSEO()`  
D. `fetchMetadata()`  

**Answer: B**

---

### Question 2
Định dạng dữ liệu cấu trúc (Structured Data) chuẩn nào được nhúng vào thẻ `<script type="application/ld+json">` để giúp Google hiển thị các Rich Snippets (Đánh giá 5 sao, giá tiền) trên kết quả tìm kiếm?

A. XML  
B. JSON-LD (Schema.org)  
C. YAML  
D. CSV  

**Answer: B**

---

### Question 3
Mục đích của việc khai báo các thuộc tính `openGraph` (OG Tags như `og:image`, `og:title`) trong Metadata là gì?

A. Tự động mã hóa CSDL  
B. Giúp các nền tảng mạng xã hội (Facebook, Zalo, Twitter) hiển thị hình ảnh và thông tin xem trước đẹp mắt khi người dùng chia sẻ đường link  
C. Tự động đổi màu trang web  
D. Tăng tốc độ load RAM  

**Answer: B**
