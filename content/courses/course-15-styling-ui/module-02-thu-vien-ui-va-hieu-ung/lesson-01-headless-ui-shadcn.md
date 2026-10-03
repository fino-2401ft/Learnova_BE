---
id: styling-ui-m2-l1
course: Styling, CSS Systems & UI Component Libraries
module: Thư viện UI và hiệu ứng
title: Headless UI & Shadcn UI Components
order: 1
difficulty: Intermediate
estimatedTime: 240
---
# Headless UI & Shadcn UI Components

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân biệt kiến trúc thư viện **Headless UI Components** (Radix UI, Headless UI) với các thư viện Component đóng gói kiểu cũ (Material UI, Ant Design).
- Làm chủ triết lý kiến trúc của **Shadcn UI** (Copy-paste Architecture - Sở hữu mã nguồn 100%).
- Khởi tạo và tích hợp **Shadcn UI CLI** vào dự án React / Tailwind CSS.
- Tùy biến và mở rộng các Primitive Components (Dialog/Modal, Popover, Dropdown Menu, Select, Tabs).
- Quản lý các biến thể kiểu dáng với thư viện **`class-variance-authority` (CVA)**.
- Đảm bảo khả năng truy cập chuẩn **A11y (Accessibility)** với Keyboard Navigation và ARIA attributes.

---

## 📖 Definition

### 1. Tại Sao Thư Viện Headless UI & Shadcn UI Lại Thống Trị Ngành Frontend?

Trước đây, khi dùng các thư viện UI truyền thống như Material UI hay Ant Design:
- Bạn bị trói buộc bởi kiểu dáng thiết kế mặc định rất khó để ghi đè (Override CSS).
- Kích thước tập tin đóng gói (Bundle Size) bị phình to khủng khiếp do phải nạp hàng trăm Component không dùng đến.
- Khi muốn tùy biến một thanh Dialog theo đúng thiết kế Figma của công ty, bạn phải viết hàng chục dòng CSS `!important` rườm rà.

**Headless UI (Radix UI Primitives)** ra đời với triết lý: **Chỉ cung cấp Logic, Trạng thái (Open/Close), Keyboard Navigation, và ARIA Attributes — HOÀN TOÀN KHÔNG CÓ BẤT KỲ STYLES NÀO!**

**Shadcn UI** lấy các Radix UI Primitives này, định kiểu sẵn bằng Tailwind CSS, và thay vì cài đặt dưới dạng gói `node_modules` đóng kín, **Shadcn UI sao chép trực tiếp mã nguồn Component vào thư mục `src/components/ui/` của dự án bạn!**
- You own the code 100% (Bạn có quyền chỉnh sửa trực tiếp mã nguồn Component).
- Bundle Size siêu nhẹ (Chỉ nạp đúng mã nguồn Component có dùng).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   KIẾN TRÚC SHADCN UI (COPY-PASTE CODEBASE)            │
└────────────────────────────────────────────────────────────────────────┘

  [ Radix UI Primitives ] ──( Logic & A11y )──┐
                                               ├──> [ src/components/ui/dialog.tsx ]
  [ Tailwind CSS ]        ──( Styling )───────┘    (100% Mã nguồn thuộc dự án bạn!)
```

---

## 2. Thư Viện Class Variance Authority (CVA)

Shadcn UI sử dụng thư viện **`class-variance-authority` (CVA)** để định nghĩa các biến thể giao diện (Variants) cho Component một cách sạch sẽ:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
```

---

## 💻 Syntax

### Shadcn Component Usage Pattern
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DemoDialog() {
  return (
    <Dialog>
      <DialogTrigger className="btn-primary">Mở Modal</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tiêu đề Hộp thoại</DialogTitle>
        </DialogHeader>
        <p>Nội dung hộp thoại A11y với phím Esc và Focus Trap tự động...</p>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📝 Example 1 - Định Nghĩa Button Component Bằng Class Variance Authority (CVA) (`src/components/ui/button.tsx`)

```tsx
// src/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// 1. Định nghĩa các biến thể giao diện bằng CVA
export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white shadow hover:bg-blue-600/90",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-600/90",
        outline: "border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800",
        secondary: "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50",
        ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        link: "text-blue-600 underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Slot cho phép render thành tag khác nếu asChild = true
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

---

## 📝 Example 2 - Modal Dialog Xác Nhận Xóa Dùng Radix UI Dialog Primitive

```tsx
// src/components/DeleteConfirmDialog.tsx
import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./ui/button";

interface DeleteConfirmDialogProps {
  itemName: string;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({ itemName, onConfirm }: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="destructive" size="sm">
          🗑️ Xóa Bài Viết
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay che mờ nền */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />

        {/* Content Hộp thoại nằm giữa màn hình với Focus Trap tự động */}
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white dark:bg-slate-900 p-6 shadow-lg duration-200 rounded-2xl border-slate-200 dark:border-slate-800">
          <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">
            Xác Nhận Xóa Dữ Liệu
          </Dialog.Title>

          <Dialog.Description className="text-sm text-slate-600 dark:text-slate-400 my-3">
            Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa vĩnh viễn <strong>"{itemName}"</strong> khỏi hệ thống?
          </Dialog.Description>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Dialog.Close asChild>
              <Button variant="outline">Hủy</Button>
            </Dialog.Close>
            <Button variant="destructive" onClick={handleConfirm}>
              Xác Nhận Xóa
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

---

## 📝 Example 3 - Xây Dựng Accessible Dropdown Menu Với Radix UI Primitives

```tsx
// src/components/UserActionDropdown.tsx
import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "./ui/button";

export function UserActionDropdown() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="sm">
          ⚙️ Quản Lý Tài Khoản ▾
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="min-w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-xl z-50 space-y-1"
        >
          <DropdownMenu.Item className="text-xs font-medium p-2 outline-none rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center">
            👤 Hồ sơ cá nhân
          </DropdownMenu.Item>

          <DropdownMenu.Item className="text-xs font-medium p-2 outline-none rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center">
            💳 Lịch sử thanh toán
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          <DropdownMenu.Item className="text-xs font-medium p-2 outline-none rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer flex items-center">
            🚪 Đăng xuất
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

---

## ⚠️ Notes

1. **Khả Năng Truy Cập A11y Được Tích Hợp Sẵn Trong Radix UI:** Radix UI Primitives tự động xử lý các phím điều hướng bàn phím (`Esc` để đóng modal, phím mũi tên `↑/↓` trong dropdown, phím `Tab` nhốt focus) và gán sẵn các thuộc tính `aria-expanded`, `aria-haspopup`.

---

## ❌ Common Mistakes

### Sai 1 - Coi Shadcn UI là một npm package cài đặt thông thường
Shadcn UI KHÔNG PHẢI là một npm package `npm i shadcn-ui`. Shadcn UI là một công cụ mã nguồn mở sao chép trực tiếp code vào thư mục dự án bạn. Bạn hoàn toàn có thể mở file `src/components/ui/button.tsx` ra và sửa đổi tùy ý.

---

## 📚 Summary

- **Headless UI (Radix UI)** chỉ cung cấp Logic và A11y, hoàn toàn không dính dáng đến CSS Style.
- **Shadcn UI** áp dụng mô hình Copy-paste mã nguồn trực tiếp vào dự án bạn (`src/components/ui/`).
- Dùng **Class Variance Authority (CVA)** để quản lý các biến thể kiểu dáng (Variants & Sizes).
- Hỗ trợ 100% phím bấm điều hướng bàn phím (Keyboard Navigation) và ARIA Attributes theo chuẩn A11y.

---

## 📝 Quiz

### Question 1
Triết lý thiết kế đột phá mấu chốt của Shadcn UI khiến nó khác biệt hoàn toàn với các thư viện Component đóng gói truyền thống (như Material UI hay Ant Design) là gì?

A. Shadcn UI bắt buộc cài đặt qua CSDL  
B. Shadcn UI không phải là một npm package đóng kín, nó sao chép trực tiếp mã nguồn các Component (dựng trên Radix UI + Tailwind) vào thư mục `src/components/ui/` giúp bạn sở hữu mã nguồn 100% và dễ dàng tùy biến  
C. Shadcn UI chỉ dùng được cho mobile  
D. Cả A và C  

**Explanation:**  
Shadcn UI đi theo triết lý "Own your code". Các Component được copy trực tiếp vào codebase của bạn, cho phép bạn toàn quyền sửa đổi mã nguồn, tùy biến Tailwind class mà không bị giới hạn bởi các gói npm đóng kín.

**Answer: B**

---

### Question 2
Khái niệm **Headless UI Components** (như Radix UI hay Headless UI) mang ý nghĩa gì trong kiến trúc phát triển Frontend hiện đại?

A. Thư viện chỉ chạy trên máy chủ không có màn hình  
B. Thư viện chỉ cung cấp logic hoạt động, quản lý trạng thái và chuẩn truy cập A11y (Keyboard, ARIA), hoàn toàn không chứa CSS mặc định, nhường toàn quyền thiết kế giao diện cho lập trình viên  
C. Thư viện tự động vẽ hình ảnh  
D. Cả A và C  

**Explanation:**  
Headless UI tách biệt hoàn toàn giữa Logic/A11y và CSS Styling. Thư viện xử lý việc bấm phím Esc đóng modal, nhốt phím Tab, nhưng không áp bất kỳ class CSS nào, giúp lập trình viên tự do styling bằng Tailwind CSS.

**Answer: B**

---

### Question 3
Thư viện nào được Shadcn UI sử dụng để khai báo và định nghĩa các biến thể kiểu dáng (Variants như `primary`, `destructive`, `outline` và Sizes như `sm`, `lg`) một cách sạch sẽ bằng TypeScript?

A. `class-variance-authority` (CVA)  
B. `redux-toolkit`  
C. `axios`  
D. `react-router`  

**Explanation:**  
`class-variance-authority` (CVA) cho phép bạn cấu hình một hàm cva() chứa danh sách các variants và defaultVariants, tự động ghép class và cung cấp gợi ý kiểu TypeScript chuẩn xác khi tiêu thụ Component.

**Answer: A**
