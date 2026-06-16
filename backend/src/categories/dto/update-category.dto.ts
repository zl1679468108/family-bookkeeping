import { IsString, IsOptional, IsInt, MaxLength, Min } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '分类名称不能超过50个字符' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '图标不能超过500个字符' })
  icon?: string;

  @IsOptional()
  @IsString()
  icon_id?: string;

  @IsOptional()
  @IsInt({ message: '排序序号必须是整数' })
  @Min(0, { message: '排序序号不能为负数' })
  sort_order?: number;
}
