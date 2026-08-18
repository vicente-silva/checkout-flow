import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../../domain/product.entity';

export class ProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ description: 'Price in COP cents, e.g. 4500000 = $45,000 COP' })
  priceInCents: number;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  stockQuantity: number;

  @ApiProperty()
  inStock: boolean;

  static fromDomain(product: Product): ProductDto {
    const dto = new ProductDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.priceInCents = product.priceInCents;
    dto.imageUrl = product.imageUrl;
    dto.sku = product.sku;
    dto.stockQuantity = product.stockQuantity;
    dto.inStock = product.stockQuantity > 0;
    return dto;
  }
}
