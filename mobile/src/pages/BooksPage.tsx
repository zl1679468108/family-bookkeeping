/**
 * BooksPage — Manage ledgers (账本切换).
 * Features: create/rename/delete/switch books, member management, invite by email, leave book.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBooks, createBook, renameBook, deleteBook, fetchBookMembers, inviteMember, leaveBook } from '../services/booksApi';
import { setStoredBookId, getStoredBookId } from '../services/api';
import EmptyState from '../components/EmptyState';
import type { Book } from '../types';

const DEFAULT_BOOK_NAME = '默认账本';

const BooksPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentBookId, setCurrentBookId] = useState(getStoredBookId() || '');
  const [newName, setNewName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [memberBookId, setMemberBookId] = useState<string | null>(null);
  const [inviteBookId, setInviteBookId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<Book | null>(null);

  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: fetchBooks,
    staleTime: 60_000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['books', 'members', memberBookId],
    queryFn: () => (memberBookId ? fetchBookMembers(memberBookId) : Promise.resolve([])),
    enabled: !!memberBookId,
  });

  const createMut = useMutation({
    mutationFn: (name: string) => createBook(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setNewName('');
    },
  });

  const renameMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameBook(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setRenameId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setDeleteTarget(null);
    },
  });

  const inviteMut = useMutation({
    mutationFn: ({ bookId, email }: { bookId: string; email: string }) => inviteMember(bookId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', 'members'] });
      setInviteEmail('');
    },
  });

  const leaveMut = useMutation({
    mutationFn: (id: string) => leaveBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setLeaveTarget(null);
    },
  });

  const handleSwitch = (book: Book) => {
    setStoredBookId(book.id);
    setCurrentBookId(book.id);
    queryClient.invalidateQueries();
    navigate('/', { replace: true });
  };

  const isDefault = (book: Book) => book.name === DEFAULT_BOOK_NAME;

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="touch-target text-text-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-base font-semibold">账本管理</h1>
      </div>

      <div className="px-4 pt-4 pb-20 space-y-4">
        {/* Create */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-semibold mb-3">创建新账本</h3>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="账本名称（如：家庭账本）"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) createMut.mutate(newName.trim()); }}
            />
            <button
              onClick={() => newName.trim() && createMut.mutate(newName.trim())}
              disabled={!newName.trim() || createMut.isPending}
              className="px-4 py-2.5 bg-primary text-white text-sm rounded-xl disabled:opacity-50"
            >
              {createMut.isPending ? '创建中' : '创建'}
            </button>
          </div>
        </div>

        {/* Book list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <EmptyState icon="📚" title="暂无账本" description="创建第一个账本开始记账" />
        ) : (
          <div className="space-y-3">
            {books.map((book) => {
              const active = book.id === currentBookId;
              const renaming = renameId === book.id;
              const showingMembers = memberBookId === book.id;
              const showingInvite = inviteBookId === book.id;

              return (
                <div key={book.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${active ? 'ring-1 ring-primary' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📖</span>
                      {renaming ? (
                        <div className="flex-1 flex gap-2 items-center">
                          <input
                            value={renameVal}
                            onChange={(e) => setRenameVal(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-sm outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && renameVal.trim()) renameMut.mutate({ id: book.id, name: renameVal.trim() });
                              if (e.key === 'Escape') setRenameId(null);
                            }}
                          />
                          <button onClick={() => renameVal.trim() && renameMut.mutate({ id: book.id, name: renameVal.trim() })} className="text-xs text-primary font-medium">保存</button>
                          <button onClick={() => setRenameId(null)} className="text-xs text-text-secondary">取消</button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setRenameId(book.id); setRenameVal(book.name); }}
                              className="text-sm font-semibold"
                            >
                              {book.name}
                            </button>
                            {active && <span className="text-xs text-primary">● 当前</span>}
                            {isDefault(book) && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">默认</span>}
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            创建于 {new Date(book.created_at).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!renaming && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleSwitch(book)} disabled={active}
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary-bg text-primary font-medium disabled:opacity-40">切换到</button>
                        <button onClick={() => setMemberBookId(showingMembers ? null : book.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border ${showingMembers ? 'border-primary text-primary' : 'border-gray-200 text-text-secondary'}`}>成员</button>
                        <button onClick={() => setInviteBookId(showingInvite ? null : book.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border ${showingInvite ? 'border-primary text-primary' : 'border-gray-200 text-text-secondary'}`}>邀请</button>
                        {!isDefault(book) && (
                          <button onClick={() => setDeleteTarget(book)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-[#D85A30]">删除</button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Member list */}
                  {showingMembers && (
                    <div className="border-t border-gray-50 px-4 py-3">
                      {members.length === 0 ? (
                        <p className="text-xs text-text-secondary">暂无成员</p>
                      ) : (
                        members.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between py-1.5 text-sm">
                            <span>{m.username || m.email}</span>
                            {m.role === 'owner' && <span className="text-xs text-primary">所有者</span>}
                          </div>
                        ))
                      )}
                      {!isDefault(book) && (
                        <button onClick={() => setLeaveTarget(book)} className="mt-2 text-xs text-[#D85A30]">退出账本</button>
                      )}
                    </div>
                  )}

                  {/* Invite form */}
                  {showingInvite && (
                    <div className="border-t border-gray-50 px-4 py-3 flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="输入用户邮箱"
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && inviteEmail.trim()) inviteMut.mutate({ bookId: book.id, email: inviteEmail.trim() });
                        }}
                      />
                      <button
                        onClick={() => inviteEmail.trim() && inviteMut.mutate({ bookId: book.id, email: inviteEmail.trim() })}
                        disabled={!inviteEmail.trim() || inviteMut.isPending}
                        className="px-4 py-2 bg-primary text-white text-xs rounded-lg disabled:opacity-50"
                      >
                        {inviteMut.isPending ? '添加中' : '添加'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl mx-8 p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-text-secondary mb-5">确定要删除账本「{deleteTarget.name}」吗？所有交易将被清除且不可恢复。</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm">取消</button>
              <button onClick={() => deleteMut.mutate(deleteTarget.id)} disabled={deleteMut.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#D85A30] text-white text-sm">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Leave confirm */}
      {leaveTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setLeaveTarget(null)}>
          <div className="bg-white rounded-2xl mx-8 p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-2">确认退出</h3>
            <p className="text-sm text-text-secondary mb-5">确定要退出账本「{leaveTarget.name}」吗？退出后无法查看该账本数据。</p>
            <div className="flex gap-3">
              <button onClick={() => setLeaveTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm">取消</button>
              <button onClick={() => leaveMut.mutate(leaveTarget.id)} disabled={leaveMut.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#D85A30] text-white text-sm">确认退出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksPage;
