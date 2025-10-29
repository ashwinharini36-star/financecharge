import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.productsService.findAll(req.user.org_id);
  }
}
