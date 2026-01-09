
import { LAUNCH_ARGS } from '@core/constants/browser';
import { chromium, Browser, LaunchOptions } from 'playwright';

let browserInstance: Browser | null = null;

const proxySettings = {
    server: 'http://31.59.20.176:6754',
    username: 'smvvjenx',
    password: 'z4oh4fro5s9f'
};

/**
 * Inicia y obtiene una unica instancia de navegador
 * @returns `Promise<Browser>` Promesa que resuelve la instancia del navegador
 */
/**
 * Inicia y obtiene una única instancia de navegador (Local o Cloud)
 */
export async function FactoryBrowser(options?: LaunchOptions): Promise<Browser> {
    // 1. Reutilizar instancia si existe
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        console.log("🌐 Conectando a Browserless Cloud...");
        // En producción (cPanel), NO usamos chromium.launch() porque faltan librerías.
        // Nos conectamos directamente al navegador remoto.
        const params = new URLSearchParams({
            token: String(process.env.BROWSERLESS_TOKEN),
            stealth: 'true',
            '--disable-blink-features': 'AutomationControlled',
            // '--proxy-server': proxySettings.server
        });

        browserInstance = await chromium.connectOverCDP(
            `wss://production-sfo.browserless.io/chromium?${params.toString()}`
        );
    } else {
        console.log("💻 Iniciando navegador local...");
        // En desarrollo local (tu PC), usamos el navegador instalado.
        browserInstance = await chromium.launch({
            ...options,
            headless: true,
            proxy: proxySettings,
            args: LAUNCH_ARGS
        });
    }

    // Limpieza si se desconecta
    browserInstance.on('disconnected', () => {
        console.warn("⚠️ El navegador se ha desconectado.");
        browserInstance = null;
    });

    return browserInstance;
}