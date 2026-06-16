import { Module } from '@nestjs/common';
import { IconsController } from './icons.controller';
import { IconsService } from './icons.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [IconsController],
  providers: [IconsService],
  exports: [IconsService],
})
export class IconsModule {}
