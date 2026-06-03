import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadReceipt, deleteReceipt } from '../services/api';

/**
 * 收据操作 Hook
 * 封装收据上传和删除的 mutation 逻辑，自动刷新关联交易记录
 */
export function useReceipt(transactionId: number) {
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: (file: Blob) => uploadReceipt(transactionId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteReceipt(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    upload,
    remove,
    isUploading: upload.isPending,
    isDeleting: remove.isPending,
  };
}

export default useReceipt;
