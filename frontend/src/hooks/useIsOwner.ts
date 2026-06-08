import { useQuery } from '@tanstack/react-query';
import { request } from '../services/api';

/**
 * 检查当前用户是否是指定账本的 Owner
 * @param bookId 账本 ID，如果为 null 则不发起请求
 * @returns { isOwner: boolean; isLoading: boolean }
 */
export const useIsOwner = (bookId: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['books', bookId, 'check-owner'],
    queryFn: bookId 
      ? () => request<{ isOwner: boolean }>(`/books/${bookId}/check-owner`, { requiresAuth: true })
      : () => Promise.resolve({ isOwner: false }),
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新获取
  });

  return {
    isOwner: data?.isOwner || false,
    isLoading,
    error,
  };
};
