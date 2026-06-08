/**
 * Toast — lightweight notification toast.
 * Fixed position near top, auto-dismiss with fade animation.
 */
import { useEffect, useRef, useState } from "react";
import { View, Text } from "@tarojs/components";

export interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  visible,
  message,
  duration = 2000,
  onClose,
}: ToastProps) {
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Trigger enter animation after mount
      const raf = setTimeout(() => setAnimating(true), 16);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        onClose();
      }, duration);

      return () => {
        clearTimeout(raf);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      setAnimating(false);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <View
      className="toast-overlay fixed inset-x-0 z-100 flex justify-center"
      style={{ top: "30%" }}
    >
      <View className={`toast-content ${animating ? "toast-show" : ""}`}>
        <Text className="toast-message">{message}</Text>
      </View>
    </View>
  );
}
