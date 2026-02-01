import { Injectable } from '@nestjs/common';

export interface LensStatus {
    conectados: boolean;
    bateria: number;
    alarmaActiva: boolean;
    ultimaActualizacion: Date;
}

@Injectable()
export class LentesService {
    // Estado de los lentes por usuario (en memoria por ahora)
    private estadoLentes: Map<number, LensStatus> = new Map();

    // Obtener estado de los lentes de un usuario
    getStatus(userId: number): LensStatus {
        if (!this.estadoLentes.has(userId)) {
            // Estado por defecto si no hay registro
            return {
                conectados: false,
                bateria: 100,
                alarmaActiva: false,
                ultimaActualizacion: new Date(),
            };
        }
        return this.estadoLentes.get(userId)!;
    }

    // Actualizar estado desde el ESP32
    updateStatus(
        userId: number,
        conectados: boolean,
        bateria: number,
        alarmaActiva = false,
    ): LensStatus {
        const estado: LensStatus = {
            conectados,
            bateria,
            alarmaActiva,
            ultimaActualizacion: new Date(),
        };
        this.estadoLentes.set(userId, estado);
        console.log(`📡 Estado lentes actualizado para usuario ${userId}:`, estado);
        return estado;
    }

    // Silenciar alarma
    silenceAlarm(userId: number): boolean {
        const estado = this.estadoLentes.get(userId);
        if (estado) {
            estado.alarmaActiva = false;
            this.estadoLentes.set(userId, estado);
            console.log(`🔇 Alarma silenciada para usuario ${userId}`);
            return true;
        }
        return false;
    }

    // Activar alarma (llamado cuando el ESP32 detecta fatiga)
    activateAlarm(userId: number): void {
        const estado = this.estadoLentes.get(userId) || {
            conectados: true,
            bateria: 100,
            alarmaActiva: true,
            ultimaActualizacion: new Date(),
        };
        estado.alarmaActiva = true;
        this.estadoLentes.set(userId, estado);
        console.log(`🚨 Alarma activada para usuario ${userId}`);
    }
}
