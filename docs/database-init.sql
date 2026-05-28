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
-- ==============================================
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  image_url VARCHAR(500),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 5. 预算表
-- ==============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
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
CREATE TRIGGER update_password_resets_updated_at BEFORE UPDATE ON password_resets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 6. 分类表（2026-05-26: P0 自定义分类功能）
-- 2026-05-26 更新：user_id 改为可空（系统默认分类为 NULL），新增 is_default 标记
-- ==============================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = 系统默认分类
  name        VARCHAR(50) NOT NULL,
  icon        VARCHAR(50) NOT NULL DEFAULT '📌',
  type        VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
  is_default  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 迁移：如果 categories 表已存在，补齐缺失的列（兼容旧表结构）
DO $$
BEGIN
    -- user_id 改为可空（系统默认分类为 NULL）
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'user_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL;
    END IF;

    -- 新增 is_default 列（2026-05-26: 区分系统默认分类与用户自定义分类）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'is_default'
    ) THEN
        ALTER TABLE categories ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_default ON categories(is_default);

-- 唯一约束：同一用户下分类名+类型不能重复
-- 注意：PostgreSQL UNIQUE 索引中 NULL != NULL，所以 user_id=NULL 的行不会被去重
-- 因此额外加一个部分唯一索引，确保系统默认分类(user_id IS NULL)不会重复
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name_type ON categories(user_id, name, type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_default_name_type ON categories(name, type) WHERE user_id IS NULL;

COMMENT ON TABLE categories IS '分类表（系统默认 + 用户自定义）';

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 初始化系统默认分类（16个：10支出 + 6收入）
-- ==============================================
INSERT INTO categories (user_id, name, icon, type, is_default, sort_order) VALUES
  -- 支出分类
  (NULL, '食品', '🛒', 'expense', true, 1),
  (NULL, '餐饮', '🍜', 'expense', true, 2),
  (NULL, '交通', '🚗', 'expense', true, 3),
  (NULL, '购物', '🛍️', 'expense', true, 4),
  (NULL, '通讯', '📱', 'expense', true, 5),
  (NULL, '居住', '🏠', 'expense', true, 6),
  (NULL, '娱乐', '🎮', 'expense', true, 7),
  (NULL, '医疗', '💊', 'expense', true, 8),
  (NULL, '教育', '📚', 'expense', true, 9),
  (NULL, '其他', '📌', 'expense', true, 10),
  -- 收入分类
  (NULL, '工资', '💼', 'income', true, 11),
  (NULL, '奖金', '🎁', 'income', true, 12),
  (NULL, '投资', '📈', 'income', true, 13),
  (NULL, '兼职', '💻', 'income', true, 14),
  (NULL, '礼金', '🎁', 'income', true, 15),
  (NULL, '其他收入', '💰', 'income', true, 16)
ON CONFLICT (name, type) WHERE user_id IS NULL DO NOTHING;
