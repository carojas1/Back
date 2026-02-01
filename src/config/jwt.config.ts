// src/config/jwt.config.ts
// ⚠️ ARCHIVO ÚNICO PARA JWT - NUNCA DUPLIQUES EL SECRET EN OTRO LUGAR ⚠️

/**
 * JWT SECRET CENTRALIZADO
 * 
 * Este archivo es la ÚNICA fuente de verdad para el JWT secret.
 * Si necesitas el secret, IMPORTA desde aquí.
 * 
 * NUNCA escribas el secret directamente en auth.module.ts o jwt.strategy.ts
 */
export const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'Antonella123.0',
    expiresIn: '7d',
};

// Para verificar en logs (sin exponer el secret completo)
export const getJwtDebugInfo = () => ({
    secretPrefix: JWT_CONFIG.secret.substring(0, 4) + '***',
    expiresIn: JWT_CONFIG.expiresIn,
    source: process.env.JWT_SECRET ? 'ENV' : 'DEFAULT',
});
