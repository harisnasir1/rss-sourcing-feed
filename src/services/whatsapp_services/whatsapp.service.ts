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
  private isReconnecting = false;
  private reconnectries=0;
  private maxretryallowed=6;
  constructor(authFolder: string = 'auth_info') {
  this.authFolder = authFolder;
  }

  public async initialize(): Promise<WASocket> {
    if(this.reconnectries===this.maxretryallowed){
      console.warn("-------------Reach Max retries--------")
      return this.sock
    }
    this.reconnectries=this.reconnectries+1;
    const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
    this.saveCreds = saveCreds;
    this.sock =  makeWASocket({
      auth: state,
      version : [2, 3000, 1025190524],
      logger: P({ level: 'silent' }),
      browser: Browsers.ubuntu('ack'),
      generateHighQualityLinkPreview: true,
    // ✅ These options prevent history sync
    syncFullHistory: false,           // Don't sync full message history
    markOnlineOnConnect: false,       // Don't show as "online" when connecting
    shouldSyncHistoryMessage: () => false,// Disable history message sync
    keepAliveIntervalMs: 30000 
    });
    console.log('✅ WhatsApp client initialized');
    

  this.bindEvents();
  this.msg_p=new Message_processing(this.sock)
   
    return this.sock;
  }

  private bindEvents(): void {
      this.sock.ev.on('creds.update', this.saveCreds);
    this.sock.ev.on("connection.update",this.handleConnectionUpdate.bind(this))
  }


  private async handleCredsUpdate(): Promise<void> {
    if (this.saveCreds) await this.saveCreds();
  }

  private async handleConnectionUpdate(update: BaileysEventMap['connection.update']): Promise<void> {
    const { connection, lastDisconnect, qr } = update;
  
     if (connection === 'open') {
        console.log('✅ Connected to WhatsApp Web');
        this.reconnectries=0;
        this.isReconnecting=false
        this.sock.ev.on('messages.upsert', this.handleMessagesUpsert.bind(this));
      }
 if (qr) {
      console.log('QR code received, saving to qr.png...');
      await QRCode.toFile('qr.png', qr);
    }
    if (connection === 'close')
       {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
       console.warn('❌ Connection closed:', {
                reason,
                timestamp: new Date().toISOString(),
                error: lastDisconnect?.error
            });
       
       if (this.isReconnecting) {
           console.log('⏭️ Reconnection already in progress, skipping...');
           return;
       }
        this.isReconnecting = true;

        // ✅ Handle different disconnect reasons
            if (reason === DisconnectReason.loggedOut) {
                console.warn('🚪 Logged out - delete auth_info folder and restart server');
                this.isReconnecting = false;
                return;
            }

      if (reason === DisconnectReason.restartRequired) {
        console.warn('🔄 Restart required - reconnecting in 2 seconds...');
          setTimeout(() => this.reconnect(), 2000);
          return
      } 

      if (reason === 428) { // Connection closed
                console.warn('📡 Connection closed by server - reconnecting in 5 seconds...');
                setTimeout(() => this.reconnect(), 5000);
                return;
          }
       
       if (reason === DisconnectReason.connectionLost) {
            console.warn('📡 Connection lost - reconnecting in 5 seconds...');
            setTimeout(() => this.reconnect(), 5000);
            return;
        }
         if (reason === DisconnectReason.timedOut) {
                console.warn('⏱️ Connection timed out - reconnecting in 10 seconds...');
                setTimeout(() => this.reconnect(), 10000);
                return;
            }
                console.warn(`🔄 Unknown disconnect reason (${reason}) - reconnecting in 10 seconds...`);
            setTimeout(() => this.reconnect(), 10000);
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
    
     await this.sleep(1000);
    }
      catch(e)
      {
          console.error('Error processing message:', e);
           await this.sleep(5000);
      }
    }

    this.isProcessingQueue=false;

  }


  private async reconnect(): Promise<void> {
    console.log('Reconnecting ...');
     this.initialize();
  }
  
  private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
  }

}

