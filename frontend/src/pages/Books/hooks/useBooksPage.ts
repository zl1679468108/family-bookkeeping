import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBook } from '../../../hooks/useBook';
import {
  deleteBook,
  fetchBookMembers,
  removeMember,
  inviteMember,
  createInvitation,
} from '../../../services/booksApi';
import { notify } from '../../../utils/notifications';
import { useMutationAction } from '../../../hooks/useMutationAction';
import { queryKeys } from '../../../utils/queryKeys'
import { STALE } from '../../../utils/cachePolicy'

export interface InviteCodeData {
  code: string;
  book_name: string;
  expires_at: string;
}

export function useBooksPage() {
  const queryClient = useQueryClient();
  const { currentBook, switchBook, books, loading, refetchBooks } = useBook();

  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteJoinModal, setShowInviteJoinModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showMemberConfirm, setShowMemberConfirm] = useState(false);
  const [removingMember, setRemovingMember] = useState<any>(null);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedInviteCode, setGeneratedInviteCode] = useState<InviteCodeData | null>(null);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);

  const closeAllDialogs = useCallback(() => {
    setShowDetail(false);
    setShowCreateModal(false);
    setShowInviteJoinModal(false);
    setShowInviteMemberModal(false);
    setShowInviteCodeModal(false);
    setShowMemberConfirm(false);
    setDeleteTarget(null);
    setEditTarget(null);
    setRemovingMember(null);
    setSelectedBook(null);
    setInviteEmail('');
    setGeneratedInviteCode(null);
  }, []);

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: queryKeys.books.members(selectedBook?.id || ''),
    queryFn: () => (selectedBook?.id ? fetchBookMembers(selectedBook.id) : []),
    enabled: !!selectedBook?.id && showDetail,
    staleTime: STALE.bookMembers,
  });

  const inviteMutation = useMutationAction(
    ({ bookId, email }: { bookId: string; email: string }) =>
      inviteMember(bookId, email),
    {
      invalidateKeys: [queryKeys.books.membersRoot],
      successMessage: '邀请已发送',
      errorMessage: '邀请失败，请检查邮箱',
      onSuccess: closeAllDialogs,
    },
  );

  const inviteCodeMutation = useMutationAction(
    (bookId: string) => createInvitation(bookId),
    {
      successMessage: '邀请码已生成',
      errorMessage: '生成邀请码失败',
    },
  )

  // 包装生成邀请码（需要拿到返回数据）
  const handleGenerateInviteCode = useCallback(async (bookId: string) => {
    try {
      const data = await inviteCodeMutation.run(bookId)
      if (data) {
        setGeneratedInviteCode(data)
        setShowInviteCodeModal(true)
      }
    } catch {
      // 错误已由 useMutationAction 内部 notify
    }
  }, [inviteCodeMutation])

  const deleteMutation = useMutationAction(
    (bookId: string) => deleteBook(bookId),
    {
      successMessage: '账本已删除',
      errorMessage: '删除失败',
      onSuccess: () => {
        closeAllDialogs();
        refetchBooks();
      },
    },
  );

  const removeMemberMutation = useMutationAction(
    ({ bookId, userId }: { bookId: string; userId: string }) =>
      removeMember(bookId, userId),
    {
      invalidateKeys: [queryKeys.books.membersRoot],
      successMessage: '成员已移除',
      errorMessage: '移除失败',
      onSuccess: () => {
        setShowMemberConfirm(false);
        setRemovingMember(null);
      },
    },
  );

  const handleCreateSuccess = useCallback(() => {
    refetchBooks();
    if (editTarget) {
      setEditTarget(null);
      setShowDetail(false);
      setSelectedBook(null);
    }
  }, [editTarget, refetchBooks]);

  return {
    currentBook,
    switchBook,
    books,
    loading,
    selectedBook,
    setSelectedBook,
    showDetail,
    setShowDetail,
    showCreateModal,
    setShowCreateModal,
    showInviteJoinModal,
    setShowInviteJoinModal,
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
    showMemberConfirm,
    setShowMemberConfirm,
    removingMember,
    setRemovingMember,
    showInviteMemberModal,
    setShowInviteMemberModal,
    inviteEmail,
    setInviteEmail,
    generatedInviteCode,
    showInviteCodeModal,
    setShowInviteCodeModal,
    members,
    membersLoading,
    inviteMutation,
    inviteCodeMutation,
    deleteMutation,
    removeMemberMutation,
    handleCreateSuccess,
    handleGenerateInviteCode,
    closeAllDialogs,
  };
}
