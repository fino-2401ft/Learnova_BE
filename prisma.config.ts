import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Từ Prisma 6.16, cấu hình chuyển từ khối "prisma" trong package.json sang file này.
// Khối cũ vẫn chạy ở Prisma 6 nhưng sẽ bị bỏ ở Prisma 7.
//
// Lưu ý: khi có file cấu hình, Prisma KHÔNG tự nạp .env nữa — dòng import
// 'dotenv/config' ở trên là thứ giữ cho DATABASE_URL đọc được.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});
