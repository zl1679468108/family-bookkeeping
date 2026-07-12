import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateIconDto {
  @IsString()
  @IsIn(['category', 'book', 'avatar'])
  icon_type: 'category' | 'book' | 'avatar';
}

export class QueryIconDto {
  @IsOptional()
  @IsString()
  @IsIn(['category', 'book', 'avatar'])
  icon_type?: 'category' | 'book' | 'avatar';
}
