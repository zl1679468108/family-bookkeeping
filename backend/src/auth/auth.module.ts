import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { MailModule } from '../mail/mail.module';
import { TokenService } from './token.service';
import { TokenAuthGuard } from './token-auth.guard';

@Module({
  imports: [SupabaseModule, MailModule],
  providers: [AuthService, TokenService, TokenAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, TokenService, TokenAuthGuard],
})
export class AuthModule {}
