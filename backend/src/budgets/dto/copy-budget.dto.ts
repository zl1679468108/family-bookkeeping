import { IsString } from 'class-validator';

export class CopyBudgetDto {
  @IsString()
  targetMonth: string;
}
