import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase 配置缺失，请检查环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
    }

    const ws = require('ws');
    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      realtime: {
        transport: ws,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase 客户端未初始化');
    }
    return this.supabase;
  }

  isConfigured(): boolean {
    return this.supabase !== undefined;
  }
}
