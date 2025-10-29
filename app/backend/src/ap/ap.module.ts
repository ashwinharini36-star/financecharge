import { Module } from '@nestjs/common';
import { ApController } from './ap.controller';
import { ApService } from './ap.service';

@Module({
  controllers: [ApController],
  providers: [ApService],
})
export class ApModule {}
