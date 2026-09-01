import { Module } from '@nestjs/common';

import { CloudinaryService } from './cloudinary.service';
import { StorageService } from './storage.service';
import { SupabaseStorageService } from './supabase-storage.service';

/**
 * File storage, kept out of the chat module on purpose.
 *
 * Chat is the first thing that needs it, but course cover images are still being
 * served off local disk (see the note in main.ts) and are the obvious next caller.
 * Only StorageService is exported: the two provider services are an implementation
 * detail of the routing rule, and nothing outside should be choosing between them.
 */
@Module({
  providers: [StorageService, CloudinaryService, SupabaseStorageService],
  exports: [StorageService],
})
export class StorageModule {}
