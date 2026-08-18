import { Controller, Get, HttpException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { httpStatusForDomainError, toErrorBody } from '@shared/infrastructure/http/domain-error.mapper';
import { ListProductsUseCase } from '../../application/list-products.use-case';
import { GetProductUseCase } from '../../application/get-product.use-case';
import { ProductDto } from './dto/product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List store products with current stock' })
  @ApiOkResponse({ type: ProductDto, isArray: true })
  async list(): Promise<ProductDto[]> {
    const result = await this.listProductsUseCase.execute();
    return result.getValue().map(ProductDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by id' })
  @ApiOkResponse({ type: ProductDto })
  async getById(@Param('id') id: string): Promise<ProductDto> {
    const result = await this.getProductUseCase.execute(id);
    return result.match(
      (product) => ProductDto.fromDomain(product),
      (error) => {
        throw new HttpException(toErrorBody(error), httpStatusForDomainError(error));
      },
    );
  }
}
