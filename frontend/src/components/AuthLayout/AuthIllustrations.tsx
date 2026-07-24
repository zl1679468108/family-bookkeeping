import React from 'react'

/**
 * 登录页插画 — 存钱罐+金币+账本+图表上升箭头
 * 严格对齐 design-auth-pages.html 中的 SVG
 */
export const LoginIllustration: React.FC = () => (
  <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 大圆背景 */}
    <circle cx="160" cy="140" r="130" fill="var(--on-pr)" opacity="0.12" />
    <circle cx="160" cy="140" r="100" fill="var(--on-pr)" opacity="0.08" />
    {/* 存钱罐 */}
    <rect x="110" y="130" width="70" height="60" rx="14" fill="var(--on-pr)" opacity="0.9" />
    <rect x="130" y="118" width="30" height="16" rx="4" fill="var(--on-pr)" opacity="0.7" />
    <circle cx="155" cy="140" r="4" fill="var(--prD)" opacity="0.5" />
    {/* 金币 */}
    <circle cx="140" cy="165" r="10" fill="var(--warn)" opacity="0.9" />
    <text x="136" y="169" fontSize="10" fill="var(--prD)" fontWeight="700">¥</text>
    <circle cx="170" cy="175" r="10" fill="var(--warn)" opacity="0.9" />
    <text x="166" y="179" fontSize="10" fill="var(--prD)" fontWeight="700">¥</text>
    <circle cx="155" cy="185" r="10" fill="var(--warn)" opacity="0.9" />
    <text x="151" y="189" fontSize="10" fill="var(--prD)" fontWeight="700">¥</text>
    <circle cx="125" cy="178" r="8" fill="var(--warn)" opacity="0.7" />
    <text x="121" y="182" fontSize="8" fill="var(--prD)" fontWeight="700">¢</text>
    {/* 账本 */}
    <rect x="200" y="120" width="50" height="65" rx="5" fill="var(--on-pr)" opacity="0.85" />
    <rect x="210" y="128" width="30" height="4" rx="2" fill="var(--prD)" opacity="0.4" />
    <rect x="210" y="138" width="30" height="4" rx="2" fill="var(--prD)" opacity="0.4" />
    <rect x="210" y="148" width="20" height="4" rx="2" fill="var(--prD)" opacity="0.4" />
    <rect x="210" y="158" width="25" height="4" rx="2" fill="var(--prD)" opacity="0.3" />
    {/* 图表上升箭头 */}
    <polyline
      points="80,110 100,90 120,95 140,75"
      stroke="var(--on-pr)"
      strokeWidth="2.5"
      fill="none"
      opacity="0.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line x1="80" y1="110" x2="80" y2="110" stroke="var(--on-pr)" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
  </svg>
)

/**
 * 注册页插画 — 打开的书+笔+加号+金币+图表条
 * 严格对齐 design-auth-pages.html 中的 SVG
 */
export const RegisterIllustration: React.FC = () => (
  <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 大圆背景 */}
    <circle cx="160" cy="140" r="130" fill="var(--on-pr)" opacity="0.12" />
    {/* 打开的书/账本 */}
    <path d="M100,120 Q160,100 220,120 L220,200 Q160,180 100,200 Z" fill="var(--on-pr)" opacity="0.85" />
    <path d="M100,120 L100,200 Q160,180 220,200" stroke="var(--on-pr)" strokeWidth="1" fill="none" opacity="0.4" />
    {/* 书页文字 — 使用 var(--prD) 匹配设计稿 */}
    <line x1="120" y1="140" x2="200" y2="138" stroke="var(--prD)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
    <line x1="120" y1="152" x2="190" y2="150" stroke="var(--prD)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
    <line x1="120" y1="164" x2="180" y2="162" stroke="var(--prD)" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
    {/* 笔 */}
    <line x1="225" y1="108" x2="240" y2="90" stroke="var(--on-pr)" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
    <circle cx="243" cy="86" r="4" fill="var(--on-pr)" opacity="0.9" />
    {/* + 号 */}
    <circle cx="180" cy="88" r="22" fill="var(--on-pr)" opacity="0.15" />
    <line x1="180" y1="78" x2="180" y2="98" stroke="var(--on-pr)" strokeWidth="3" strokeLinecap="round" />
    <line x1="170" y1="88" x2="190" y2="88" stroke="var(--on-pr)" strokeWidth="3" strokeLinecap="round" />
    {/* 浮动金币 */}
    <circle cx="110" cy="85" r="9" fill="var(--warn)" opacity="0.8" />
    <circle cx="240" cy="140" r="7" fill="var(--warn)" opacity="0.6" />
    {/* 图表条 */}
    <rect x="250" y="165" width="10" height="25" rx="2" fill="var(--on-pr)" opacity="0.3" />
    <rect x="265" y="150" width="10" height="40" rx="2" fill="var(--on-pr)" opacity="0.45" />
    <rect x="280" y="175" width="10" height="15" rx="2" fill="var(--on-pr)" opacity="0.25" />
  </svg>
)

/**
 * 忘记密码插画 — 锁+钥匙+邮件+虚线连接
 * 严格对齐 design-auth-pages.html 中的 SVG
 */
export const ForgotIllustration: React.FC = () => (
  <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 大圆背景 */}
    <circle cx="160" cy="140" r="130" fill="var(--on-pr)" opacity="0.12" />
    {/* 锁 */}
    <rect x="130" y="155" width="60" height="45" rx="8" fill="var(--on-pr)" opacity="0.9" />
    <path
      d="M140,155 L140,135 Q140,110 160,110 Q180,110 180,135 L180,155"
      stroke="var(--on-pr)"
      strokeWidth="4"
      fill="none"
      opacity="0.8"
      strokeLinecap="round"
    />
    <circle cx="160" cy="175" r="6" fill="var(--prD)" opacity="0.5" />
    <rect x="157" y="175" width="6" height="14" rx="3" fill="var(--prD)" opacity="0.5" />
    {/* 钥匙 */}
    <circle cx="230" cy="125" r="14" fill="none" stroke="var(--on-pr)" strokeWidth="3" opacity="0.8" />
    <line x1="244" y1="125" x2="270" y2="125" stroke="var(--on-pr)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    <line x1="260" y1="125" x2="260" y2="135" stroke="var(--on-pr)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <line x1="250" y1="125" x2="250" y2="132" stroke="var(--on-pr)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    {/* 邮件图标 */}
    <rect x="90" y="100" width="50" height="34" rx="6" fill="var(--on-pr)" opacity="0.7" />
    <path d="M90,100 L115,118 L140,100" stroke="var(--on-pr)" strokeWidth="1.5" fill="none" opacity="0.5" />
    {/* 连接线 */}
    <line x1="140" y1="110" x2="175" y2="120" stroke="var(--on-pr)" strokeWidth="1" opacity="0.3" strokeDasharray="4,4" />
    <line x1="210" y1="120" x2="216" y2="122" stroke="var(--on-pr)" strokeWidth="1" opacity="0.3" strokeDasharray="4,4" />
  </svg>
)
