-- 家庭记账应用 - 数据库初始化脚本（不启用 RLS 版本）
-- 在 Supabase SQL 编辑器中执行此脚本时选择 "Run without RLS"

-- ==============================================
-- 1. 用户表
-- ==============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. 密码重置表
-- ==============================================
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  code VARCHAR(10),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. 会话表
-- ==============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 4. 交易记录表
-- 2026-05-29: category 改为 UUID 关联 categories 表
-- ==============================================
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  category UUID REFERENCES categories(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  image_url VARCHAR(500),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 5. 预算表
-- 2026-05-29: category 改为 UUID 关联 categories 表
-- ==============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  month DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, month)
);

-- ==============================================
-- 创建索引优化查询性能
-- ==============================================
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_password_resets_token;
DROP INDEX IF EXISTS idx_password_resets_user_id;
DROP INDEX IF EXISTS idx_user_sessions_token_hash;
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_user_sessions_expires_at;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_type;
DROP INDEX IF EXISTS idx_transactions_category;
DROP INDEX IF EXISTS idx_budgets_user_id;
DROP INDEX IF EXISTS idx_budgets_user_month;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);

-- ==============================================
-- 添加注释
-- ==============================================
COMMENT ON TABLE users IS '用户表';
COMMENT ON TABLE password_resets IS '密码重置表';
COMMENT ON TABLE user_sessions IS '用户会话表';
COMMENT ON TABLE transactions IS '交易记录表';
COMMENT ON TABLE budgets IS '预算表';

-- ==============================================
-- 创建触发器自动更新 updated_at
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_password_resets_updated_at ON password_resets;

-- 迁移：确保 password_resets 有 updated_at 列（兼容旧表）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'password_resets' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE password_resets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

CREATE TRIGGER update_password_resets_updated_at BEFORE UPDATE ON password_resets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 6. 分类表（2026-05-29: 重构为用户级分类，注册时预设 2 个默认分类）
-- ==============================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,
  icon        VARCHAR(50) NOT NULL DEFAULT '📌',
  type        VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
  is_default  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 迁移：如果 categories 表已存在，确保 user_id 为 NOT NULL，移除全局默认分类
DO $$
BEGIN
    -- 删除旧的系统默认分类（user_id IS NULL）
    DELETE FROM categories WHERE user_id IS NULL;

    -- 改为 NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'user_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
    END IF;

    -- 新增 is_default 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'is_default'
    ) THEN
        ALTER TABLE categories ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- 新增 sort_order 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- 唯一约束：同一用户下分类名+类型不能重复
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name_type ON categories(user_id, name, type);

-- 清理旧版全局默认分类的唯一索引
DROP INDEX IF EXISTS idx_categories_default_name_type;

COMMENT ON TABLE categories IS '分类表（用户级，注册时预设购物+工资 2 个默认分类）';

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 7. 账本表（2026-05-28: P2 多账本功能）
-- ==============================================
CREATE TABLE IF NOT EXISTS books (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_owner_id ON books(owner_id);

COMMENT ON TABLE books IS '账本表';

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 8. 账本成员表（2026-05-28: P2 多账本功能）
-- ==============================================
CREATE TABLE IF NOT EXISTS book_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_book_members_book_id ON book_members(book_id);
CREATE INDEX IF NOT EXISTS idx_book_members_user_id ON book_members(user_id);

COMMENT ON TABLE book_members IS '账本成员表';

-- ==============================================
-- 迁移：为现有表添加 book_id 字段
-- ==============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'book_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN book_id UUID REFERENCES books(id) ON DELETE SET NULL;
    CREATE INDEX idx_transactions_book_id ON transactions(book_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'book_id'
  ) THEN
    ALTER TABLE budgets ADD COLUMN book_id UUID REFERENCES books(id) ON DELETE SET NULL;
    CREATE INDEX idx_budgets_book_id ON budgets(book_id);
  END IF;
END $$;

COMMENT ON COLUMN transactions.book_id IS '所属账本 ID（NULL = 迁移前数据，等同于默认账本）';
COMMENT ON COLUMN budgets.book_id IS '所属账本 ID（NULL = 迁移前数据，等同于默认账本）';

-- ==============================================
-- 迁移：地图功能 - 交易表新增位置字段（2026-05-28）
-- ==============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE transactions ADD COLUMN latitude DECIMAL(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE transactions ADD COLUMN longitude DECIMAL(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'location_name'
  ) THEN
    ALTER TABLE transactions ADD COLUMN location_name VARCHAR(200);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'poi_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN poi_id VARCHAR(100);
  END IF;
END $$;

-- 部分索引：仅索引有位置信息的交易
CREATE INDEX IF NOT EXISTS idx_transactions_location
  ON transactions(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN transactions.latitude IS '纬度，范围 -90 ~ 90';
COMMENT ON COLUMN transactions.longitude IS '经度，范围 -180 ~ 180';
COMMENT ON COLUMN transactions.location_name IS '地点名称/地址描述';
COMMENT ON COLUMN transactions.poi_id IS '高德地图 POI ID';

-- ==============================================
-- 迁移：category 字段从 VARCHAR 改为 UUID（2026-05-29）
-- 注意：此迁移仅适用于已有数据的库。新库直接使用上方 CREATE TABLE 即可。
-- ==============================================
DO $$
BEGIN
  -- transactions 表迁移
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'category'
      AND data_type = 'character varying'
  ) THEN
    -- Step 1: 新增 category_id UUID 列
    ALTER TABLE transactions ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

    -- Step 2: 通过 user_id + category name 匹配回填 category_id
    UPDATE transactions t
    SET category_id = c.id
    FROM categories c
    WHERE t.user_id = c.user_id AND t.category = c.name;

    -- Step 3: 交换列名
    ALTER TABLE transactions DROP COLUMN category;
    ALTER TABLE transactions RENAME COLUMN category_id TO category;

    -- Step 4: 重建索引
    DROP INDEX IF EXISTS idx_transactions_category;
    CREATE INDEX idx_transactions_category ON transactions(category);
  END IF;

  -- budgets 表迁移
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'category'
      AND data_type = 'character varying'
  ) THEN
    -- Step 1: 新增 category_id UUID 列
    ALTER TABLE budgets ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE CASCADE;

    -- Step 2: 通过 user_id + category name 匹配回填
    UPDATE budgets b
    SET category_id = c.id
    FROM categories c
    WHERE b.user_id = c.user_id AND b.category = c.name;

    -- Step 3: 交换列名
    ALTER TABLE budgets DROP COLUMN category;
    ALTER TABLE budgets RENAME COLUMN category_id TO category;

    -- Step 4: 重建唯一约束（含 book_id，支持多账本独立预算）
    ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_month_key;
    ALTER TABLE budgets ADD CONSTRAINT budgets_user_id_category_month_key UNIQUE NULLS NOT DISTINCT (user_id, book_id, category, month);
  END IF;
END $$;

-- ==============================================
-- P1 地图功能 — 成员位置共享表（2025-06-11）
-- ==============================================
CREATE TABLE IF NOT EXISTS member_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude    DECIMAL(10, 7) NOT NULL,
  longitude   DECIMAL(10, 7) NOT NULL,
  is_sharing  BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_member_locations_book_id
  ON member_locations(book_id)
  WHERE is_sharing = true;

COMMENT ON TABLE member_locations IS '成员位置共享表';
COMMENT ON COLUMN member_locations.is_sharing IS '是否正在共享位置，关闭时保留最后位置但不可见';

-- ==============================================
-- 9. 交易模板表（2026-06-01: P1-5 快捷记账）
-- ==============================================
CREATE TABLE IF NOT EXISTS transaction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(10) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
  amount NUMERIC(12,2),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  note VARCHAR(200),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name VARCHAR(100),
  poi_id VARCHAR(100),
  merchant_name VARCHAR(100),
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transaction_templates_user_id ON transaction_templates(user_id);

COMMENT ON TABLE transaction_templates IS '交易模板表（P1-5 快捷记账）';
