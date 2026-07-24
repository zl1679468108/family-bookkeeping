/**
 * Query keys — 纯工厂见 shared-utils；本文件补 React Query invalidate/remove 适配
 */
import type { QueryClient, QueryKey } from '@tanstack/react-query'
import {
  queryKeys as _queryKeys,
  BOOK_SCOPED_ROOT_KEYS as _BOOK_SCOPED_ROOT_KEYS,
  USER_SCOPED_ROOT_KEYS as _USER_SCOPED_ROOT_KEYS,
  TRANSACTION_IMPACT_ROOT_KEYS as _TRANSACTION_IMPACT_ROOT_KEYS,
} from '../../../shared-utils/src/queryKeys'

export type { TxListFilters } from '../../../shared-utils/src/queryKeys'
export const queryKeys = _queryKeys

export const BOOK_SCOPED_ROOT_KEYS = _BOOK_SCOPED_ROOT_KEYS as readonly QueryKey[]
export const USER_SCOPED_ROOT_KEYS = _USER_SCOPED_ROOT_KEYS as readonly QueryKey[]
export const TRANSACTION_IMPACT_ROOT_KEYS = _TRANSACTION_IMPACT_ROOT_KEYS as readonly QueryKey[]

export function invalidateQueryRoots(qc: QueryClient, roots: readonly QueryKey[]): void {
  roots.forEach((key) => {
    qc.invalidateQueries({ queryKey: key })
  })
}

export function removeQueryRoots(qc: QueryClient, roots: readonly QueryKey[]): void {
  roots.forEach((key) => {
    qc.removeQueries({ queryKey: key })
  })
}
