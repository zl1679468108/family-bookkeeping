import { useEffect, useRef } from 'react'

/**
 * 仅在组件挂载时执行一次的 useEffect（即使在 React 18 严格模式下也只执行一次）。
 *
 * 用于解决严格模式下 useEffect 被触发两次导致的：
 * - 重复请求接口（如验证码、初始化数据）
 * - 重复初始化资源（如地图、SDK）
 * - 重复订阅事件
 *
 * 实现原理：
 * - React 18 严格模式下，开发环境会模拟：mount → unmount → mount
 * - 即 effect() → cleanup() → effect() 依次触发
 * - 通过 ref 计数：cleanup 时 +1，第二次 effect 触发时检测到 >0 则直接 return
 *
 * 注意：本钩子只能阻止"第二次启动 effect"，不能取消第一次 effect 内部
 * 已经发起的异步操作（如网络请求）。对于幂等操作效果最佳。
 *
 * @param effect 要执行的副作用，可返回清理函数
 *
 * @example
 * useOnceEffect(() => {
 *   refreshCaptcha()
 * })
 */
export const useOnceEffect = (effect: () => void | (() => void)): void => {
  // 0 = 尚未 cleanup；>0 = 已被 cleanup 过
  const cleanedUpRef = useRef(0)

  useEffect(() => {
    // 严格模式下：effect 第一次(ref=0) → cleanup(ref=1) → effect 第二次(ref=1，跳过)
    if (cleanedUpRef.current > 0) {
      return
    }

    const cleanup = effect()

    return () => {
      cleanedUpRef.current += 1
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
