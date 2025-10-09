
import makeWASocket, { useMultiFileAuthState,Browsers,DisconnectReason } from '@whiskeysockets/baileys'
import P from 'pino'
import QRCode from 'qrcode'
import { Boom } from '@hapi/boom'

async function startSock() {   
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock =await makeWASocket({
    auth: state,  
    logger: P({ level: 'silent' }),
    browser: Browsers.ubuntu('My App'),
    generateHighQualityLinkPreview: true,
  })
  
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (update) => {
  const {connection, lastDisconnect, qr } = update
  if (
    connection === 'close' &&
    (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.restartRequired
  ) {
    console.log('Restart required, reconnecting...')
    startSock()
  }
  if (qr) {
  await QRCode.toFile('qr.png', qr)
  }
})

sock.ev.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0]
  if (!msg.key.fromMe ) {
  console.log(msg)
  }
})
  return sock
}


startSock()