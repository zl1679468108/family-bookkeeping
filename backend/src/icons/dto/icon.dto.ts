import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateIconDto {
  @IsString()
  @IsIn(['category', 'book'])
  icon_type: 'category' | 'book';
}

export class QueryIconDto {
  @IsOptional()
  @IsString()
  @IsIn(['category', 'book'])
  icon_type?: 'category' | 'book';
}
