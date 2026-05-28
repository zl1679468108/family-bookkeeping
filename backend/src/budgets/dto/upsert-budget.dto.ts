import { IsString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class BudgetEntry {
  @IsString()
  category: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class UpsertBudgetDto {
  @IsString()
  month: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetEntry)
  budgets: BudgetEntry[];
}
