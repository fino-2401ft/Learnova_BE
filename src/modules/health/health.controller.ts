import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/database/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    const startedAt = Date.now();

    try {
      // The cheapest query that still reaches the database. Returning a static
      // { status: 'ok' } would stay green with a dead database, which is worse than
      // having no health check at all.
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      // The original error carries host, port and database name. PrismaService
      // already logged it.
      throw new ServiceUnavailableException('Database is unreachable');
    }

    return {
      status: 'ok',
      database: 'up',
      latencyMs: Date.now() - startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
