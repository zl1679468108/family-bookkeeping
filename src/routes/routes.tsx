import { lazy } from 'react'
import { RouteConfig } from './types'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const Transactions = lazy(() => import('../pages/Transactions'))
const Reports = lazy(() => import('../pages/Reports'))
const AddTransaction = lazy(() => import('../pages/AddTransaction'))

export const routes: RouteConfig[] = [
  {
    path: '/login',
    element: <div>Login Page (to be implemented)</div>,
    isPrivate: false,
  },
  {
    path: '/signup',
    element: <div>Signup Page (to be implemented)</div>,
    isPrivate: false,
  },
  {
    path: '/',
    element: <Dashboard />,
    isPrivate: true,
  },
  {
    path: '/transactions',
    element: <Transactions />,
    isPrivate: true,
  },
  {
    path: '/reports',
    element: <Reports />,
    isPrivate: true,
  },
  {
    path: '/add',
    element: <AddTransaction />,
    isPrivate: true,
  },
]