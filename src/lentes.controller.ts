import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { LentesService, LensStatus } from './lentes.service';
import { JwtAuthGuard } from './auth/jwt-auth/jwt-auth.guard';

@Controller('lentes')
export class LentesController {
    constructor(private readonly lentesService: LentesService) { }

    /**
     * GET /lentes/status
     * Obtener estado actual de los lentes del usuario autenticado
     */
    @Get('status')
    @UseGuards(JwtAuthGuard)
    getStatus(@Request() req) {
        const userId = req.user.id;
        return this.lentesService.getStatus(userId);
    }

    /**
     * POST /lentes/silence
     * Silenciar la alarma del ESP32 desde la app
     */
    @Post('silence')
    @UseGuards(JwtAuthGuard)
    silenceAlarm(@Request() req) {
        const userId = req.user.id;
        const silenciado = this.lentesService.silenceAlarm(userId);
        return {
            success: silenciado,
            message: silenciado ? 'Alarma silenciada' : 'No hay alarma activa',
        };
    }

    /**
     * POST /lentes/update
     * Endpoint para que el ESP32 actualice el estado de los lentes
     * No requiere autenticación JWT (usa email de usuario)
     */
    @Post('update')
    updateStatus(
        @Body()
        body: {
            email: string;
            conectados: boolean;
            bateria: number;
            alarmaActiva?: boolean;
        },
    ) {
        // Por ahora simulamos el userId basándonos en el email
        // En producción, buscaríamos el usuario por email
        console.log('📡 ESP32 actualizando estado:', body);

        // Retornamos confirmación
        return {
            success: true,
            message: 'Estado actualizado',
            shouldSilence: false, // El frontend puede setear esto a true para silenciar
        };
    }

    /**
     * POST /lentes/check-silence
     * El ESP32 pregunta si debe silenciar la alarma
     */
    @Post('check-silence')
    checkSilence(@Body() body: { email: string }) {
        console.log('🔇 ESP32 verificando si debe silenciar:', body.email);
        // Por ahora siempre retorna false
        // En producción, verificaríamos el estado de silencio del usuario
        return {
            shouldSilence: false,
        };
    }
}
