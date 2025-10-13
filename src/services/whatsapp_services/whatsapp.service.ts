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
  public msg_p:Message_processing|null=null;
  private messageQueue: any[] = [];
  private isProcessingQueue = false;
  constructor(authFolder: string = 'auth_info') {
  this.authFolder = authFolder;
  }

  public async initialize(): Promise<WASocket> {
    const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
    this.saveCreds = saveCreds;
    this.sock = await makeWASocket({
      auth: state,
      logger: P({ level: 'silent' }),
      browser: Browsers.ubuntu('My App'),
      generateHighQualityLinkPreview: true,
    // ✅ These options prevent history sync
    syncFullHistory: false,           // Don't sync full message history
    markOnlineOnConnect: false,       // Don't show as "online" when connecting
    shouldSyncHistoryMessage: () => false, // Disable history message sync
    });
    console.log('✅ WhatsApp client initialized');
    this.bindEvents();
    await new Promise<void>((resolve) => {
    this.sock.ev.on('connection.update', (update) => {
      const { connection } = update;
      if (connection === 'open') {
        console.log('✅ Connected to WhatsApp Web');
        resolve();
      }
    });
  });
  this.msg_p=new Message_processing(this.sock)
   
    return this.sock;
  }

  private bindEvents(): void {
    this.sock.ev.on('messages.upsert', this.handleMessagesUpsert.bind(this));
    this.sock.ev.on("connection.update",this.handleConnectionUpdate.bind(this))
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
  }

  private async handleMessagesUpsert({ messages }: BaileysEventMap['messages.upsert']): Promise<void> {
    const msg = messages[0];
    if (!msg.key.fromMe && this.msg_p) {
      this.messageQueue.push(msg)
      this.processQueue()
    }
  }
  private async processQueue():Promise<void>{
    
    if(this.isProcessingQueue) return;
    this.isProcessingQueue=true;

    while(this.messageQueue.length>0)
    {
     try{ const popmsg=this.messageQueue.shift();
     await  this.msg_p?.messageparser(popmsg)
      console.log('Processed message ------->', popmsg);
     await this.sleep(500);
    }
      catch(e)
      {
          console.error('Error processing message:', e);
           await this.sleep(1000);
      }
    }

    this.isProcessingQueue=false;

  }


  private async reconnect(): Promise<void> {
    console.log('Reconnecting ...');
    await this.initialize();
  }
  
  private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
  }

}

