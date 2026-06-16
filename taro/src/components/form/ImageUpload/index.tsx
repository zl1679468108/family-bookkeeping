/**
 * ImageUpload — 多图上传 / 附件组件
 * 支持：选择图片、预览、删除，最多 MAX_IMAGES 张
 */
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

export interface ImageUploadProps {
  images: string[];
  onChange: (imgs: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({
  images,
  onChange,
  maxImages = 5,
}: ImageUploadProps) {
  const handleSelect = () => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      Taro.showToast({ title: `最多上传 ${maxImages} 张`, icon: "none" });
      return;
    }
    Taro.chooseImage({
      count: remaining,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    })
      .then((res) => {
        const paths = res.tempFilePaths || [];
        onChange([...images, ...paths]);
      })
      .catch(() => {});
  };

  const handleRemove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const handlePreview = (idx: number) => {
    Taro.previewImage({
      current: images[idx],
      urls: images,
    });
  };

  return (
    <View className="ft-section ft-images">
      <View className="ft-images-head">
        <Text className="ft-images-label">
          附件 ({images.length} / {maxImages})
        </Text>
      </View>
      <View className="ft-images-grid">
        {images.map((url, idx) => (
          <View key={idx} className="ft-images-item">
            <Image
              className="ft-images-img"
              src={url}
              mode="aspectFill"
              onClick={() => handlePreview(idx)}
            />
            <Text
              className="ft-images-remove"
              onClick={() => handleRemove(idx)}
            >
              ×
            </Text>
          </View>
        ))}
        {images.length < maxImages && (
          <View className="ft-images-add" onClick={handleSelect}>
            <Text className="ft-images-add-icon">+</Text>
            <Text className="ft-images-add-text">添加</Text>
          </View>
        )}
      </View>
    </View>
  );
}
