/**
 * Books — v3.0 账本管理
 * 使用 BookCard 组件渲染每个账本
 */
import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBooks,
  createBook,
  renameBook,
  deleteBook,
  leaveBook,
} from "../../services/booksApi";
import { setStoredBookId, getStoredBookId } from "../../services/api";
import BookCard from "./components/BookCard";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import type { Book } from "../../types";
import "./index.scss";

const DEFAULT_NAME = "默认账本";

export default function BooksPage() {
  const qc = useQueryClient();
  const [currentId, setCurrentId] = useState(getStoredBookId());
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<Book | null>(null);

  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: fetchBooks,
    staleTime: 60_000,
  });

  const createMut = useMutation({
    mutationFn: (name: string) => createBook(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      setNewName("");
    },
  });
  const renameMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameBook(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      setDeleteTarget(null);
    },
  });
  const leaveMut = useMutation({
    mutationFn: (id: string) => leaveBook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      setLeaveTarget(null);
    },
  });

  const isDefault = (b: Book) => b.name === DEFAULT_NAME;

  const handleSwitch = (book: Book) => {
    if (book.id === currentId) return;
    setStoredBookId(book.id);
    setCurrentId(book.id);
    qc.invalidateQueries();
    Taro.switchTab({ url: "/pages/Home/index" });
  };

  return (
    <View className="min-h-screen bg-bg flex flex-col">
      <View className="flex-1 overflow-y-auto">
        <View className="books-content">
          {/* Create New Book */}
          <View className="card-padded">
            <Text className="text-sm font-semibold mb-3">创建新账本</Text>
            <View className="flex gap-2">
              <Input
                className="flex-1 px-3 books-input"
                value={newName}
                onInput={(e: any) => setNewName(e.detail.value)}
                placeholder="账本名称"
                placeholderClass="text-hint"
                onConfirm={() => {
                  if (newName.trim()) createMut.mutate(newName.trim());
                }}
              />
              <View
                className={`books-create-btn ${!newName.trim() || createMut.isPending ? "opacity-50" : ""}`}
                onClick={() => {
                  if (newName.trim() && !createMut.isPending)
                    createMut.mutate(newName.trim());
                }}
              >
                <Text className="text-sm text-white">
                  {createMut.isPending ? "创建中" : "创建"}
                </Text>
              </View>
            </View>
          </View>

          {/* Book List */}
          {isLoading ? (
            <View className="flex justify-center py-8">
              <View
                className="animate-spin"
                style={{
                  width: "44rpx",
                  height: "44rpx",
                  border: "4rpx solid var(--color-primary)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                }}
              />
            </View>
          ) : books.length === 0 ? (
            <EmptyState
              icon="📚"
              title="暂无账本"
              description="创建第一个账本开始记账"
            />
          ) : (
            <View className="flex flex-col gap-2">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isActive={book.id === currentId}
                  isDefault={isDefault(book)}
                  onSwitch={handleSwitch}
                  onRename={(id, name) => renameMut.mutate({ id, name })}
                  onDelete={setDeleteTarget}
                  onLeave={setLeaveTarget}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="确认删除"
        message={`确定删除账本「${deleteTarget?.name}」吗？所有交易将被清除。`}
        confirmText="确认删除"
        confirmLoading={deleteMut.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
      />

      <ConfirmDialog
        visible={!!leaveTarget}
        title="确认退出"
        message={`确定退出账本「${leaveTarget?.name}」吗？`}
        confirmText="确认退出"
        confirmLoading={leaveMut.isPending}
        onCancel={() => setLeaveTarget(null)}
        onConfirm={() => leaveTarget && leaveMut.mutate(leaveTarget.id)}
      />
    </View>
  );
}
