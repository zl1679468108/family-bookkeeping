import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsInt,
  Length,
} from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @Length(1, 50)
  name: string;

  @IsString()
  @IsIn(['expense', 'income'])
  type: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  location_name?: string;

  @IsOptional()
  @IsString()
  poi_id?: string;

  @IsOptional()
  @IsString()
  merchant_name?: string;

  @IsOptional()
  @IsString()
  book_id?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
