import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('cash-pulse')
  @ApiOperation({ summary: 'Get cash pulse data' })
  @ApiResponse({ status: 200, description: 'Cash pulse metrics' })
  async getCashPulse(@Request() req) {
    return this.dashboardService.getCashPulse(req.user.org_id);
  }
}
