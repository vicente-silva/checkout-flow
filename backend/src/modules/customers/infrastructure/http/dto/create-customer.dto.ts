import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+573001234567' })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'phoneNumber must be a valid phone number' })
  phoneNumber: string;

  @ApiProperty({ example: 'CC', enum: ['CC', 'CE', 'NIT', 'PP'] })
  @IsString()
  @Length(2, 10)
  documentType: string;

  @ApiProperty({ example: '1020304050' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;
}
