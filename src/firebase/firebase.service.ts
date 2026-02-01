import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private app: admin.app.App | null = null;

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        if (admin.apps.length > 0) {
            this.app = admin.apps[0];
            console.log('✅ Firebase ya inicializado');
            return;
        }

        const projectId = process.env['FIREBASE_PROJECT_ID'];
        const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
        const privateKey = process.env['FIREBASE_PRIVATE_KEY'];

        if (!projectId || !clientEmail || !privateKey) {
            console.log('⚠️ FALTAN VARIABLES DE FIREBASE EN RENDER/ENV');
            return;
        }

        try {
            this.app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    // Manejar saltos de línea en la clave privada
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
            console.log('✅ Firebase Admin inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
        }
    }

    async sendPushNotification(fcmToken: string, title: string, body: string, data?: any) {
        if (!this.app) return false;
        try {
            await admin.messaging().send({
                token: fcmToken,
                notification: { title, body },
                data: data || {},
            });
            return true;
        } catch (e) {
            console.error('Error enviando notificación:', e);
            return false;
        }
    }

    async verifyToken(token: string): Promise<admin.auth.DecodedIdToken | null> {
        if (!this.app) return null;
        try {
            return await admin.auth().verifyIdToken(token);
        } catch (error) {
            console.error('❌ Token inválido:', error);
            return null;
        }
    }
    async createUser(email: string, password: string, displayName: string) {
        if (!this.app) throw new Error('Firebase no inicializado');
        try {
            return await admin.auth().createUser({
                email,
                password,
                displayName,
            });
        } catch (error) {
            console.error('❌ Error creando usuario en Firebase:', error);
            throw error;
        }
    }
}
