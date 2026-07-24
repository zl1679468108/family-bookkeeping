import type { ReactNode } from "react";
import { Button } from "../Button";
import type { ButtonSize, ButtonVariant } from "../Button";

/**
 * 空状态主操作按钮（统一 variant/size）
 */
export function EmptyActionButton({
  children,
  onClick,
  size = "sm",
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return (
    <Button variant={variant} size={size} onClick={onClick}>
      {children}
    </Button>
  );
}

/** 常见空态：去记一笔 */
export function EmptyAddTransactionAction({
  onClick,
  label = "去记一笔",
  size = "sm",
}: {
  onClick: () => void;
  label?: string;
  size?: ButtonSize;
}) {
  return (
    <EmptyActionButton onClick={onClick} size={size}>
      {label}
    </EmptyActionButton>
  );
}
