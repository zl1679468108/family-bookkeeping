import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBook } from '../../../hooks/useBook';
import {
  deleteBook,
  fetchBookMembers,
  removeMember,
  inviteMember,
  createInvitation,
} from '../../../services/booksApi';
import { notify } from '../../../utils/notifications';

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

  const { data: members = [] } = useQuery({
    queryKey: ['book-members', selectedBook?.id],
    queryFn: () => (selectedBook?.id ? fetchBookMembers(selectedBook.id) : []),
    enabled: !!selectedBook?.id && showDetail,
    staleTime: 30 * 1000,
  });

  const inviteMutation = useMutation({
    mutationFn: ({ bookId, email }: { bookId: string; email: string }) =>
      inviteMember(bookId, email),
    onSuccess: () => {
      notify({ type: 'success', message: '邀请已发送' });
      closeAllDialogs();
      queryClient.invalidateQueries({ queryKey: ['book-members'] });
    },
    onError: (err: any) => {
      notify({ type: 'error', message: err?.message || '邀请失败，请检查邮箱' });
    },
  });

  const inviteCodeMutation = useMutation({
    mutationFn: (bookId: string) => createInvitation(bookId),
    onSuccess: (data) => {
      setGeneratedInviteCode(data);
      setShowInviteCodeModal(true);
    },
    onError: (err: any) => {
      notify({ type: 'error', message: err?.message || '生成邀请码失败' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      notify({ type: 'success', message: '账本已删除' });
      closeAllDialogs();
      refetchBooks();
    },
    onError: (err: any) => {
      notify({ type: 'error', message: err?.message || '删除失败' });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ bookId, userId }: { bookId: string; userId: string }) =>
      removeMember(bookId, userId),
    onSuccess: () => {
      notify({ type: 'success', message: '成员已移除' });
      queryClient.invalidateQueries({ queryKey: ['book-members'] });
      setShowMemberConfirm(false);
      setRemovingMember(null);
    },
    onError: (err: any) => {
      notify({ type: 'error', message: err?.message || '移除失败' });
      setShowMemberConfirm(false);
      setRemovingMember(null);
    },
  });

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
    inviteMutation,
    inviteCodeMutation,
    deleteMutation,
    removeMemberMutation,
    handleCreateSuccess,
    closeAllDialogs,
  };
}
