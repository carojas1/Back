import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './alert.entity';
import { User } from './users/user.entity';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, User])],
  controllers: [AlertController],
  providers: [AlertService],
})
export class AlertModule { }
