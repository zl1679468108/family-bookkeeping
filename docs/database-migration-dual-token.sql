-- ============================================================
-- 双 Token 认证迁移脚本（2026-07-08）
-- 作用：jj_user_sessions 增加 refresh 令牌列，并修正 session 清理/限数函数
-- 执行位置：Supabase Dashboard → SQL Editor
-- 幂等：可重复执行，不会报错或丢失数据
-- 影响：无 ORM，需手动执行；执行后请同步 docs/database-init.sql（已更新）
--
-- 注意：老会话（无 refresh_token_hash）仍可凭 access 使用至 expires_at，
--       access 过期后 401 → 客户端用 refresh 刷新；若老会话无 refresh 则回退重登。
-- ============================================================

-- 1) 新增 refresh 令牌列（nullable，兼容老行）
ALTER TABLE jj_user_sessions
  ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS refresh_expires_at TIMESTAMPTZ;

-- 2) refresh 索引（加速 /auth/refresh 查询）
CREATE INDEX IF NOT EXISTS idx_jj_user_sessions_refresh_token_hash
  ON jj_user_sessions(refresh_token_hash);

-- 3) 清理函数：按 refresh 真正过期才删除（避免 access 过期即删导致 refresh 孤儿）
CREATE OR REPLACE FUNCTION fn_cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM jj_user_sessions
  WHERE COALESCE(refresh_expires_at, expires_at) < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 4) 限数函数：活跃判定改用 COALESCE(refresh_expires_at, expires_at)
CREATE OR REPLACE FUNCTION fn_limit_user_sessions(p_user_id UUID, p_max_count INTEGER DEFAULT 5)
RETURNS VOID AS $$
BEGIN
  WITH to_delete AS (
    SELECT id
    FROM jj_user_sessions
    WHERE user_id = p_user_id
      AND COALESCE(refresh_expires_at, expires_at) > NOW()
    ORDER BY created_at ASC
    LIMIT GREATEST(0, (SELECT COUNT(*) FROM jj_user_sessions WHERE user_id = p_user_id AND COALESCE(refresh_expires_at, expires_at) > NOW()) - p_max_count)
  )
  DELETE FROM jj_user_sessions WHERE id IN (SELECT id FROM to_delete);
END;
$$ LANGUAGE plpgsql;

-- 5) 补注释
COMMENT ON COLUMN jj_user_sessions.refresh_token_hash IS '刷新令牌(refresh)的哈希值，仅用于 /auth/refresh 换发新的 access；可为 NULL（老会话无 refresh）';
COMMENT ON COLUMN jj_user_sessions.refresh_expires_at IS '刷新令牌过期时间，真正决定会话是否仍有效';
