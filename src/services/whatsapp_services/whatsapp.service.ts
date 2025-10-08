import makeWASocket, {
  WASocket,
  useMultiFileAuthState,
  Browsers,
  DisconnectReason,
  BaileysEventMap,
  proto
} from '@whiskeysockets/baileys';
import P from 'pino';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import { Message_processing } from '../Message_processing/msgpros';

export class WhatsAppClient {
  private sock!: WASocket;
  private saveCreds!: () => Promise<void>;
  private readonly authFolder: string;
  private msg_p:Message_processing;
  constructor(authFolder: string = 'auth_info') {
  this.authFolder = authFolder;
  this.initialize()
  this.msg_p=new Message_processing(this.sock)
  }

  public async initialize(): Promise<WASocket> {
    const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
    this.saveCreds = saveCreds;

    this.sock = makeWASocket({
      auth: state,
      logger: P({ level: 'silent' }),
      browser: Browsers.ubuntu('My App'),
      generateHighQualityLinkPreview: true,
    });

    this.bindEvents();
    console.log('✅ WhatsApp client initialized');
    return this.sock;
  }

  private bindEvents(): void {
    this.sock.ev.on('messages.upsert', this.handleMessagesUpsert.bind(this));
  }


  private async handleCredsUpdate(): Promise<void> {
    if (this.saveCreds) await this.saveCreds();
  }


  private async handleConnectionUpdate(update: BaileysEventMap['connection.update']): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('QR code received, saving to qr.png...');
      await QRCode.toFile('qr.png', qr);
    }

    if (connection === 'close') {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      if (reason === DisconnectReason.restartRequired) {
        console.log('Restart required, reconnecting...');
        await this.reconnect();
      } else {
        console.warn('Connection closed:', reason);
      }
    }

    if (connection === 'open') {
      console.log('Connected to WhatsApp Web');
    }
  }

  private async handleMessagesUpsert({ messages }: BaileysEventMap['messages.upsert']): Promise<void> {
    const msg = messages[0];
    if (!msg.key.fromMe) {
      const text = this.getMessageText(msg);
      console.log('Received message:', text);
      
    }
  }


  private getMessageText(msg: proto.IWebMessageInfo): string | undefined {
    const message = msg.message;
    if (!message) return undefined;
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    return undefined;
  }

  private async reconnect(): Promise<void> {
    console.log('Reconnecting ...');
    await this.initialize();
  }

}

