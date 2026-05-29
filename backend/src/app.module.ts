import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionModule } from './transaction/transaction.module';
import { ExportModule } from './export/export.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { StatisticsModule } from './statistics/statistics.module';
import { CategoriesModule } from './categories/categories.module';
import { BudgetsModule } from './budgets/budgets.module';
import { BooksModule } from './books/books.module';
import { MapModule } from './map/map.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
    }),
    SupabaseModule,
    AuthModule,
    TransactionModule,
    ExportModule,
    StatisticsModule,
    CategoriesModule,
    BudgetsModule,
    BooksModule,
    MapModule,
  ],
})
export class AppModule {}
