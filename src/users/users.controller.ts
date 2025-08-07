import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(@Req() req) {
    if (req.user.rol !== 'admin') {
      return { error: 'No autorizado' };
    }
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req) {
    const { id, nombre, email, telefono, rol } = req.user;
    return { id, nombre, email, telefono, rol };
  }
}
