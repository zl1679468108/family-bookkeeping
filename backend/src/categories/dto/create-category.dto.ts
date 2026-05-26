import { IsString, IsIn, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: '分类名称不能为空' })
  @MaxLength(50, { message: '分类名称不能超过50个字符' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '图标不能为空' })
  @MaxLength(50, { message: '图标不能超过50个字符' })
  icon: string;

  @IsString()
  @IsIn(['expense', 'income'], { message: '类型必须是 expense 或 income' })
  type: 'expense' | 'income';
}
