import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req) {
    return {
      message: 'Acceso correcto al perfil 👤',
      user: req.user,
    };
  }
}