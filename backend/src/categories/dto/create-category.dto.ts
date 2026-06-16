import { IsString, IsIn, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: '分类名称不能为空' })
  @MaxLength(50, { message: '分类名称不能超过50个字符' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '图标不能超过500个字符' })
  icon?: string;

  @IsOptional()
  @IsString()
  icon_id?: string;

  @IsString()
  @IsIn(['expense', 'income'], { message: '类型必须是 expense 或 income' })
  type: 'expense' | 'income';
}
