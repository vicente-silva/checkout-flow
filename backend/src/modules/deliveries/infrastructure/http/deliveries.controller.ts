import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { httpStatusForDomainError, toErrorBody } from '@shared/infrastructure/http/domain-error.mapper';
import { CreateDeliveryUseCase } from '../../application/create-delivery.use-case';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly createDeliveryUseCase: CreateDeliveryUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create delivery information for a customer, computing the fee' })
  @ApiCreatedResponse()
  async create(@Body() dto: CreateDeliveryDto) {
    const result = await this.createDeliveryUseCase.execute({
      ...dto,
      country: dto.country ?? 'Colombia',
    });
    return result.match(
      (delivery) => delivery,
      (error) => {
        throw new HttpException(toErrorBody(error), httpStatusForDomainError(error));
      },
    );
  }
}
