import { useState, useEffect, useRef } from 'react';
import { ModalType, acquire, release } from '../utils/modalZIndex';

/**
 * 为弹窗组件提供动态 z-index 管理。
 *
 * 使用方式：
 *   const zIndex = useModalZIndex(open, 'detail');
 *   return <div style={{ zIndex }} ... />
 *
 * 工作方式：
 *   open 从 false → true：acquire（计数器 +1）
 *   open 从 true → false：release（计数器 -1）
 *   组件卸载：release（防止内存泄漏）
 *
 * @param open  弹窗是否打开
 * @param type  弹窗类型（detail / modal / critical）
 */
export function useModalZIndex(open: boolean, type: ModalType): number {
  const [zIndex, setZIndex] = useState<number>(0);
  const acquiredRef = useRef(false);

  // 监听 open 变化：打开时 acquire，关闭时 release
  useEffect(() => {
    if (open && !acquiredRef.current) {
      const z = acquire(type);
      setZIndex(z);
      acquiredRef.current = true;
    } else if (!open && acquiredRef.current) {
      release();
      acquiredRef.current = false;
      setZIndex(0);
    }
  }, [open, type]);

  // 组件卸载时兜底 release，防止计数器泄漏
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
