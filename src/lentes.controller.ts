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
     * Obtener estado de los lentes (autenticado)
     */
    @Get('status')
    @UseGuards(JwtAuthGuard)
    getStatus(@Request() req): LensStatus {
        // Usar el email del usuario para obtener estado
        const email = req.user.email;
        return this.lentesService.getStatusByEmail(email);
    }

    /**
     * POST /lentes/silence
     * Silenciar la alarma desde la app (autenticado)
     */
    @Post('silence')
    @UseGuards(JwtAuthGuard)
    silenceAlarm(@Request() req) {
        const email = req.user.email;
        console.log(`🔇 Usuario ${email} solicita silenciar alarma`);

        const silenciado = this.lentesService.silenceByEmail(email);
        return {
            success: silenciado,
            message: 'Alarma silenciada - El ESP32 se detendrá en su próxima verificación',
        };
    }

    /**
     * POST /lentes/update
     * Endpoint para que el ESP32 actualice el estado
     * NO requiere JWT (usa email directamente)
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
        console.log('📡 ESP32 actualizando estado:', body);

        this.lentesService.updateStatusByEmail(
            body.email,
            body.conectados,
            body.bateria,
            body.alarmaActiva ?? false,
        );

        return {
            success: true,
            message: 'Estado actualizado',
        };
    }

    /**
     * POST /lentes/check-silence
     * El ESP32 pregunta si debe silenciar la alarma
     * NO requiere JWT
     */
    @Post('check-silence')
    checkSilence(@Body() body: { email: string }) {
        console.log('🔇 ESP32 verificando silencio para:', body.email);

        const shouldSilence = this.lentesService.checkAndResetSilence(body.email);

        return {
            shouldSilence,
        };
    }

    /**
     * POST /lentes/activate-alarm
     * El ESP32 notifica que la alarma está activa
     * NO requiere JWT
     */
    @Post('activate-alarm')
    activateAlarm(@Body() body: { email: string }) {
        console.log('🚨 ESP32 activó alarma para:', body.email);

        this.lentesService.activateAlarm(body.email);

        return {
            success: true,
            message: 'Alarma registrada',
        };
    }
}
