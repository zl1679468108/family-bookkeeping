import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TokenService } from './token.service';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

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
      .select('id, email, username, created_at')
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
