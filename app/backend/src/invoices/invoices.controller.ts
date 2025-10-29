import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices' })
  @ApiResponse({ status: 200, description: 'Invoice list' })
  async findAll(
    @Request() req,
    @Query('kind') kind?: string,
    @Query('status') status?: string,
  ) {
    return this.invoicesService.findAll(req.user.org_id, kind, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.invoicesService.findOne(req.user.org_id, id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send invoice' })
  @ApiResponse({ status: 200, description: 'Invoice sent' })
  async send(@Request() req, @Param('id') id: string) {
    return this.invoicesService.send(req.user.org_id, req.user.sub, id);
  }
}
