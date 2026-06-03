import { lazy } from 'react'
import { RouteConfig } from './types'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const Transactions = lazy(() => import('../pages/Transactions'))
const Reports = lazy(() => import('../pages/Reports'))
const AddTransaction = lazy(() => import('../pages/AddTransaction'))
const Login = lazy(() => import('../pages/User/Login'))
const Register = lazy(() => import('../pages/User/Register'))
const ForgotPassword = lazy(() => import('../pages/User/ForgotPassword'))
const Categories = lazy(() => import('../pages/Categories'))
const Budgets = lazy(() => import('../pages/Budgets'))
const Books = lazy(() => import('../pages/Books'))
const MapPage = lazy(() => import('../pages/Map'))
const Calendar = lazy(() => import('../pages/Calendar'))
const TemplateManager = lazy(() => import('../pages/TemplateManager'))
const AnnualReport = lazy(() => import('../pages/AnnualReport'))

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
  {
    path: '/categories',
    element: <Categories />,
    isPrivate: true,
  },
  {
    path: '/budgets',
    element: <Budgets />,
    isPrivate: true,
  },
  {
    path: '/books',
    element: <Books />,
    isPrivate: true,
  },
  {
    path: '/map',
    element: <MapPage />,
    isPrivate: true,
  },
  {
    path: '/calendar',
    element: <Calendar />,
    isPrivate: true,
  },
  {
    path: '/templates',
    element: <TemplateManager />,
    isPrivate: true,
  },
  {
    path: '/annual-report',
    element: <AnnualReport />,
    isPrivate: true,
  },
]