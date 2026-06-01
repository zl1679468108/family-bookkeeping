import { IsOptional, IsNumber } from 'class-validator';

export class ExecuteTemplateDto {
  @IsOptional()
  @IsNumber()
  amount?: number;
}
