import { lazy } from 'react'
import { RouteConfig } from './types'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const Transactions = lazy(() => import('../pages/Transactions'))
const Reports = lazy(() => import('../pages/Reports'))
const AddTransaction = lazy(() => import('../pages/AddTransaction'))
const Login = lazy(() => import('../pages/User/Login'))
const Register = lazy(() => import('../pages/User/Register'))
const ForgotPassword = lazy(() => import('../pages/User/ForgotPassword'))

export const routes: RouteConfig[] = [
  {
    path: '/login',
    element: <Login />,
    isPrivate: false,
  },
  {
    path: '/register',
    element: <Register />,
    isPrivate: false,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
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