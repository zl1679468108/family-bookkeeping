import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { RecurringService } from './recurring.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, RecurringService],
})
export class TemplatesModule {}
