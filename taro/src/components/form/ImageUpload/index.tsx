/**
 * ImageUpload — 多图上传 / 附件组件
 * 支持：选择图片、预览、删除，最多 MAX_IMAGES 张
 * 区分 savedImages（已上传的 URL）和 pendingImages（本地临时路径）
 */
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import {
  ensurePrivacyAuthorize,
  isPrivacyError,
  openPrivacySetting,
} from "../../../utils/privacy";
import "./index.scss";

export interface ImageUploadProps {
  /** 已上传的图片 URL（从服务器获取） */
  savedImages?: string[];
  /** 待上传的本地临时路径 */
  pendingImages?: string[];
  /** 已上传图片变化回调 */
  onSavedChange?: (imgs: string[]) => void;
  /** 待上传图片变化回调 */
  onPendingChange?: (imgs: string[]) => void;
  /** 兼容旧模式：所有图片在一个数组中 */
  images?: string[];
  onChange?: (imgs: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({
  savedImages = [],
  pendingImages = [],
  onSavedChange,
  onPendingChange,
  images: legacyImages,
  onChange: legacyOnChange,
  maxImages = 5,
}: ImageUploadProps) {
  // 兼容旧模式：如果传了 images/onChange，则合并到 savedImages/onSavedChange
  const allSaved = legacyImages ?? savedImages;
  const allPending = pendingImages;
  const maxCount = maxImages;
  const totalCount = allSaved.length + allPending.length;

  const handleSelect = async () => {
    const remaining = maxCount - totalCount;
    if (remaining <= 0) {
      Taro.showToast({ title: `最多上传 ${maxCount} 张`, icon: "none" });
      return;
    }
    // 先触发微信隐私授权（开启 __usePrivacyCheck__ 时必须）
    const ok = await ensurePrivacyAuthorize("选择图片需要访问您的相册");
    if (!ok) return;
    Taro.chooseMedia({
      count: remaining,
      mediaType: ["image"],
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    })
      .then((res) => {
        const paths = (res.tempFiles || []).map((f) => f.tempFilePath);
        if (legacyOnChange) {
          legacyOnChange([...allSaved, ...paths]);
        } else if (onPendingChange) {
          onPendingChange([...allPending, ...paths]);
        }
      })
      .catch((err: any) => {
        const msg = err?.errMsg || err?.message || "";
        // 用户主动取消不提示
        if (msg.indexOf("cancel") !== -1) return;
        if (isPrivacyError(err)) {
          Taro.showToast({ title: "请先同意隐私协议", icon: "none" });
          openPrivacySetting();
          return;
        }
        Taro.showToast({ title: msg || "选择图片失败", icon: "none" });
      });
  };

  const handleRemoveSaved = (idx: number) => {
    const next = allSaved.filter((_, i) => i !== idx);
    if (legacyOnChange) {
      legacyOnChange(next);
    } else if (onSavedChange) {
      onSavedChange(next);
    }
  };

  const handleRemovePending = (idx: number) => {
    const next = allPending.filter((_, i) => i !== idx);
    if (onPendingChange) {
      onPendingChange(next);
    }
  };

  const handlePreview = (url: string, allUrls: string[]) => {
    Taro.previewImage({
      current: url,
      urls: allUrls,
    });
  };

  const allImages = [...allSaved, ...allPending];

  return (
    <View className="ft-section ft-images">
      <View className="ft-images-head">
        <Text className="ft-images-label">
          附件 ({totalCount} / {maxCount})
        </Text>
        {allPending.length > 0 && (
          <Text className="ft-images-pending-hint">
            待上传 {allPending.length} 张
          </Text>
        )}
      </View>
      <View className="ft-images-grid">
        {/* 已上传的图片 */}
        {allSaved.map((url, idx) => (
          <View key={`saved-${idx}`} className="ft-images-item">
            <Image
              className="ft-images-img"
              src={url}
              mode="aspectFill"
              onClick={() => handlePreview(url, allImages)}
            />
            <Text
              className="ft-images-remove"
              onClick={() => handleRemoveSaved(idx)}
            >
              ×
            </Text>
          </View>
        ))}
        {/* 待上传的本地图片 */}
        {allPending.map((url, idx) => (
          <View key={`pending-${idx}`} className="ft-images-item ft-images-item--pending">
            <Image
              className="ft-images-img"
              src={url}
              mode="aspectFill"
              onClick={() => handlePreview(url, allImages)}
            />
            <View className="ft-images-pending-tag">
              <Text className="ft-images-pending-tag-text">待上传</Text>
            </View>
            <Text
              className="ft-images-remove"
              onClick={() => handleRemovePending(idx)}
            >
              ×
            </Text>
          </View>
        ))}
        {totalCount < maxCount && (
          <View className="ft-images-add" onClick={handleSelect}>
            <Text className="ft-images-add-icon">+</Text>
            <Text className="ft-images-add-text">添加</Text>
          </View>
        )}
      </View>
    </View>
  );
}
