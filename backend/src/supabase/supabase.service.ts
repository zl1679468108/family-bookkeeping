import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase 配置缺失，请检查环境变量 SUPABASE_URL 和 SUPABASE_ANON_KEY');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
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
