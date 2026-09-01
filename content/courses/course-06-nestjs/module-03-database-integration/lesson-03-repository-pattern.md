---
id: nest-m3-l3
course: NestJS
module: Database Integration
title: Repository Pattern
order: 3
difficulty: Intermediate
estimatedTime: 45
---

# Repository Pattern

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Giải thích Repository Pattern giải quyết vấn đề gì.
- Tách tầng truy vấn dữ liệu ra khỏi tầng nghiệp vụ.
- Viết unit test cho service mà không cần database thật.
- Biết khi nào **không** nên dùng pattern này.

---

## 📖 Definition

**Repository** là lớp trung gian giữa nghiệp vụ và nơi lưu dữ liệu. Service gọi repository; chỉ repository mới biết Prisma tồn tại.

Nghe qua thì giống một tầng thừa. Nó giải quyết ba vấn đề cụ thể:

**Test được mà không cần database.** Service gọi thẳng `PrismaService` thì muốn viết unit test phải dựng cả Postgres, hoặc giả lập một object có đủ `prisma.user.findMany`, `prisma.user.count`… lồng nhau. Với repository, chỉ cần một object có vài phương thức phẳng.

**Truy vấn không bị lặp.** Câu `findMany` với đúng bộ `where`, `include`, `orderBy` mà xuất hiện ở bốn service là bốn chỗ phải sửa khi mô hình đổi. Đặt nó trong repository thì chỉ còn một.

**Đổi công nghệ lưu trữ không phá nghiệp vụ.** Đây là lý do hay được nhắc nhất nhưng lại ít giá trị nhất trong thực tế — rất hiếm dự án đổi ORM. Đừng lấy nó làm lý do chính.

---

## ⚙️ Syntax

```typescript
@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(courseId: string) {
    return this.prisma.course.findUnique({ where: { courseId } });
  }
}
```

### Example 1 - Repository cơ bản

```typescript
import { Injectable } from '@nestjs/common';
import { Course, Prisma } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where: Prisma.CourseWhereInput, skip: number, take: number): Promise<Course[]> {
    return this.prisma.course.findMany({
      where,
      skip,
      take,
      orderBy: { publishedAt: 'desc' },
    });
  }

  count(where: Prisma.CourseWhereInput): Promise<number> {
    return this.prisma.course.count({ where });
  }

  findById(courseId: string): Promise<Course | null> {
    return this.prisma.course.findUnique({ where: { courseId } });
  }

  create(data: Prisma.CourseUncheckedCreateInput): Promise<Course> {
    return this.prisma.course.create({ data });
  }
}
```

Repository **không** chứa nghiệp vụ. Nó không kiểm tra quyền, không ném `ForbiddenException`, không quyết định trạng thái nào chuyển sang trạng thái nào. Nó chỉ đọc và ghi.

### Example 2 - Service dùng repository

```typescript
@Injectable()
export class CourseService {
  constructor(private readonly repository: CourseRepository) {}

  async publish(courseId: string, user: AuthenticatedUser): Promise<Course> {
    const course = await this.repository.findById(courseId);

    // Toàn bộ phần dưới đây là NGHIỆP VỤ, và nó không biết Prisma tồn tại.
    if (!course) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy khoá học' });
    }

    if (course.mentorId !== user.userId && user.role !== 'ADMIN') {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Không phải khoá học của bạn' });
    }

    if (course.status !== 'PENDING_APPROVAL') {
      throw new UnprocessableEntityException({
        code: 'INVALID_STATE',
        message: 'Chỉ duyệt được khoá đang chờ duyệt',
      });
    }

    return this.repository.updateStatus(courseId, 'PUBLISHED', user.userId);
  }
}
```

### Example 3 - Đăng ký trong module

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [CourseController],
  providers: [CourseService, CourseRepository],
  // Chỉ export service. Repository là chi tiết bên trong, module khác
  // không nên chạm tới.
  exports: [CourseService],
})
export class CourseModule {}
```

### Example 4 - Unit test không cần database

Đây là chỗ pattern trả lại công sức bỏ ra:

```typescript
describe('CourseService.publish', () => {
  let service: CourseService;
  let repository: jest.Mocked<CourseRepository>;

  beforeEach(async () => {
    // Đối tượng giả chỉ có hai phương thức phẳng.
    repository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<CourseRepository>;

    const module = await Test.createTestingModule({
      providers: [CourseService, { provide: CourseRepository, useValue: repository }],
    }).compile();

    service = module.get(CourseService);
  });

  it('từ chối khi khoá học không ở trạng thái chờ duyệt', async () => {
    repository.findById.mockResolvedValue({
      courseId: 'c1',
      mentorId: 'u1',
      status: 'DRAFT',
    } as Course);

    await expect(service.publish('c1', { userId: 'u1', role: 'MENTOR' } as AuthenticatedUser))
      .rejects.toThrow(UnprocessableEntityException);

    // Khẳng định quan trọng: nghiệp vụ dừng lại, không có lệnh ghi nào chạy.
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });
});
```

Không có repository, đối tượng giả phải là `{ course: { findUnique: jest.fn(), update: jest.fn() } }` — và mỗi lần đổi câu truy vấn trong service lại phải sửa cả đống test.

### Example 5 - Repository trả về kiểu của Prisma, không phải DTO

```typescript
// ĐÚNG: repository trả về entity, service quyết định trả gì ra ngoài
findById(courseId: string): Promise<Course | null> { }

// SAI: repository không nên biết API trả về hình dạng gì
findByIdAsDto(courseId: string): Promise<CourseResponseDto> { }
```

Chuyển entity thành DTO là việc của tầng trên. Nhét nó vào repository khiến cùng một truy vấn không dùng lại được cho mục đích khác — ví dụ một job nền cần đủ trường chứ không cần bản rút gọn cho API.

---

## 📌 Notes

- **Repository là provider bình thường**: cần `@Injectable()` và đăng ký trong `providers`.
- **Đừng export repository** ra ngoài module — module khác nên đi qua service.
- **Một repository cho một aggregate**, không phải một repository cho một bảng. `CourseRepository` xử lý luôn `chapters` và `lessons` là hợp lý vì chúng không tồn tại độc lập.
- **Transaction cắt ngang nhiều repository** cần truyền `Prisma.TransactionClient` vào từng phương thức, hoặc gom thao tác đó vào một repository duy nhất.

---

## 🌍 Real World Example

Repository cho module khoá học, xử lý cả tài nguyên con:

```typescript
@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Danh sách kèm số liệu tổng hợp — chỉ một lượt đi database. */
  findPublished(skip: number, take: number) {
    return this.prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      skip,
      take,
      orderBy: { publishedAt: 'desc' },
      include: {
        mentor: { include: { user: { select: { username: true, avatarUrl: true } } } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  /** Toàn bộ nội dung để dựng trang chi tiết. */
  findWithOutline(courseId: string) {
    return this.prisma.course.findUnique({
      where: { courseId },
      include: {
        chapters: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              select: { lessonId: true, title: true, durationMinutes: true, orderIndex: true },
            },
          },
        },
      },
    });
  }

  /**
   * Đổi trạng thái trong một transaction cùng với việc ghi nhật ký duyệt.
   *
   * Hai thao tác phải cùng thành công hoặc cùng thất bại: một khoá học đã
   * chuyển sang PUBLISHED mà không có bản ghi ai duyệt là dữ liệu không truy
   * vết được.
   */
  updateStatus(courseId: string, status: CourseStatus, reviewerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.update({
        where: { courseId },
        data: {
          status,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          publishedAt: status === 'PUBLISHED' ? new Date() : null,
        },
      });

      await tx.courseReviewLog.create({
        data: { courseId, reviewerId, status },
      });

      return course;
    });
  }
}
```

Chú ý `findPublished` dùng `include` thay vì lặp qua từng khoá rồi truy vấn mentor — đó là cách tránh bài toán N+1. Và `_count` để database đếm thay vì nạp toàn bộ bản ghi ghi danh về chỉ để lấy độ dài mảng.

---

## ⚠️ Common Mistakes

**Sai 1 — Nhét nghiệp vụ vào repository**

```typescript
// SAI: repository không được biết về quyền hạn
async findById(id: string, user: User) {
  const course = await this.prisma.course.findUnique({ where: { courseId: id } });
  if (course.mentorId !== user.id) throw new ForbiddenException();
  return course;
}
```

Kiểm tra quyền là nghiệp vụ, thuộc về service.

**Sai 2 — Repository trả về DTO**

Cùng một truy vấn không dùng lại được cho mục đích khác.

**Sai 3 — Vẫn inject `PrismaService` vào service**

```typescript
// SAI: có repository rồi mà service vẫn gọi thẳng Prisma
constructor(
  private readonly repository: CourseRepository,
  private readonly prisma: PrismaService, // <- phá vỡ toàn bộ mục đích
) {}
```

**Sai 4 — Một repository cho mỗi bảng**

`ChapterRepository` và `LessonRepository` riêng nghe có vẻ gọn, nhưng chương và bài học không tồn tại ngoài khoá học. Tách ra chỉ tạo thêm việc phối hợp.

**Sai 5 — Export repository ra ngoài module**

Module khác gọi thẳng repository sẽ bỏ qua mọi kiểm tra nghiệp vụ trong service.

**Sai 6 — Dùng pattern này cho dự án CRUD đơn giản**

Nếu service chỉ gọi đúng một lệnh Prisma rồi trả về, repository chỉ là một tầng chuyển tiếp không thêm giá trị gì. Thêm nó khi thấy đau, đừng thêm vì thấy trong sách.

---

## 📋 Summary

- Repository là lớp trung gian giữa nghiệp vụ và Prisma; chỉ nó biết truy vấn được viết thế nào.
- Giá trị thật nằm ở khả năng test và ở việc không lặp truy vấn — không phải ở chuyện đổi ORM.
- Repository chỉ đọc và ghi: không kiểm tra quyền, không ném lỗi nghiệp vụ, không dựng DTO.
- Đăng ký trong `providers`, nhưng chỉ `exports` service ra ngoài module.
- Một repository cho một aggregate, không phải một repository cho một bảng.
- Dự án CRUD đơn giản thì pattern này chỉ thêm tầng thừa.

---

## 📝 Quiz

### Question 1

Lợi ích cụ thể nhất của Repository Pattern trong một dự án NestJS là gì?

A. Truy vấn chạy nhanh hơn vì Prisma được gọi ít lần hơn.

B. Service viết unit test được mà không cần database, vì chỉ phải giả lập vài phương thức phẳng thay vì cả cây `prisma.model.method`.

C. Nó tự động sinh migration khi mô hình dữ liệu thay đổi.

D. Nó thay thế hoàn toàn nhu cầu dùng ORM.

**Answer: B**

**Giải thích:** Repository không làm truy vấn nhanh hơn — nó chỉ chuyển tiếp. Giá trị nằm ở ranh giới: service phụ thuộc vào một interface hẹp gồm vài phương thức, nên đối tượng giả trong test cũng chỉ cần vài phương thức. Gọi thẳng Prisma thì phải giả lập cấu trúc lồng nhiều tầng, và mỗi lần đổi câu truy vấn lại phải sửa hết test.

---

### Question 2

Đoạn code sau vi phạm nguyên tắc nào của Repository Pattern?

```typescript
@Injectable()
export class CourseRepository {
  async findById(id: string, user: User) {
    const course = await this.prisma.course.findUnique({ where: { courseId: id } });
    if (course.mentorId !== user.id) throw new ForbiddenException();
    return course;
  }
}
```

A. Repository không được dùng `async`.

B. Repository không được nhận tham số ngoài khoá chính.

C. Repository đang chứa nghiệp vụ — kiểm tra quyền thuộc về service, còn repository chỉ nên đọc và ghi dữ liệu.

D. `findUnique` phải thay bằng `findMany`.

**Answer: C**

**Giải thích:** Trộn kiểm tra quyền vào repository làm mất đúng ranh giới mà pattern này sinh ra để giữ. Hệ quả thực tế: một job nền hay lệnh CLI cần đọc khoá học sẽ không dùng lại được phương thức này vì chúng không có `user`, và test cho tầng dữ liệu bỗng phải dựng thêm dữ liệu người dùng.
