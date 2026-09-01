import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

import { AppConfig } from '@/config/configuration';

export class ChatIoAdapter extends IoAdapter {
  private readonly cors: { origin: string; credentials: boolean };

  constructor(app: INestApplicationContext) {
    super(app);

    const config = app.get(ConfigService);
    const appConfig = config.get<AppConfig>('app')!;

    this.cors = {
      origin: appConfig.corsOrigin,
      credentials: true,
    };
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    return super.createIOServer(port, { ...options, cors: this.cors });
  }
}
