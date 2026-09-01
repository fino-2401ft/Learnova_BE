import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/** Global because nearly every repository needs PrismaService. One of the very few
 *  modules that should be: overusing @Global() makes the dependency graph invisible. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
