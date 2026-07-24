/**
 * PageHero — 页面顶部重点信息区。
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import {
  buildPageHeroClassName,
  type PageHeroTone,
} from "../../../utils/pageHero";
import "./index.scss";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  value?: string;
  meta?: string;
  aside?: ReactNode;
  children?: ReactNode;
  tone?: PageHeroTone;
  className?: string;
}

export default function PageHero({
  eyebrow,
  title,
  value,
  meta,
  aside,
  children,
  tone = "primary",
  className = "",
}: PageHeroProps) {
  return (
    <View className={buildPageHeroClassName({ tone, className })}>
      <View className="page-hero__main">
        {eyebrow ? <Text className="page-hero__eyebrow">{eyebrow}</Text> : null}
        <Text className="page-hero__title">{title}</Text>
        {value ? <Text className="page-hero__value">{value}</Text> : null}
        {meta ? <Text className="page-hero__meta">{meta}</Text> : null}
      </View>
      {aside ? <View className="page-hero__aside">{aside}</View> : null}
      {children ? <View className="page-hero__extra">{children}</View> : null}
    </View>
  );
}
