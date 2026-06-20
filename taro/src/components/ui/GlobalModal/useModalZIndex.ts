/**
 * useModalZIndex — 弹窗动态 z-index（对齐 PC modalZIndex）
 * 全局 openCount 计数，实际 z = base + openCount，解决多层叠加。
 */
import { useEffect, useState } from "react";

const MODAL_BASE: Record<string, number> = {
  detail: 1000,
  modal: 1500,
  critical: 2500,
};

let openCount = 0;

export function useModalZIndex(open: boolean, type: "detail" | "modal" | "critical") {
  const [z, setZ] = useState(MODAL_BASE[type]);
  useEffect(() => {
    if (open) {
      openCount += 1;
      setZ(MODAL_BASE[type] + openCount);
      return () => {
        openCount = Math.max(0, openCount - 1);
      };
    }
  }, [open, type]);
  return z;
}
