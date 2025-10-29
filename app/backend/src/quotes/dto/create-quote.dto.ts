import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsArray, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteItemDto {
  @ApiProperty()
  @IsUUID()
  product_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  qty: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  unit_amount: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_percent: number = 0;
}

export class CreateQuoteDto {
  @ApiProperty()
  @IsUUID()
  customer_id: string;

  @ApiProperty({ default: 'INR' })
  @IsString()
  currency: string = 'INR';

  @ApiProperty({ type: [QuoteItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}
