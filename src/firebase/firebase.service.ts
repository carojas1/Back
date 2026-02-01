// src/firebase/firebase.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private firebaseApp: admin.app.App | null = null;

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!projectId || !clientEmail || !privateKey) {
            console.log('⚠️ Firebase no configurado - variables de entorno faltantes');
            console.log('   Necesitas: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
            return;
        }

        try {
            this.firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log('✅ Firebase inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
        }
    }

    /**
     * Enviar notificación push a un dispositivo
     */
    async sendPushNotification(
        fcmToken: string,
        title: string,
        body: string,
        data?: Record<string, string>,
    ): Promise<boolean> {
        if (!this.firebaseApp) {
            console.log('⚠️ Firebase no disponible, notificación no enviada');
            return false;
        }

        try {
            const message: admin.messaging.Message = {
                token: fcmToken,
                notification: {
                    title,
                    body,
                },
                data: data || {},
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'alertavision_alerts',
                    },
                },
            };

            const response = await admin.messaging().send(message);
            console.log('📱 Notificación enviada:', response);
            return true;
        } catch (error) {
            console.error('❌ Error enviando notificación:', error);
            return false;
        }
    }

    /**
     * Enviar notificación de alerta de fatiga
     */
    async sendFatigueAlert(fcmToken: string, nivelFatiga: number): Promise<boolean> {
        const title = '⚠️ Alerta de Fatiga';
        const body = nivelFatiga >= 7
            ? '¡PELIGRO! Nivel de fatiga muy alto. Detente y descansa.'
            : `Se detectó fatiga (nivel ${nivelFatiga}). Considera tomar un descanso.`;

        return this.sendPushNotification(fcmToken, title, body, {
            type: 'fatigue_alert',
            level: nivelFatiga.toString(),
        });
    }

    /**
     * Enviar notificación de batería baja
     */
    async sendLowBatteryAlert(fcmToken: string, batteryLevel: number): Promise<boolean> {
        const title = '🔋 Batería Baja';
        const body = batteryLevel <= 5
            ? `¡CRÍTICO! Batería al ${batteryLevel}%. Carga tus lentes.`
            : `Batería al ${batteryLevel}%. Considera cargar tus lentes.`;

        return this.sendPushNotification(fcmToken, title, body, {
            type: 'low_battery',
            level: batteryLevel.toString(),
        });
    }

    /**
     * Enviar notificación de desconexión
     */
    async sendDisconnectionAlert(fcmToken: string): Promise<boolean> {
        return this.sendPushNotification(
            fcmToken,
            '📡 Lentes Desconectados',
            'Tus lentes se han desconectado. Verifica la conexión.',
            { type: 'disconnection' },
        );
    }
}
