
export class RabbitOptions {
  public readonly type: string;
  public readonly host: string; // Esto será el host/url validado
  public readonly port: string;
  public readonly user: string;
  public readonly pass: string;
  public readonly vhost: string;
  public readonly baseUrl?: string; // Específico para HTTP

  constructor(
    type: string,
    host: string,
    port: string,
    user: string = 'guest',
    pass: string = 'guest',
    vhost: string = '%2f'
  ) {
    this.type = type.toLowerCase();
    this.host = host;
    this.port = port;
    this.user = user;
    this.pass = pass;
    this.vhost = vhost; // Default vhost

    // Validamos inmediatamente al instanciar
    //this.validate();

    // Si es HTTP, asignamos baseUrl por conveniencia
    if (this.type === 'http' || this.type === 'rest') {
      this.baseUrl = this.host;
    }
  }

  /**
   * Lógica de validación centralizada
   */
  private validate() {
    if (!this.host) throw Error('El HOST/URL no puede estar vacío.');

    switch (this.type) {
      case 'stomp':
        if (!this.host.startsWith('ws://') && !this.host.startsWith('wss://')) {
          throw Error(
            `Para STOMP, el host debe iniciar con 'ws://' o 'wss://'. Recibido: '${this.host}'`
          );
        }
        break;

      case 'http':
      case 'rest':
        if (!this.host.startsWith('http://') && !this.host.startsWith('https://')) {
          throw Error(
            `Para HTTP, el host debe iniciar con 'http://' o 'https://'. Recibido: '${this.host}'`
          );
        }
        break;

      case 'amqp':
      case 'amqps':
        if (!this.host.startsWith('amqp://') && !this.host.startsWith('amqps://')) {
          throw Error(
            `Para AMQP, el host debe iniciar con 'amqp://' o 'amqps://'. Recibido: '${this.host}'`
          );
        }
        break;

      default:
        // Opcional: Si quieres validar que el tipo sea conocido
        throw Error(`Tipo de adaptador desconocido: ${this.type}`);
        break;
    }
  }

  /**
   * Método helper para obtener la connection string completa de AMQP
   * (Une usuario y pass con el host)
   */
  getAmqpConnectionString(): string {
    if (!this.host.includes('://')) return this.host;

    const parts = this.host.split('://');
    const protocol = parts[0];
    const address = parts[1];

    return `${protocol}://${this.user}:${encodeURIComponent(this.pass)}@${address}`;
  }
}