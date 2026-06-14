import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/**
 * SchemaInitService
 * ---------------
 * 应用启动时，通过直连 PostgreSQL (DATABASE_URL) 执行 CREATE TABLE IF NOT EXISTS，
 * 确保所有业务表（尤其是 book_invitations / transaction_templates / member_locations 等）
 * 在首次请求到达前已经存在。
 *
 * 为什么不用 Supabase 客户端建表？
 * - Supabase 客户端使用的 anon/service_role key 走的是 PostgREST，不是原生 SQL 接口，
 *   不支持直接执行 DDL（CREATE TABLE 等）。
 * - 建表必须走原生 PostgreSQL 协议，因此使用 pg + DATABASE_URL。
 */
@Injectable()
export class SchemaInitService implements OnModuleInit {
  private readonly logger = new Logger(SchemaInitService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      this.logger.warn(
        '未检测到 DATABASE_URL，跳过自动建表。如果遇到 "Could not find the table" 报错，请在 .env 中配置 DATABASE_URL 后重启服务，' +
          '或在 Supabase SQL Editor 中手动执行 docs/database-init.sql。',
      );
      return;
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase') || databaseUrl.includes('localhost')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 2,
      idleTimeoutMillis: 5000,
    });

    try {
      this.logger.log('正在检查并初始化数据库表结构...');
      for (const sql of CREATE_TABLE_STATEMENTS) {
        await pool.query(sql);
      }
      this.logger.log('数据库表结构初始化完成。');
    } catch (err) {
      this.logger.error('数据库表结构初始化失败：' + (err as Error).message, (err as Error).stack);
    } finally {
      await pool.end().catch(() => {});
    }
  }
}

/**
 * 需要自动建表的 SQL 列表。
 * 全部使用 CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS，
 * 重复启动安全。
 */
const CREATE_TABLE_STATEMENTS: string[] = [
  // 触发器函数：自动更新 updated_at
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';`,

  // 用户表
  `CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    username      VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url    TEXT,
    role          VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status        VARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,

  // 密码重置表
  `CREATE TABLE IF NOT EXISTS password_resets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL,
    code        VARCHAR(10),
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);`,
  `CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);`,

  // 会话表
  `CREATE TABLE IF NOT EXISTS user_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);`,
  `CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id   ON user_sessions(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);`,

  // 分类表
  `CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(50) NOT NULL,
    icon        VARCHAR(50) NOT NULL DEFAULT '📌',
    type        VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
    is_default  BOOLEAN NOT NULL DEFAULT false,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name_type ON categories(user_id, name, type);`,

  // 账本表
  `CREATE TABLE IF NOT EXISTS books (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    icon        VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_books_owner_id    ON books(owner_id);`,
  `CREATE INDEX IF NOT EXISTS idx_books_is_archived ON books(is_archived);`,

  // 账本成员表
  `CREATE TABLE IF NOT EXISTS book_members (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id   UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (book_id, user_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_book_members_book_id ON book_members(book_id);`,
  `CREATE INDEX IF NOT EXISTS idx_book_members_user_id ON book_members(user_id);`,

  // 交易记录表
  `CREATE TABLE IF NOT EXISTS transactions (
    id            BIGSERIAL PRIMARY KEY,
    amount        DECIMAL(10, 2) NOT NULL,
    category      UUID REFERENCES categories(id) ON DELETE SET NULL,
    type          VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    date          DATE NOT NULL DEFAULT CURRENT_DATE,
    description   TEXT,
    image_url     VARCHAR(500),
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id       UUID REFERENCES books(id) ON DELETE SET NULL,
    latitude      DECIMAL(10, 7),
    longitude     DECIMAL(10, 7),
    location_name VARCHAR(200),
    poi_id        VARCHAR(100),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_user_id  ON transactions(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_type     ON transactions(type);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_book_id  ON transactions(book_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_location ON transactions(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;`,

  // 预算表
  `CREATE TABLE IF NOT EXISTS budgets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category    UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount      DECIMAL(10, 2) NOT NULL,
    month       DATE NOT NULL,
    book_id     UUID REFERENCES books(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, category, month)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_budgets_user_id   ON budgets(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);`,
  `CREATE INDEX IF NOT EXISTS idx_budgets_book_id   ON budgets(book_id);`,

  // 交易模板表
  `CREATE TABLE IF NOT EXISTS transaction_templates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(50) NOT NULL,
    type          VARCHAR(10) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
    amount        NUMERIC(12, 2),
    category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
    note          VARCHAR(200),
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    location_name VARCHAR(100),
    poi_id        VARCHAR(100),
    merchant_name VARCHAR(100),
    book_id       UUID REFERENCES books(id) ON DELETE SET NULL,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_transaction_templates_user_id ON transaction_templates(user_id);`,

  // 成员位置共享表
  `CREATE TABLE IF NOT EXISTS member_locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude    DECIMAL(10, 7) NOT NULL,
    longitude   DECIMAL(10, 7) NOT NULL,
    is_sharing  BOOLEAN NOT NULL DEFAULT true,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (book_id, user_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_member_locations_book_id ON member_locations(book_id)
    WHERE is_sharing = true;`,

  // 账本邀请码表  ⭐️ 本次修复的核心表
  `CREATE TABLE IF NOT EXISTS book_invitations (
    id          BIGSERIAL PRIMARY KEY,
    book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    code        VARCHAR(32) NOT NULL UNIQUE,
    created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    used_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS idx_book_invitations_code     ON book_invitations(code);`,
  `CREATE INDEX IF NOT EXISTS idx_book_invitations_book_id  ON book_invitations(book_id);`,
  `CREATE INDEX IF NOT EXISTS idx_book_invitations_active   ON book_invitations(code, expires_at, used_at);`,
];
