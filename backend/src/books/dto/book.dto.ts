import { IsString, IsOptional, MaxLength, IsEmail, IsNotEmpty } from 'class-validator';

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
  @MaxLength(500)
  icon?: string;

  @IsOptional()
  @IsString()
  icon_id?: string;
}

export class InviteMemberDto {
  @IsString()
  @IsEmail()
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
  @MaxLength(500)
  icon?: string;

  @IsOptional()
  @IsString()
  icon_id?: string;
}

/** B-M15: DTO for transfer owner */
export class TransferOwnerDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  newOwnerEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

/** B-M15: DTO for update description */
export class UpdateDescriptionDto {
  @IsString()
  @IsNotEmpty()
  description: string;
}
