import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ToggleSparringDto {
  @IsBoolean()
  @IsNotEmpty()
  isOpenSparring!: boolean;

  @IsString()
  @IsOptional()
  sparringLevel?: string; // "Casual", "Kompetitif"

  @IsString()
  @IsOptional()
  notes?: string;
}
