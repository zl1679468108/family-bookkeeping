-- 静记 - 数据库初始化脚本
-- 用途：创建表结构、索引、触发器，提升查询性能
-- 在 Supabase SQL 编辑器中执行

-- ==============================================
-- 触发器函数：自动更新 updated_at
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================
-- 1. 用户表
-- ==============================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  username    VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url  TEXT,
  role        VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMENT ON TABLE users IS '用户表 - 存储系统注册用户的基本信息';
COMMENT ON COLUMN users.id IS '用户唯一标识符，UUID 类型，自动生成';
COMMENT ON COLUMN users.email IS '用户邮箱，用于登录和接收通知，必须唯一';
COMMENT ON COLUMN users.username IS '用户昵称/显示名称，用于界面展示';
COMMENT ON COLUMN users.password_hash IS '加密后的密码哈希值，不存储明文密码';
COMMENT ON COLUMN users.avatar_url IS '用户头像图片的 URL 地址，可为空';
COMMENT ON COLUMN users.role IS '用户角色：user(普通用户) / admin(管理员)，决定权限范围';
COMMENT ON COLUMN users.status IS '用户状态：active(正常) / suspended(停用) / deleted(已注销)';
COMMENT ON COLUMN users.created_at IS '用户注册时间，自动记录创建时刻';
COMMENT ON COLUMN users.updated_at IS '用户信息最后更新时间，由触发器自动维护';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 2. 密码重置表
-- ==============================================
CREATE TABLE IF NOT EXISTS password_resets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(500) NOT NULL,
  code        VARCHAR(10),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);

COMMENT ON TABLE password_resets IS '密码重置表 - 存储用户找回密码时的临时令牌和验证码';
COMMENT ON COLUMN password_resets.id IS '密码重置记录唯一标识符，UUID 类型';
COMMENT ON COLUMN password_resets.user_id IS '关联的用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN password_resets.token IS '密码重置令牌，用于验证重置链接的有效性';
COMMENT ON COLUMN password_resets.code IS '6 位数字验证码，用于短信或邮件验证';
COMMENT ON COLUMN password_resets.expires_at IS '令牌/验证码过期时间，超时后失效';
COMMENT ON COLUMN password_resets.used_at IS '令牌使用时间，记录何时被使用过';
COMMENT ON COLUMN password_resets.created_at IS '密码重置请求创建时间';
COMMENT ON COLUMN password_resets.updated_at IS '密码重置记录最后更新时间';

DROP TRIGGER IF EXISTS update_password_resets_updated_at ON password_resets;
CREATE TRIGGER update_password_resets_updated_at BEFORE UPDATE ON password_resets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 3. 会话表
-- ==============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS '用户会话表 - 存储用户登录后的会话信息，用于保持登录状态';
COMMENT ON COLUMN user_sessions.id IS '会话记录唯一标识符，UUID 类型';
COMMENT ON COLUMN user_sessions.user_id IS '关联的用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN user_sessions.token_hash IS '会话令牌的哈希值，用于验证登录状态，必须唯一';
COMMENT ON COLUMN user_sessions.expires_at IS '会话过期时间，超时后需要重新登录';
COMMENT ON COLUMN user_sessions.created_at IS '会话创建时间，即用户登录时间';

-- ==============================================
-- 4. 分类表（用户级，注册时预设默认分类）
-- ==============================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,
  icon        VARCHAR(500) NOT NULL DEFAULT '📌',
  type        VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
  is_default  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name_type ON categories(user_id, name, type);

COMMENT ON TABLE categories IS '分类表（用户级，注册时预设默认分类） - 存储用户的收支分类定义';
COMMENT ON COLUMN categories.id IS '分类唯一标识符，UUID 类型';
COMMENT ON COLUMN categories.user_id IS '分类所属用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN categories.name IS '分类名称，如"餐饮"、"交通"、"工资"等';
COMMENT ON COLUMN categories.icon IS '分类图标，使用 Emoji 或自定义图标';
COMMENT ON COLUMN categories.type IS '分类类型：expense(支出) / income(收入)';
COMMENT ON COLUMN categories.is_default IS '是否为系统默认分类，用户注册时自动创建';
COMMENT ON COLUMN categories.sort_order IS '分类排序序号，数值越小越靠前';
COMMENT ON COLUMN categories.created_at IS '分类创建时间';
COMMENT ON COLUMN categories.updated_at IS '分类最后更新时间';

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 5. 账本表
-- ==============================================
CREATE TABLE IF NOT EXISTS books (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  icon        VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_owner_id ON books(owner_id);
CREATE INDEX IF NOT EXISTS idx_books_is_archived ON books(is_archived);

COMMENT ON TABLE books IS '账本表 - 存储用户创建的账本信息，支持多账本管理';
COMMENT ON COLUMN books.id IS '账本唯一标识符，UUID 类型';
COMMENT ON COLUMN books.name IS '账本名称，如"家庭账本"、"旅行基金"等';
COMMENT ON COLUMN books.owner_id IS '账本所有者 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN books.is_archived IS '是否已归档，归档账本不再显示在默认列表中';
COMMENT ON COLUMN books.description IS '账本描述，说明账本用途或备注信息';
COMMENT ON COLUMN books.icon IS '账本图标，用于界面展示';
COMMENT ON COLUMN books.created_at IS '账本创建时间';
COMMENT ON COLUMN books.updated_at IS '账本最后更新时间';

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 6. 账本成员表
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

COMMENT ON TABLE book_members IS '账本成员表 - 存储账本的共享成员信息，支持多人协作记账';
COMMENT ON COLUMN book_members.id IS '成员记录唯一标识符，UUID 类型';
COMMENT ON COLUMN book_members.book_id IS '关联的账本 ID，外键引用 books 表，删除账本时级联删除';
COMMENT ON COLUMN book_members.user_id IS '成员用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN book_members.role IS '成员角色：owner(所有者) / member(普通成员)，决定管理权限';
COMMENT ON COLUMN book_members.joined_at IS '加入账本的时间';

-- ==============================================
-- 7. 交易记录表
-- ==============================================
CREATE TABLE IF NOT EXISTS transactions (
  id            SERIAL PRIMARY KEY,
  amount        DECIMAL(10, 2) NOT NULL,
  category      UUID REFERENCES categories(id) ON DELETE SET NULL,
  type          VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  description   TEXT,
  brand         VARCHAR(100),
  image_url     VARCHAR(500),
  image_urls    TEXT,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id       UUID REFERENCES books(id) ON DELETE SET NULL,
  latitude      DECIMAL(10, 7),
  longitude     DECIMAL(10, 7),
  location_name VARCHAR(200),
  poi_id        VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS image_urls TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions(book_id);
CREATE INDEX IF NOT EXISTS idx_transactions_brand ON transactions(brand);
CREATE INDEX IF NOT EXISTS idx_transactions_location ON transactions(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON TABLE transactions IS '交易记录表 - 存储用户的每一笔收支记录';
COMMENT ON COLUMN transactions.id IS '交易记录自增 ID，主键';
COMMENT ON COLUMN transactions.amount IS '交易金额，精确到小数点后 2 位';
COMMENT ON COLUMN transactions.category IS '关联的分类 ID，外键引用 categories 表，删除分类时设为 NULL';
COMMENT ON COLUMN transactions.type IS '交易类型：income(收入) / expense(支出)';
COMMENT ON COLUMN transactions.date IS '交易发生日期';
COMMENT ON COLUMN transactions.description IS '交易描述/备注，如"午餐 - 川味小馆"';
COMMENT ON COLUMN transactions.image_url IS '交易凭证图片 URL，如收据、发票照片';
COMMENT ON COLUMN transactions.user_id IS '记录所属用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN transactions.book_id IS '所属账本 ID，外键引用 books 表，删除账本时设为 NULL';
COMMENT ON COLUMN transactions.latitude IS '纬度，范围 -90 ~ 90，记录交易发生地点';
COMMENT ON COLUMN transactions.longitude IS '经度，范围 -180 ~ 180，记录交易发生地点';
COMMENT ON COLUMN transactions.location_name IS '地点名称/地址描述，如"美致酒店 (红谷滩万达翠苑路地铁站店)"';
COMMENT ON COLUMN transactions.poi_id IS '高德地图 POI ID，用于地图选点功能';
COMMENT ON COLUMN transactions.created_at IS '记录创建时间';

-- ==============================================
-- 8. 预算表
-- ==============================================
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount      DECIMAL(10, 2) NOT NULL,
  month       DATE NOT NULL,
  book_id     UUID REFERENCES books(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_book_id ON budgets(book_id);

COMMENT ON TABLE budgets IS '预算表 - 存储用户每月各分类的预算设置';
COMMENT ON COLUMN budgets.id IS '预算记录唯一标识符，UUID 类型';
COMMENT ON COLUMN budgets.user_id IS '预算所属用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN budgets.category IS '预算分类 ID，外键引用 categories 表，删除分类时级联删除';
COMMENT ON COLUMN budgets.amount IS '预算金额，该分类每月的预算上限';
COMMENT ON COLUMN budgets.month IS '预算月份，格式为月初日期 (如 2026-06-01 表示 2026 年 6 月)';
COMMENT ON COLUMN budgets.book_id IS '所属账本 ID，外键引用 books 表，删除账本时设为 NULL';
COMMENT ON COLUMN budgets.created_at IS '预算设置创建时间';
COMMENT ON COLUMN budgets.updated_at IS '预算设置最后更新时间';

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 9. 交易模板表（快捷记账）
-- ==============================================
CREATE TABLE IF NOT EXISTS transaction_templates (
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
);

CREATE INDEX IF NOT EXISTS idx_transaction_templates_user_id ON transaction_templates(user_id);

COMMENT ON TABLE transaction_templates IS '交易模板表（快捷记账） - 存储用户预设的记账模板，支持一键填充表单';
COMMENT ON COLUMN transaction_templates.id IS '模板唯一标识符，UUID 类型';
COMMENT ON COLUMN transaction_templates.user_id IS '模板所属用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN transaction_templates.name IS '模板名称，如"源溜小区 131 栋吃饭消费模版"';
COMMENT ON COLUMN transaction_templates.type IS '交易类型：expense(支出) / income(收入)';
COMMENT ON COLUMN transaction_templates.amount IS '预设金额，可为空，由用户选择后填写';
COMMENT ON COLUMN transaction_templates.category_id IS '关联的分类 ID，外键引用 categories 表，删除分类时设为 NULL';
COMMENT ON COLUMN transaction_templates.note IS '预设备注，如"吃饭消费"、"缴纳电费"';
COMMENT ON COLUMN transaction_templates.latitude IS '纬度，模板关联的位置信息';
COMMENT ON COLUMN transaction_templates.longitude IS '经度，模板关联的位置信息';
COMMENT ON COLUMN transaction_templates.location_name IS '地点名称，模板关联的地址描述';
COMMENT ON COLUMN transaction_templates.poi_id IS '高德地图 POI ID，模板关联的地点标识';
COMMENT ON COLUMN transaction_templates.merchant_name IS '商户名称，如餐厅名、店铺名';
COMMENT ON COLUMN transaction_templates.book_id IS '所属账本 ID，外键引用 books 表，删除账本时设为 NULL';
COMMENT ON COLUMN transaction_templates.sort_order IS '模板排序序号，数值越小越靠前';
COMMENT ON COLUMN transaction_templates.created_at IS '模板创建时间';

-- ==============================================
-- 10. 成员位置共享表
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

CREATE INDEX IF NOT EXISTS idx_member_locations_book_id ON member_locations(book_id)
  WHERE is_sharing = true;

COMMENT ON TABLE member_locations IS '成员位置共享表 - 存储账本成员的实时位置信息，支持家庭成员位置共享';
COMMENT ON COLUMN member_locations.id IS '位置记录唯一标识符，UUID 类型';
COMMENT ON COLUMN member_locations.book_id IS '关联的账本 ID，外键引用 books 表，删除账本时级联删除';
COMMENT ON COLUMN member_locations.user_id IS '成员用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN member_locations.latitude IS '纬度，范围 -90 ~ 90，成员当前位置';
COMMENT ON COLUMN member_locations.longitude IS '经度，范围 -180 ~ 180，成员当前位置';
COMMENT ON COLUMN member_locations.is_sharing IS '是否正在共享位置，关闭时保留最后位置但不可见';
COMMENT ON COLUMN member_locations.updated_at IS '位置最后更新时间';

-- ==============================================
-- 11. 账本邀请码表
-- ==============================================
CREATE TABLE IF NOT EXISTS book_invitations (
  id          BIGSERIAL PRIMARY KEY,
  book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  code        VARCHAR(32) NOT NULL UNIQUE,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_invitations_code ON book_invitations(code);
CREATE INDEX IF NOT EXISTS idx_book_invitations_book_id ON book_invitations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_invitations_active ON book_invitations(code, expires_at, used_at);

COMMENT ON TABLE book_invitations IS '账本邀请码表 - 存储账本邀请码，支持他人通过邀请码加入账本';
COMMENT ON COLUMN book_invitations.id IS '邀请记录唯一自增 ID';
COMMENT ON COLUMN book_invitations.book_id IS '关联的账本 ID，外键引用 books 表';
COMMENT ON COLUMN book_invitations.code IS '邀请码，6 位大写字母+数字，全局唯一';
COMMENT ON COLUMN book_invitations.created_by IS '邀请码创建者用户 ID，外键引用 users 表';
COMMENT ON COLUMN book_invitations.used_by IS '使用邀请码加入的用户 ID，可为空';
COMMENT ON COLUMN book_invitations.expires_at IS '邀请码过期时间';
COMMENT ON COLUMN book_invitations.used_at IS '邀请码使用时间，NULL 表示未使用';
COMMENT ON COLUMN book_invitations.created_at IS '邀请码创建时间';

-- ==============================================
-- 12. 自定义图标表
-- ==============================================
CREATE TABLE IF NOT EXISTS custom_icons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  icon_url    TEXT NOT NULL,
  icon_type   VARCHAR(20) NOT NULL CHECK (icon_type IN ('category', 'book')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_icons_user_id ON custom_icons(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_icons_type ON custom_icons(icon_type);

COMMENT ON TABLE custom_icons IS '自定义图标表 - 存储用户上传的自定义图标，支持分类和账本使用';
COMMENT ON COLUMN custom_icons.id IS '图标记录唯一标识符，UUID 类型';
COMMENT ON COLUMN custom_icons.user_id IS '图标所属用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN custom_icons.icon_url IS '图标文件的 URL 地址，存储在 Supabase Storage 中';
COMMENT ON COLUMN custom_icons.icon_type IS '图标类型：category(分类图标) / book(账本图标)，用于区分用途';
COMMENT ON COLUMN custom_icons.created_at IS '图标上传时间';

-- 启用 RLS
ALTER TABLE custom_icons ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的图标
CREATE POLICY "Users can view their own icons" ON custom_icons
  FOR SELECT USING (auth.uid() = user_id);

-- RLS 策略：用户只能插入自己的图标
CREATE POLICY "Users can insert their own icons" ON custom_icons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户只能删除自己的图标
CREATE POLICY "Users can delete their own icons" ON custom_icons
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- 字段长度调整（用于已存在表的结构更新）
-- ==============================================
-- 将 categories 和 books 表的 icon 字段从 VARCHAR(50) 扩展到 VARCHAR(500)
-- 以支持自定义图标 URL 的存储
ALTER TABLE IF EXISTS categories ALTER COLUMN icon TYPE VARCHAR(500);
ALTER TABLE IF EXISTS books ALTER COLUMN icon TYPE VARCHAR(500);
