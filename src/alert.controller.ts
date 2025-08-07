// src/alert.controller.ts
import { Controller, Post, Get, Body } from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './auth/dto/create-alert.dto';

@Controller('alert')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  async create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertService.createAndNotify(createAlertDto);
  }

  // ---> AGREGA ESTE ENDPOINT <---
  @Get()
  async findAll() {
    return this.alertService.findAll(); // <-- Esto debe devolver todas las alertas
  }
}
