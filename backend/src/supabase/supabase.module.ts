import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SchemaInitService } from './schema-init.service';

@Global()
@Module({
  providers: [SupabaseService, SchemaInitService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
