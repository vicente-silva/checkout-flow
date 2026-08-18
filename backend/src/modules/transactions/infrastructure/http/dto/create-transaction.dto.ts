import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  deliveryId: string;

  @ApiProperty({ default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
