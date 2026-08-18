import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class PayTransactionDto {
  @ApiProperty({ description: 'Card token obtained client-side from Wompi with the public key' })
  @IsString()
  cardToken: string;

  @ApiProperty({ description: 'Merchant acceptance token obtained client-side from Wompi' })
  @IsString()
  acceptanceToken: string;

  @ApiProperty({ default: 1, minimum: 1, maximum: 36 })
  @IsInt()
  @Min(1)
  @Max(36)
  installments: number;
}
