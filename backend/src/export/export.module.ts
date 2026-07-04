import { Module, forwardRef } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [SupabaseModule, AuthModule, forwardRef(() => CategoriesModule)],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
