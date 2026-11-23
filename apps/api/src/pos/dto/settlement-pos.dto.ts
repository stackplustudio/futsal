import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CanteenOrderItemDto } from './create-canteen-order.dto';
import { PaymentMethod } from '@prisma/client';

export class SettlementPosDto {
  @IsString()
  @IsNotEmpty()
  bookingCode!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cashReceived?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CanteenOrderItemDto)
  additionalItems?: CanteenOrderItemDto[];
}
