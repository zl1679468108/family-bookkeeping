import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

const NotFound: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>404</div>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
        页面不存在
      </h2>
      <p style={{ color: 'var(--fg3)', marginBottom: '20px' }}>
        您访问的页面可能已被移除或地址有误
      </p>
      <Button variant="primary" onClick={() => navigate('/')}>
        返回首页
      </Button>
    </div>
  )
}

export default NotFound
