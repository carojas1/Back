import { Controller, Get, Post, Body, Put, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. OBTENER TODOS (Solo Admin) - YA LO TENÍAS
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(@Req() req) {
    // Si quieres quitar la restricción de admin temporalmente para probar, comenta el if
    /* if (req.user.rol !== 'admin') {
      return { error: 'No autorizado' };
    } */
    return this.usersService.findAll();
  }

  // 2. PERFIL (YA LO TENÍAS)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req) {
    return req.user;
  }

  // --- ESTO ES LO QUE TE FALTABA ---

  // 3. CREAR USUARIO
  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  // 4. EDITAR USUARIO
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(+id, body);
  }

  // 5. ELIMINAR USUARIO
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}