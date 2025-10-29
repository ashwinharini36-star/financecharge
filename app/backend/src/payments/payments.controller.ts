import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Payment webhook' })
  @ApiResponse({ status: 202, description: 'Webhook accepted' })
  async webhook(@Param('provider') provider: string, @Body() payload: any) {
    return this.paymentsService.processWebhook(provider, payload);
  }
}
