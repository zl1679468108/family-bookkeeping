/**
 * 图片附件区 class / 容量判断 — PC ImageUploadSection / Taro ImageUpload
 */

import { cx, type ClassValue } from './cx'

/** 是否还能继续添加 */
export function canAddMoreImages(currentCount: number, maxCount: number): boolean {
  return Number(currentCount) < Number(maxCount)
}

/** 剩余可传张数（>=0） */
export function remainingImageSlots(currentCount: number, maxCount: number): number {
  return Math.max(0, Number(maxCount) - Number(currentCount))
}

/** PC 上传区根 */
export function buildImageUploadSectionClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'upload-section'
  return cx(prefix, opts.className)
}

export function buildImageGridClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'image-grid'
  return cx(prefix, opts.className)
}

export function buildImageItemClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'image-item'
  return cx(prefix, opts.className)
}

export function buildImageAddClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'image-add'
  return cx(prefix, opts.className)
}

/** Taro ft-images 区 */
export function buildFormImagesSectionClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-section'
  return cx(prefix, 'ft-images', opts.className)
}

export function buildFormImagesGridClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-images-grid'
  return cx(prefix, opts.className)
}

export function buildFormImagesItemClassName(opts: {
  pending?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-images-item'
  return cx(prefix, opts.pending && `${prefix}--pending`, opts.className)
}

export function buildFormImagesAddClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-images-add'
  return cx(prefix, opts.className)
}
