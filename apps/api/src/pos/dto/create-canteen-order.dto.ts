import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CanteenOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsNumber()
  @Min(1)
  qty!: number;
}

export class CreateCanteenOrderDto {
  @IsString()
  @IsOptional()
  bookingCode?: string;

  @IsString()
  @IsNotEmpty()
  venueSlug!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CanteenOrderItemDto)
  items!: CanteenOrderItemDto[];
}
