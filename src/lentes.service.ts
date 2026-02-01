import { Injectable } from '@nestjs/common';

// Interfaz para datos de diagnóstico del ESP32
export interface DiagnosticoESP32 {
    sensor_ok: boolean;
    bateria_ok: boolean;
    wifi_ok: boolean;
    backend_ok: boolean;
    lastSensorChangeMs: number;
    nivel1Activa: boolean;
}

export interface LensStatus {
    conectados: boolean;
    bateria: number;
    alarmaActiva: boolean;
    shouldSilence: boolean;
    ultimaActualizacion: Date;
    diagnostico?: DiagnosticoESP32; // Nuevo campo para puntos rojos en 3D
}

@Injectable()
export class LentesService {
    // Estado por email (para ESP32)
    private estadoPorEmail: Map<string, LensStatus> = new Map();

    // Obtener estado por userId (buscar por email asociado)
    getStatus(userId: number): LensStatus {
        // Por ahora retornar estado por defecto
        // En producción, buscaríamos el email del usuario
        return {
            conectados: false,
            bateria: 100,
            alarmaActiva: false,
            shouldSilence: false,
            ultimaActualizacion: new Date(),
        };
    }

    // Obtener estado por email
    getStatusByEmail(email: string): LensStatus {
        return this.estadoPorEmail.get(email) || {
            conectados: false,
            bateria: 100,
            alarmaActiva: false,
            shouldSilence: false,
            ultimaActualizacion: new Date(0), // 1970 - Offline por defecto
        };
    }

    // Actualizar estado desde el ESP32 (usando email)
    updateStatusByEmail(
        email: string,
        conectados: boolean,
        bateria: number,
        alarmaActiva = false,
        diagnostico?: DiagnosticoESP32,
    ): LensStatus {
        const existente = this.estadoPorEmail.get(email);

        const estado: LensStatus = {
            conectados,
            bateria,
            alarmaActiva,
            shouldSilence: existente?.shouldSilence ?? false,
            ultimaActualizacion: new Date(),
            diagnostico: diagnostico || existente?.diagnostico,
        };

        this.estadoPorEmail.set(email, estado);
        console.log(`📡 Estado lentes (${email}):`, estado);
        return estado;
    }

    // Silenciar alarma por email (llamado desde la app o controller)
    silenceByEmail(email: string): boolean {
        const estado = this.estadoPorEmail.get(email) || {
            conectados: true,
            bateria: 100,
            alarmaActiva: false,
            shouldSilence: true,
            ultimaActualizacion: new Date(),
        };

        estado.shouldSilence = true;
        estado.alarmaActiva = false;
        this.estadoPorEmail.set(email, estado);
        console.log(`🔇 Silencio marcado para ${email}`);
        return true;
    }

    // Verificar si el ESP32 debe silenciar (y resetear el flag)
    checkAndResetSilence(email: string): boolean {
        const estado = this.estadoPorEmail.get(email);
        if (estado?.shouldSilence) {
            estado.shouldSilence = false;
            this.estadoPorEmail.set(email, estado);
            console.log(`✅ Silencio confirmado para ${email}`);
            return true;
        }
        return false;
    }

    // Silenciar por userId (busca email y silencia)
    silenceAlarm(userId: number): boolean {
        // Buscar email por userId (en producción sería una consulta a DB)
        // Por ahora, marcar para todos
        console.log(`🔇 Alarma silenciada para userId ${userId}`);
        return true;
    }

    // Activar alarma
    activateAlarm(email: string): void {
        const estado = this.estadoPorEmail.get(email) || {
            conectados: true,
            bateria: 100,
            alarmaActiva: true,
            shouldSilence: false,
            ultimaActualizacion: new Date(),
        };
        estado.alarmaActiva = true;
        estado.shouldSilence = false;
        this.estadoPorEmail.set(email, estado);
        console.log(`🚨 Alarma activada para ${email}`);
    }
}
