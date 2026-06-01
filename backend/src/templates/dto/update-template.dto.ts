import { IsOptional, IsString, IsNumber, IsInt, IsIn, Length, MaxLength } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional() @IsString() @Length(1, 50) name?: string;
  @IsOptional() @IsString() @IsIn(['expense', 'income']) type?: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() category_id?: string;
  @IsOptional() @IsString() @MaxLength(200) note?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() @MaxLength(100) location_name?: string;
  @IsOptional() @IsString() @MaxLength(100) poi_id?: string;
  @IsOptional() @IsString() @MaxLength(100) merchant_name?: string;
  @IsOptional() @IsString() book_id?: string;
  @IsOptional() @IsInt() sort_order?: number;
}
