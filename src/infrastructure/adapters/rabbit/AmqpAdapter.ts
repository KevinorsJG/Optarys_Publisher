import amqp, { Channel, ChannelModel } from 'amqplib';
import { RabbitOptions } from './options/RabbitOptions';

export class AmqpAdapter {

  private connection?: ChannelModel;
  private channel?: Channel;

  constructor(protected options: RabbitOptions) { }

  async connect() {
    this.connection = await amqp.connect({
      hostname: this.options.host,
      port: parseInt(this.options.port, 10),
      username: this.options.user,
      password: this.options.pass,
      vhost: this.options.vhost
    });
    this.channel = await this.connection.createChannel();

  }

  async publish(queue: string, message: any) {
    await this.channel?.assertQueue(queue, { durable: true });
    this.channel?.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  }

  async subscribe(queue: string, callback: (msg: any) => void) {
    await this.channel?.assertQueue(queue, { durable: true });
    this.channel?.consume(queue, (msg) => {
      if (msg) {
        callback(JSON.parse(msg.content.toString()));
        this.channel?.ack(msg);
      }
    });
  }

  async close() {
    await this.connection?.close();
  }
}