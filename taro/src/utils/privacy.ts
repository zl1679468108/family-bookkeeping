/**
 * 微信隐私协议授权工具
 *
 * 微信开启 __usePrivacyCheck__ 后，调用 chooseMedia/chooseImage/getLocation 等
 * 隐私接口前必须先获得用户隐私授权，否则会静默失败或报 privacy 错误。
 *
 * 流程：
 * 1. getPrivacySetting 检查是否需要授权
 * 2. 需要授权时调 requirePrivacyAuthorize 弹窗
 * 3. 用户拒绝时引导去 openPrivacySetting 设置页
 *
 * 注意：如果小程序后台未配置隐私协议，getPrivacySetting 返回 needAuthorization=false，
 * 此时所有隐私接口可直接调用，本工具会自动放行。
 */

interface PrivacySetting {
  needAuthorization: boolean;
  privacyContractName: string;
  privacyInterfaceName: string[];
}

interface WxAPI {
  getPrivacySetting?(opts: { success?: (res: PrivacySetting) => void; fail?: () => void }): void;
  requirePrivacyAuthorize?(opts: { success?: () => void; fail?: (err: any) => void }): void;
  openPrivacySetting?(opts: { success?: () => void; fail?: () => void }): void;
  showToast?(opts: { title: string; icon?: string; duration?: number }): void;
  showModal?(opts: {
    title?: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    success?: (res: { confirm: boolean; cancel: boolean }) => void;
  }): void;
}

function getWx(): WxAPI | null {
  const w = (typeof window !== "undefined" ? window : (global as any)) as any;
  const wx = (typeof w !== "undefined" ? w.wx : undefined) || (global as any).wx;
  return wx || null;
}

/**
 * 获取隐私设置
 */
export function getPrivacySetting(): Promise<PrivacySetting> {
  return new Promise((resolve) => {
    const wx = getWx();
    if (!wx || typeof wx.getPrivacySetting !== "function") {
      // 环境不支持（H5/旧版基础库），无需授权
      resolve({ needAuthorization: false, privacyContractName: "", privacyInterfaceName: [] });
      return;
    }
    try {
      wx.getPrivacySetting({
        success: (res: PrivacySetting) => resolve(res),
        fail: () =>
          resolve({ needAuthorization: false, privacyContractName: "", privacyInterfaceName: [] }),
      });
    } catch {
      resolve({ needAuthorization: false, privacyContractName: "", privacyInterfaceName: [] });
    }
  });
}

/**
 * 请求隐私授权（弹出系统授权弹窗）
 */
export function requirePrivacyAuthorize(): Promise<boolean> {
  return new Promise((resolve) => {
    const wx = getWx();
    if (!wx || typeof wx.requirePrivacyAuthorize !== "function") {
      resolve(true);
      return;
    }
    try {
      wx.requirePrivacyAuthorize({
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * 打开隐私设置页（用户拒绝授权后引导）
 */
export function openPrivacySetting(): Promise<boolean> {
  return new Promise((resolve) => {
    const wx = getWx();
    if (!wx || typeof wx.openPrivacySetting !== "function") {
      resolve(false);
      return;
    }
    try {
      wx.openPrivacySetting({
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * 完整的隐私授权流程（带引导）
 *
 * 返回 true 表示已授权或无需授权，可以继续调用隐私接口
 * 返回 false 表示用户拒绝授权，调用方应中止操作
 */
export async function ensurePrivacyAuthorize(tip = "需要您同意隐私协议才能使用此功能"): Promise<boolean> {
  const setting = await getPrivacySetting();
  // 不需要授权（未配置隐私协议 / 已授权）
  if (!setting.needAuthorization) {
    return true;
  }

  // 主动触发授权弹窗
  const authorized = await requirePrivacyAuthorize();
  if (authorized) {
    return true;
  }

  // 用户拒绝，弹窗引导去设置页
  return new Promise((resolve) => {
    const wx = getWx();
    if (!wx || typeof wx.showModal !== "function") {
      resolve(false);
      return;
    }
    wx.showModal({
      title: "隐私授权提示",
      content: `${tip}，是否前往设置页开启？`,
      confirmText: "去设置",
      cancelText: "不了",
      success: async (res) => {
        if (res.confirm) {
          await openPrivacySetting();
          // 用户从设置页返回后，再次检查授权状态
          const recheck = await requirePrivacyAuthorize();
          resolve(recheck);
        } else {
          resolve(false);
        }
      },
    });
  });
}

/**
 * 判断错误是否与隐私授权有关
 */
export function isPrivacyError(err: any): boolean {
  const msg = String(err?.errMsg || err?.message || err || "");
  return msg.toLowerCase().indexOf("privacy") !== -1;
}

/**
 * 兼容旧接口：打开隐私设置页（保留导出名，避免大面积改动调用方）
 */
export { openPrivacySetting as openPrivacySettingPage };
