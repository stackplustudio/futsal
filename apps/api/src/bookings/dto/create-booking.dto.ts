import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEmail,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreatePublicBookingDto {
  @IsString()
  @IsNotEmpty()
  venueSlug: string;

  @IsString()
  @IsNotEmpty()
  courtId: string;

  /** Format YYYY-MM-DD */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bookingDate harus berupa format YYYY-MM-DD',
  })
  bookingDate: string;

  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsInt()
  @Min(1)
  @Max(6)
  durationHours: number;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  /** Nomor WhatsApp aktif */
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  teamName?: string;

  @IsOptional()
  @IsBoolean()
  isOpenSparring?: boolean;

  @IsOptional()
  @IsString()
  sparringLevel?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
