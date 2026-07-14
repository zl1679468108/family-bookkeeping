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
 * 为什么不用 useState + 按钮文字"xxx中…"？
 *   微信 WebView 已知坑：键盘收起动画期间触发 setData 会概率性冻死整页渲染，
 *   表现为按钮 loading 卡死、X/取消点不动。原生 showLoading 不走 setData，
 *   规避此问题，且全局 UI 统一。
 *
 * 为什么不再需要 safeSubmit 包裹？
 *   safeSubmit 是为「等键盘收起后再 setSaving(true)」设计的。
 *   现在 loading 改用原生 showLoading，不再触发 setData，键盘动画问题不复存在，
 *   useSubmit 内部主动 hideKeyboard 即可，无需等待。
 *
 * Usage:
 *   const { run } = useSubmit();
 *
 *   const handleSave = () => {
 *     if (!name.trim()) {
 *       Taro.showToast({ title: "请输入名称", icon: "none" });
 *       return;
 *     }
 *     run(async () => {
 *       await createBook({ name });
 *       Taro.showToast({ title: "创建成功", icon: "success" });
 *       Taro.navigateBack();
 *     }, "创建中…").catch((err: any) => {
 *       Taro.showToast({ title: err?.message || "创建失败", icon: "none" });
 *     });
 *   };
 *
 * 注意：
 *   - run 返回 Promise<T | undefined>，undefined 表示因防重复未执行
 *   - fn 抛错时 run 会先 hideLoading 再 re-throw，使用方需 .catch 自行提示
 *   - Taro.showLoading 与 Taro.showToast 互斥，showToast 会自动关闭 loading
 */
import { useRef, useCallback } from "react";
import Taro from "@tarojs/taro";

export function useSubmit() {
  const ref = useRef(false);

  const run = useCallback(async <T>(
    fn: () => Promise<T>,
    title: string = "处理中…",
  ): Promise<T | undefined> => {
    // 防重复提交
    if (ref.current) return undefined;
    ref.current = true;

    // 主动收起键盘（异步，不等；showLoading mask 会盖住键盘）
    Taro.hideKeyboard();
    Taro.showLoading({ title, mask: true });

    // 兜底：60s 后强制关闭 loading（防止 fn 异常不 reject）
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
