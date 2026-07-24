/**
 * useSubmit — 统一提交类操作 Hook
 *
 * 封装所有"写操作"（表单提交、删除、邀请、上传等）的共性：
 *   - useRef 防重复提交（不触发渲染，避免键盘收起动画期间 setData 冻死整页）
 *   - Taro.showLoading 原生 loading（不依赖 setData，不会被键盘动画冻死）
 *   - mask 挡住底层点击，替代按钮 disabled 态
 *   - 主动收起键盘
 *   - 60s 兜底强制关闭 loading（防御 fn 异常不 reject 的极端情况）
 *
 * Usage:
 *   import { useSubmit, toastError } from "../../hooks/useSubmit";
 *   import { toastSuccess, toastInfo } from "../../utils/toast";
 *
 *   const { run } = useSubmit();
 *   const handleSave = () => {
 *     if (!name.trim()) {
 *       toastInfo("请输入名称");
 *       return;
 *     }
 *     run(async () => {
 *       await createBook({ name });
 *       toastSuccess("创建成功");
 *       Taro.navigateBack();
 *     }, "创建中…").catch((err) => toastError(err, "创建失败"));
 *   };
 *
 * 注意：
 *   - run 返回 Promise<T | undefined>，undefined 表示因防重复未执行
 *   - fn 抛错时 run 会先 hideLoading 再 re-throw，使用方需 .catch 自行提示
 *   - Taro.showLoading 与 Taro.showToast 互斥，showToast 会自动关闭 loading
 */
import { useRef, useCallback } from "react";
import Taro from "@tarojs/taro";

// 兼容旧 import 路径：toastError 统一实现在 utils/toast
export { toastError } from "../utils/toast";

export function useSubmit() {
  const ref = useRef(false);

  const run = useCallback(async <T>(
    fn: () => Promise<T>,
    title: string = "处理中…",
  ): Promise<T | undefined> => {
    if (ref.current) return undefined;
    ref.current = true;

    Taro.hideKeyboard();
    Taro.showLoading({ title, mask: true });

    const timer = setTimeout(() => {
      Taro.hideLoading();
      ref.current = false;
    }, 60000);

    try {
      const result = await fn();
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    } finally {
      Taro.hideLoading();
      ref.current = false;
    }
  }, []);

  return { run };
}
