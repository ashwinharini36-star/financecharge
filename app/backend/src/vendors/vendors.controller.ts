import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors')
@Controller('vendors')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.vendorsService.findAll(req.user.org_id);
  }
}
