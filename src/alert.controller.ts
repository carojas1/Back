import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './auth/dto/create-alert.dto';
import { JwtAuthGuard } from './auth/jwt-auth/jwt-auth.guard'; 

@Controller('alert')
@UseGuards(JwtAuthGuard) 
export class AlertController { // <--- AQUI ESTABA EL ERROR (Decía UsersController)
  constructor(private readonly alertService: AlertService) {}

  @Post()
  async create(@Request() req, @Body() createAlertDto: CreateAlertDto) {
    return this.alertService.createAndNotify(req.user, createAlertDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.alertService.findAll(req.user); 
  }
}