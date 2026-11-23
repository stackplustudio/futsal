import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MidtransWebhookDto {
  @IsString()
  @IsNotEmpty()
  order_id!: string;

  @IsString()
  @IsNotEmpty()
  status_code!: string;

  @IsString()
  @IsNotEmpty()
  gross_amount!: string;

  @IsString()
  @IsNotEmpty()
  signature_key!: string;

  @IsString()
  @IsNotEmpty()
  transaction_status!: string;

  @IsString()
  @IsOptional()
  fraud_status?: string;

  @IsString()
  @IsOptional()
  payment_type?: string;
}
