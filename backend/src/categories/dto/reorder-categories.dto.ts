import { IsArray, IsUUID, IsNumber, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryOrderItem {
  @IsUUID('4', { message: '分类 ID 格式不正确' })
  id: string;

  @IsNumber({}, { message: '排序序号必须是数字' })
  sort_order: number;
}

export class ReorderCategoriesDto {
  @IsArray({ message: '排序列表必须是数组' })
  @ArrayMaxSize(100, { message: '一次最多更新 100 个分类' })
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderItem)
  orders: CategoryOrderItem[];
}
