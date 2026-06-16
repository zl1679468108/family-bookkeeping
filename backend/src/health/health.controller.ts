import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async check() {
    const supabase = await this.supabaseService.ping();
    return {
      status: supabase.ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        supabase: {
          status: supabase.ok ? 'ok' : 'unhealthy',
          configured: this.supabaseService.isConfigured(),
          latencyMs: supabase.latencyMs,
          message: supabase.message,
        },
      },
    };
  }
}
