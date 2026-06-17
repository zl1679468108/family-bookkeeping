import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TokenService } from './token.service';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  private readonly logger = new Logger(TokenAuthGuard.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    // 处理 "Bearer <token>" 格式，使用正则分割以处理可能的换行/空格
    const parts = authHeader.split(/\s+/);
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    const token = parts[1].trim();

    const tokenHash = this.tokenService.hashToken(token);
    
    const supabase = this.supabaseService.getClient();
    const now = new Date().toISOString();

    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('token_hash', tokenHash)
      .gt('expires_at', now)
      .single();

    if (error || !session?.user_id) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username, role, status, created_at, current_book_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    request.user = user;
    request.authTokenHash = tokenHash;
    return true;
  }
}
