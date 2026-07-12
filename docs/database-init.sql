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
CREATE TABLE IF NOT EXISTS jj_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  username    VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url  TEXT,
  role        VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  current_book_id UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jj_users_email ON jj_users(email);

COMMENT ON TABLE jj_users IS '用户表 - 存储系统注册用户的基本信息';
COMMENT ON COLUMN jj_users.id IS '用户唯一标识符，UUID 类型，自动生成';
COMMENT ON COLUMN jj_users.email IS '用户邮箱，用于登录和接收通知，必须唯一';
COMMENT ON COLUMN jj_users.username IS '用户昵称/显示名称，用于界面展示';
COMMENT ON COLUMN jj_users.password_hash IS '加密后的密码哈希值，不存储明文密码';
COMMENT ON COLUMN jj_users.avatar_url IS '用户头像图片的 URL 地址，可为空';
COMMENT ON COLUMN jj_users.role IS '用户角色：user(普通用户) / admin(管理员)，决定权限范围';
COMMENT ON COLUMN jj_users.status IS '用户状态：active(正常) / suspended(停用) / deleted(已注销)';
COMMENT ON COLUMN jj_users.created_at IS '用户注册时间，自动记录创建时刻';
COMMENT ON COLUMN jj_users.updated_at IS '用户信息最后更新时间，由触发器自动维护';

DROP TRIGGER IF EXISTS update_jj_users_updated_at ON jj_users;
CREATE TRIGGER update_jj_users_updated_at BEFORE UPDATE ON jj_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 2. 密码重置表
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_password_resets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES jj_users(id) ON DELETE CASCADE,
  token       VARCHAR(500) NOT NULL,
  code        VARCHAR(10),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jj_password_resets_token ON jj_password_resets(token);
CREATE INDEX IF NOT EXISTS idx_jj_password_resets_user_id ON jj_password_resets(user_id);

COMMENT ON TABLE jj_password_resets IS '密码重置表 - 存储用户找回密码时的临时令牌和验证码';
COMMENT ON COLUMN jj_password_resets.id IS '密码重置记录唯一标识符，UUID 类型';
COMMENT ON COLUMN jj_password_resets.user_id IS '关联的用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN jj_password_resets.token IS '密码重置令牌，用于验证重置链接的有效性';
COMMENT ON COLUMN jj_password_resets.code IS '6 位数字验证码，用于短信或邮件验证';
COMMENT ON COLUMN jj_password_resets.expires_at IS '令牌/验证码过期时间，超时后失效';
COMMENT ON COLUMN jj_password_resets.used_at IS '令牌使用时间，记录何时被使用过';
COMMENT ON COLUMN jj_password_resets.created_at IS '密码重置请求创建时间';
COMMENT ON COLUMN jj_password_resets.updated_at IS '密码重置记录最后更新时间';

DROP TRIGGER IF EXISTS update_jj_password_resets_updated_at ON jj_password_resets;
CREATE TRIGGER update_jj_password_resets_updated_at BEFORE UPDATE ON jj_password_resets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 3. 会话表
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_user_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES jj_users(id) ON DELETE CASCADE,
  token_hash         VARCHAR(255) UNIQUE NOT NULL,
  expires_at         TIMESTAMPTZ NOT NULL,
  -- 双 Token：refresh_token_hash 为长令牌（仅用于 /auth/refresh 换发 access），可为 NULL 以兼容老会话
  refresh_token_hash VARCHAR(255) UNIQUE,
  refresh_expires_at TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jj_user_sessions_token_hash ON jj_user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_jj_user_sessions_refresh_token_hash ON jj_user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_jj_user_sessions_user_id ON jj_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_jj_user_sessions_expires_at ON jj_user_sessions(expires_at);

COMMENT ON TABLE jj_user_sessions IS '用户会话表 - 存储用户登录后的会话信息（access + refresh 双令牌），用于保持登录状态';
COMMENT ON COLUMN jj_user_sessions.id IS '会话记录唯一标识符，UUID 类型';
COMMENT ON COLUMN jj_user_sessions.user_id IS '关联的用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN jj_user_sessions.token_hash IS '访问令牌(access)的哈希值，用于验证登录状态，必须唯一';
COMMENT ON COLUMN jj_user_sessions.expires_at IS '访问令牌过期时间，超时后需要刷新，而不是直接重登';
COMMENT ON COLUMN jj_user_sessions.refresh_token_hash IS '刷新令牌(refresh)的哈希值，仅用于 /auth/refresh 换发新的 access；可为 NULL（老会话无 refresh）';
COMMENT ON COLUMN jj_user_sessions.refresh_expires_at IS '刷新令牌过期时间，真正决定会话是否仍有效';
COMMENT ON COLUMN jj_user_sessions.created_at IS '会话创建时间，即用户登录时间';

-- ==============================================
-- 4. 分类表（用户级，注册时预设默认分类）
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES jj_users(id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,
  icon        VARCHAR(500) NOT NULL DEFAULT '📌',
  type        VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
  is_default  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jj_categories_user_id ON jj_categories(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jj_categories_user_name_type ON jj_categories(user_id, name, type);

COMMENT ON TABLE jj_categories IS '分类表（用户级，注册时预设默认分类） - 存储用户的收支分类定义';
COMMENT ON COLUMN jj_categories.id IS '分类唯一标识符，UUID 类型';
COMMENT ON COLUMN jj_categories.user_id IS '分类所属用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN jj_categories.name IS '分类名称，如"餐饮"、"交通"、"工资"等';
COMMENT ON COLUMN jj_categories.icon IS '分类图标，使用 Emoji 或自定义图标';
COMMENT ON COLUMN jj_categories.type IS '分类类型：expense(支出) / income(收入)';
COMMENT ON COLUMN jj_categories.is_default IS '是否为系统默认分类，用户注册时自动创建';
COMMENT ON COLUMN jj_categories.sort_order IS '分类排序序号，数值越小越靠前';
COMMENT ON COLUMN jj_categories.created_at IS '分类创建时间';
COMMENT ON COLUMN jj_categories.updated_at IS '分类最后更新时间';

DROP TRIGGER IF EXISTS update_jj_categories_updated_at ON jj_categories;
CREATE TRIGGER update_jj_categories_updated_at BEFORE UPDATE ON jj_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 5. 账本表
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_books (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  owner_id    UUID NOT NULL REFERENCES jj_users(id) ON DELETE CASCADE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  icon        VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jj_books_owner_id ON jj_books(owner_id);
CREATE INDEX IF NOT EXISTS idx_jj_books_is_archived ON jj_books(is_archived);

COMMENT ON TABLE jj_books IS '账本表 - 存储用户创建的账本信息，支持多账本管理';
COMMENT ON COLUMN jj_books.id IS '账本唯一标识符，UUID 类型';
COMMENT ON COLUMN jj_books.name IS '账本名称，如"家庭账本"、"旅行基金"等';
COMMENT ON COLUMN jj_books.owner_id IS '账本所有者 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN jj_books.is_archived IS '是否已归档，归档账本不再显示在默认列表中';
COMMENT ON COLUMN jj_books.description IS '账本描述，说明账本用途或备注信息';
COMMENT ON COLUMN jj_books.icon IS '账本图标，用于界面展示';
COMMENT ON COLUMN jj_books.created_at IS '账本创建时间';
COMMENT ON COLUMN jj_books.updated_at IS '账本最后更新时间';

DROP TRIGGER IF EXISTS update_jj_books_updated_at ON jj_books;
CREATE TRIGGER update_jj_books_updated_at BEFORE UPDATE ON jj_books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 6. 账本成员表
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_book_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     UUID NOT NULL REFERENCES jj_books(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES jj_users(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_jj_book_members_book_id ON jj_book_members(book_id);
CREATE INDEX IF NOT EXISTS idx_jj_book_members_user_id ON jj_book_members(user_id);

COMMENT ON TABLE jj_book_members IS '账本成员表 - 存储账本的共享成员信息，支持多人协作记账';
COMMENT ON COLUMN jj_book_members.id IS '成员记录唯一标识符，UUID 类型';
COMMENT ON COLUMN jj_book_members.book_id IS '关联的账本 ID，外键引用 books 表，删除账本时级联删除';
COMMENT ON COLUMN jj_book_members.user_id IS '成员用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN jj_book_members.role IS '成员角色：owner(所有者) / member(普通成员)，决定管理权限';
COMMENT ON COLUMN jj_book_members.joined_at IS '加入账本的时间';

-- ==============================================
-- 7. 交易记录表
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_transactions (
  id            SERIAL PRIMARY KEY,
  amount        DECIMAL(10, 2) NOT NULL,
  category      UUID REFERENCES jj_categories(id) ON DELETE SET NULL,
  type          VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  description   TEXT,
  brand         VARCHAR(100),
  image_url     VARCHAR(500),
  image_urls    TEXT,
  user_id       UUID REFERENCES jj_users(id) ON DELETE CASCADE,
  book_id       UUID REFERENCES jj_books(id) ON DELETE SET NULL,
  latitude      DECIMAL(10, 7),
  longitude     DECIMAL(10, 7),
  location_name VARCHAR(200),
  poi_id        VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE jj_transactions ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE jj_transactions ADD COLUMN IF NOT EXISTS image_urls TEXT;

CREATE INDEX IF NOT EXISTS idx_jj_transactions_user_id ON jj_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_jj_transactions_date ON jj_transactions(date);
CREATE INDEX IF NOT EXISTS idx_jj_transactions_type ON jj_transactions(type);
CREATE INDEX IF NOT EXISTS idx_jj_transactions_category ON jj_transactions(category);
CREATE INDEX IF NOT EXISTS idx_jj_transactions_book_id ON jj_transactions(book_id);
CREATE INDEX IF NOT EXISTS idx_jj_transactions_brand ON jj_transactions(brand);
CREATE INDEX IF NOT EXISTS idx_jj_transactions_location ON jj_transactions(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON TABLE jj_transactions IS '交易记录表 - 存储用户的每一笔收支记录';
COMMENT ON COLUMN jj_transactions.id IS '交易记录自增 ID，主键';
COMMENT ON COLUMN jj_transactions.amount IS '交易金额，精确到小数点后 2 位';
COMMENT ON COLUMN jj_transactions.category IS '关联的分类 ID，外键引用 categories 表，删除分类时设为 NULL';
COMMENT ON COLUMN jj_transactions.type IS '交易类型：income(收入) / expense(支出)';
COMMENT ON COLUMN jj_transactions.date IS '交易发生日期';
COMMENT ON COLUMN jj_transactions.description IS '交易描述/备注，如"午餐 - 川味小馆"';
COMMENT ON COLUMN jj_transactions.image_url IS '交易凭证图片 URL，如收据、发票照片';
COMMENT ON COLUMN jj_transactions.user_id IS '记录所属用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN jj_transactions.book_id IS '所属账本 ID，外键引用 books 表，删除账本时设为 NULL';
COMMENT ON COLUMN jj_transactions.latitude IS '纬度，范围 -90 ~ 90，记录交易发生地点';
COMMENT ON COLUMN jj_transactions.longitude IS '经度，范围 -180 ~ 180，记录交易发生地点';
COMMENT ON COLUMN jj_transactions.location_name IS '地点名称/地址描述，如"美致酒店 (红谷滩万达翠苑路地铁站店)"';
COMMENT ON COLUMN jj_transactions.poi_id IS '高德地图 POI ID，用于地图选点功能';
COMMENT ON COLUMN jj_transactions.created_at IS '记录创建时间';

-- ==============================================
-- 8. 预算表
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES jj_users(id) ON DELETE CASCADE,
  category    UUID NOT NULL REFERENCES jj_categories(id) ON DELETE CASCADE,
  amount      DECIMAL(10, 2) NOT NULL,
  month       DATE NOT NULL,
  book_id     UUID REFERENCES jj_books(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id, category, month)
);

CREATE INDEX IF NOT EXISTS idx_jj_budgets_user_id ON jj_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_jj_budgets_user_month ON jj_budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_jj_budgets_book_id ON jj_budgets(book_id);

COMMENT ON TABLE jj_budgets IS '预算表 - 存储用户每月各分类的预算设置';
COMMENT ON COLUMN jj_budgets.id IS '预算记录唯一标识符，UUID 类型';
COMMENT ON COLUMN jj_budgets.user_id IS '预算所属用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN jj_budgets.category IS '预算分类 ID，外键引用 categories 表，删除分类时级联删除';
COMMENT ON COLUMN jj_budgets.amount IS '预算金额，该分类每月的预算上限';
COMMENT ON COLUMN jj_budgets.month IS '预算月份，格式为月初日期 (如 2026-06-01 表示 2026 年 6 月)';
COMMENT ON COLUMN jj_budgets.book_id IS '所属账本 ID，外键引用 books 表，删除账本时设为 NULL';
COMMENT ON COLUMN jj_budgets.created_at IS '预算设置创建时间';
COMMENT ON COLUMN jj_budgets.updated_at IS '预算设置最后更新时间';

DROP TRIGGER IF EXISTS update_jj_budgets_updated_at ON jj_budgets;
CREATE TRIGGER update_jj_budgets_updated_at BEFORE UPDATE ON jj_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 9. 交易模板表（快捷记账）
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_transaction_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES jj_users(id) ON DELETE CASCADE,
  name          VARCHAR(50) NOT NULL,
  type          VARCHAR(10) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
  amount        NUMERIC(12, 2),
  category_id   UUID REFERENCES jj_categories(id) ON DELETE SET NULL,
  note          VARCHAR(200),
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  location_name VARCHAR(100),
  poi_id        VARCHAR(100),
  merchant_name VARCHAR(100),
  book_id       UUID REFERENCES jj_books(id) ON DELETE SET NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jj_transaction_templates_user_id ON jj_transaction_templates(user_id);

COMMENT ON TABLE jj_transaction_templates IS '交易模板表（快捷记账） - 存储用户预设的记账模板，支持一键填充表单';
COMMENT ON COLUMN jj_transaction_templates.id IS '模板唯一标识符，UUID 类型';
COMMENT ON COLUMN jj_transaction_templates.user_id IS '模板所属用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN jj_transaction_templates.name IS '模板名称，如"源溜小区 131 栋吃饭消费模版"';
COMMENT ON COLUMN jj_transaction_templates.type IS '交易类型：expense(支出) / income(收入)';
COMMENT ON COLUMN jj_transaction_templates.amount IS '预设金额，可为空，由用户选择后填写';
COMMENT ON COLUMN jj_transaction_templates.category_id IS '关联的分类 ID，外键引用 categories 表，删除分类时设为 NULL';
COMMENT ON COLUMN jj_transaction_templates.note IS '预设备注，如"吃饭消费"、"缴纳电费"';
COMMENT ON COLUMN jj_transaction_templates.latitude IS '纬度，模板关联的位置信息';
COMMENT ON COLUMN jj_transaction_templates.longitude IS '经度，模板关联的位置信息';
COMMENT ON COLUMN jj_transaction_templates.location_name IS '地点名称，模板关联的地址描述';
COMMENT ON COLUMN jj_transaction_templates.poi_id IS '高德地图 POI ID，模板关联的地点标识';
COMMENT ON COLUMN jj_transaction_templates.merchant_name IS '商户名称，如餐厅名、店铺名';
COMMENT ON COLUMN jj_transaction_templates.book_id IS '所属账本 ID，外键引用 books 表，删除账本时设为 NULL';
COMMENT ON COLUMN jj_transaction_templates.sort_order IS '模板排序序号，数值越小越靠前';
COMMENT ON COLUMN jj_transaction_templates.created_at IS '模板创建时间';

-- ==============================================
-- 10. 成员位置共享表
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_member_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     UUID NOT NULL REFERENCES jj_books(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES jj_users(id) ON DELETE CASCADE,
  latitude    DECIMAL(10, 7) NOT NULL,
  longitude   DECIMAL(10, 7) NOT NULL,
  is_sharing  BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_jj_member_locations_book_id ON jj_member_locations(book_id)
  WHERE is_sharing = true;

COMMENT ON TABLE jj_member_locations IS '成员位置共享表 - 存储账本成员的实时位置信息，支持家庭成员位置共享';
COMMENT ON COLUMN jj_member_locations.id IS '位置记录唯一标识符，UUID 类型';
COMMENT ON COLUMN jj_member_locations.book_id IS '关联的账本 ID，外键引用 books 表，删除账本时级联删除';
COMMENT ON COLUMN jj_member_locations.user_id IS '成员用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN jj_member_locations.latitude IS '纬度，范围 -90 ~ 90，成员当前位置';
COMMENT ON COLUMN jj_member_locations.longitude IS '经度，范围 -180 ~ 180，成员当前位置';
COMMENT ON COLUMN jj_member_locations.is_sharing IS '是否正在共享位置，关闭时保留最后位置但不可见';
COMMENT ON COLUMN jj_member_locations.updated_at IS '位置最后更新时间';

DROP TRIGGER IF EXISTS trigger_jj_member_locations_updated_at ON jj_member_locations;
CREATE TRIGGER trigger_jj_member_locations_updated_at BEFORE UPDATE ON jj_member_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 11. 账本邀请码表
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_book_invitations (
  id          BIGSERIAL PRIMARY KEY,
  book_id     UUID NOT NULL REFERENCES jj_books(id) ON DELETE CASCADE,
  code        VARCHAR(32) NOT NULL UNIQUE,
  created_by  UUID NOT NULL REFERENCES jj_users(id) ON DELETE CASCADE,
  used_by     UUID REFERENCES jj_users(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jj_book_invitations_code ON jj_book_invitations(code);
CREATE INDEX IF NOT EXISTS idx_jj_book_invitations_book_id ON jj_book_invitations(book_id);
CREATE INDEX IF NOT EXISTS idx_jj_book_invitations_active ON jj_book_invitations(code, expires_at, used_at);

COMMENT ON TABLE jj_book_invitations IS '账本邀请码表 - 存储账本邀请码，支持他人通过邀请码加入账本';
COMMENT ON COLUMN jj_book_invitations.id IS '邀请记录唯一自增 ID';
COMMENT ON COLUMN jj_book_invitations.book_id IS '关联的账本 ID，外键引用 books 表';
COMMENT ON COLUMN jj_book_invitations.code IS '邀请码，6 位大写字母+数字，全局唯一';
COMMENT ON COLUMN jj_book_invitations.created_by IS '邀请码创建者用户 ID，外键引用 users 表';
COMMENT ON COLUMN jj_book_invitations.used_by IS '使用邀请码加入的用户 ID，可为空';
COMMENT ON COLUMN jj_book_invitations.expires_at IS '邀请码过期时间';
COMMENT ON COLUMN jj_book_invitations.used_at IS '邀请码使用时间，NULL 表示未使用';
COMMENT ON COLUMN jj_book_invitations.created_at IS '邀请码创建时间';

-- ==============================================
-- 12. 自定义图标表
-- ==============================================
CREATE TABLE IF NOT EXISTS jj_custom_icons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES jj_users(id) ON DELETE CASCADE,
  icon_url    TEXT NOT NULL,
  icon_type   VARCHAR(20) NOT NULL CHECK (icon_type IN ('category', 'book', 'avatar')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jj_custom_icons_user_id ON jj_custom_icons(user_id);
CREATE INDEX IF NOT EXISTS idx_jj_custom_icons_type ON jj_custom_icons(icon_type);

COMMENT ON TABLE jj_custom_icons IS '自定义图标表 - 存储用户上传的自定义图标，支持分类和账本使用';
COMMENT ON COLUMN jj_custom_icons.id IS '图标记录唯一标识符，UUID 类型';
COMMENT ON COLUMN jj_custom_icons.user_id IS '图标所属用户 ID，外键引用 users 表，删除用户时级联删除';
COMMENT ON COLUMN jj_custom_icons.icon_url IS '图标文件的 URL 地址，存储在 Supabase Storage 中';
COMMENT ON COLUMN jj_custom_icons.icon_type IS '图标类型：category(分类图标) / book(账本图标) / avatar(用户头像)，用于区分用途';
COMMENT ON COLUMN jj_custom_icons.created_at IS '图标上传时间';

-- 启用 RLS
ALTER TABLE jj_custom_icons ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的图标
CREATE POLICY "Users can view their own icons" ON jj_custom_icons
  FOR SELECT USING (auth.uid() = user_id);

-- RLS 策略：用户只能插入自己的图标
CREATE POLICY "Users can insert their own icons" ON jj_custom_icons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户只能删除自己的图标
CREATE POLICY "Users can delete their own icons" ON jj_custom_icons
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- 字段长度调整（用于已存在表的结构更新）
-- ==============================================
-- 将 jj_categories 和 jj_books 表的 icon 字段从 VARCHAR(50) 扩展到 VARCHAR(500)
-- 以支持自定义图标 URL 的存储
ALTER TABLE IF EXISTS jj_categories ALTER COLUMN icon TYPE VARCHAR(500);
ALTER TABLE IF EXISTS jj_books ALTER COLUMN icon TYPE VARCHAR(500);

-- ==============================================
-- T-M17: 密码重置验证码防暴力破解 — 增加 failed_attempts 列
-- ==============================================
ALTER TABLE IF EXISTS jj_password_resets ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;

-- ==============================================
-- T-H2: 管理员统计 — 月度交易总额数据库侧聚合 RPC
-- 替代原全量拉取到 JS 中 reduce 的做法
-- ==============================================
CREATE OR REPLACE FUNCTION fn_monthly_transaction_totals(p_year INTEGER, p_month INTEGER)
RETURNS TABLE (
  income DECIMAL,
  expense DECIMAL,
  net DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::DECIMAL,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::DECIMAL,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::DECIMAL
  FROM jj_transactions t
  WHERE EXTRACT(YEAR FROM t.created_at) = p_year
    AND EXTRACT(MONTH FROM t.created_at) = p_month;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- T-M3: 账本列表交易计数 — 按 book_id 分组计数的 RPC
-- 替代全量拉取交易行在本地计数
-- ==============================================
CREATE OR REPLACE FUNCTION fn_book_txn_counts(p_book_ids UUID[])
RETURNS TABLE (book_id UUID, txn_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT book_id, COUNT(*)::BIGINT AS txn_count
  FROM jj_transactions
  WHERE book_id = ANY(p_book_ids)
  GROUP BY book_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- T-L8: Session 管理 — 按用户限制最大活跃 session 数 + 自动清理过期
-- ==============================================

-- 创建函数：清理过期 session
CREATE OR REPLACE FUNCTION fn_cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 双 Token：按 refresh 真正过期才清理，避免 access 过期即删导致 refresh 孤儿
  DELETE FROM jj_user_sessions
  WHERE COALESCE(refresh_expires_at, expires_at) < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：限制用户最大 session 数量（保留最新的 N 个）
CREATE OR REPLACE FUNCTION fn_limit_user_sessions(p_user_id UUID, p_max_count INTEGER DEFAULT 5)
RETURNS VOID AS $$
BEGIN
  WITH to_delete AS (
    SELECT id
    FROM jj_user_sessions
    WHERE user_id = p_user_id
      -- 双 Token：活跃 = refresh 未过期（fallback 到 access 过期，兼容老会话）
      AND COALESCE(refresh_expires_at, expires_at) > NOW()
    ORDER BY created_at ASC
    LIMIT GREATEST(0, (SELECT COUNT(*) FROM jj_user_sessions WHERE user_id = p_user_id AND COALESCE(refresh_expires_at, expires_at) > NOW()) - p_max_count)
  )
  DELETE FROM jj_user_sessions WHERE id IN (SELECT id FROM to_delete);
END;
$$ LANGUAGE plpgsql;

-- 创建定时清理索引（加速过期 session 查询）
CREATE INDEX IF NOT EXISTS idx_jj_user_sessions_expired
  ON jj_user_sessions(expires_at)
  WHERE expires_at < NOW();
