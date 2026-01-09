export const wsGatewayOptions = {
    namespace: 'events', // Ruta por la que se accederá al gateway
    cors: { origin: '*' }, // Configuración CORS para permitir todas las conexiones
    transports: ['polling', 'websocket'], // Métodos de transporte permitidos
}