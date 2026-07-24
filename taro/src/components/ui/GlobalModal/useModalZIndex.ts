/**
 * useModalZIndex — 弹窗动态 z-index（对齐 PC）
 * 纯计数见 shared-utils/modalZIndex；本文件仅 React 绑定。
 */
import { useEffect, useRef, useState } from "react";
import { acquire, release, type ModalType } from "../../../utils/modalZIndex";

export function useModalZIndex(open: boolean, type: ModalType): number {
  const [zIndex, setZIndex] = useState(0);
  const acquiredRef = useRef(false);

  useEffect(() => {
    if (open && !acquiredRef.current) {
      setZIndex(acquire(type));
      acquiredRef.current = true;
    } else if (!open && acquiredRef.current) {
      release();
      acquiredRef.current = false;
      setZIndex(0);
    }
  }, [open, type]);

  useEffect(() => {
    return () => {
      if (acquiredRef.current) {
        release();
        acquiredRef.current = false;
      }
    };
  }, []);

  return zIndex;
}
