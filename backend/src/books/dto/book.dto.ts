import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}

export class InviteMemberDto {
  @IsString()
  email: string;
}

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}

export class RenameBookDto {
  @IsString()
  @MaxLength(100)
  name: string;
}
