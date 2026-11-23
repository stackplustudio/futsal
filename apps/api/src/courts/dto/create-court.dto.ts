import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';

export enum CourtType {
  FUTSAL_VINYL = 'FUTSAL_VINYL',
  FUTSAL_SYNTHETIC = 'FUTSAL_SYNTHETIC',
  FUTSAL_INTERLOCK = 'FUTSAL_INTERLOCK',
  MINI_SOCCER_OUTDOOR = 'MINI_SOCCER_OUTDOOR',
  MINI_SOCCER_INDOOR = 'MINI_SOCCER_INDOOR',
}

export class CreateCourtDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CourtType)
  type: CourtType;

  @IsOptional()
  @IsInt()
  @Min(1)
  lengthMeters?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  widthMeters?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
