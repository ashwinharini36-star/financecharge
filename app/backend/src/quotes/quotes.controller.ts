import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { RoleGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('CPQ')
@Controller('quotes')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles('SalesRep', 'FinanceManager', 'Owner')
  @ApiOperation({ summary: 'Create quote' })
  @ApiResponse({ status: 201, description: 'Quote created' })
  async create(@Request() req, @Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(req.user.org_id, req.user.sub, createQuoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'List quotes' })
  @ApiResponse({ status: 200, description: 'Quote list' })
  async findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.quotesService.findAll(req.user.org_id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote by ID' })
  @ApiResponse({ status: 200, description: 'Quote details' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.quotesService.findOne(req.user.org_id, id);
  }

  @Post(':id/approve')
  @UseGuards(RoleGuard)
  @Roles('Approver', 'FinanceManager', 'Owner')
  @ApiOperation({ summary: 'Approve quote' })
  @ApiResponse({ status: 200, description: 'Quote approved' })
  async approve(@Request() req, @Param('id') id: string) {
    return this.quotesService.approve(req.user.org_id, req.user.sub, id);
  }

  @Post(':id/convert-to-invoice')
  @UseGuards(RoleGuard)
  @Roles('SalesRep', 'FinanceManager', 'Owner')
  @ApiOperation({ summary: 'Convert quote to invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  async convertToInvoice(@Request() req, @Param('id') id: string) {
    return this.quotesService.convertToInvoice(req.user.org_id, req.user.sub, id);
  }
}
