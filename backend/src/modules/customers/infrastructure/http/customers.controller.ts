import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { httpStatusForDomainError, toErrorBody } from '@shared/infrastructure/http/domain-error.mapper';
import { CreateOrGetCustomerUseCase } from '../../application/create-or-get-customer.use-case';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly createOrGetCustomerUseCase: CreateOrGetCustomerUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create a customer, or return the existing one for that email' })
  @ApiCreatedResponse()
  async create(@Body() dto: CreateCustomerDto) {
    const result = await this.createOrGetCustomerUseCase.execute(dto);
    return result.match(
      (customer) => customer,
      (error) => {
        throw new HttpException(toErrorBody(error), httpStatusForDomainError(error));
      },
    );
  }
}
