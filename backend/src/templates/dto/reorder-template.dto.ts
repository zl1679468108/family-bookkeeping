import { IsArray, IsString } from 'class-validator';

export class ReorderTemplateDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
