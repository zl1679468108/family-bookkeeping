/**
 * CategoryGrid — 4-column grid of category icons for selection.
 */
import { View, Text } from "@tarojs/components";
import type { Category } from "../../../../types";

export interface CategoryGridProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (cat: Category) => void;
}

export default function CategoryGrid({
  categories,
  selectedId,
  onSelect,
}: CategoryGridProps) {
  return (
    <View className="category-grid grid grid-cols-4 gap-3 px-4 py-3">
      {categories.map((cat) => {
        const isSelected = cat.id === selectedId;
        return (
          <View
            key={cat.id}
            className={`category-grid-item flex flex-col items-center justify-center p-3 rounded-lg transition ${
              isSelected
                ? "category-grid-item-selected bg-primary-bg"
                : "bg-card tappable-card"
            }`}
            style={
              isSelected
                ? {
                    boxShadow:
                      "0 4rpx 20rpx rgba(224,123,76,0.18), 0 0 0 3rpx rgba(224,123,76,0.10)",
                    transform: "scale(1.05)",
                    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  }
                : {
                    boxShadow: "0 1rpx 3rpx rgba(44,36,22,0.03)",
                    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  }
            }
            onClick={() => onSelect(cat)}
          >
            <View
              className={`category-grid-icon flex items-center justify-center mb-1 ${
                isSelected ? "" : ""
              }`}
            >
              <Text className="text-2xl">{cat.icon}</Text>
            </View>
            <Text
              className={`text-xs text-center truncate ${
                isSelected ? "text-primary font-semibold" : "text-secondary"
              }`}
            >
              {cat.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
