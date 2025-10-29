import { Controller, Post, UseGuards, Request, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApService } from './ap.service';

@ApiTags('AP')
@Controller('ap')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ApController {
  constructor(private apService: ApService) {}

  @Post('invoices/ingest')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload vendor invoice (PDF)' })
  @ApiResponse({ status: 201, description: 'Draft AP invoice created' })
  async ingestInvoice(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('vendor_id') vendorId?: string,
  ) {
    return this.apService.ingestInvoice(req.user.org_id, req.user.sub, file, vendorId);
  }
}
