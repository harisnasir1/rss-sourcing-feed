// container.ts
import { WASocket } from '@whiskeysockets/baileys'
import { GroupManager } from '../whatsapp_services/Group_manager_service'

class WSContainer {
  private _sock: WASocket | null = null
  private _groupManager: GroupManager | null = null

  set sock(s: WASocket) { this._sock = s }
  get sock(): WASocket {
    if (!this._sock) throw new Error('Socket not initialized')
    return this._sock
  }

  set groupManager(g: GroupManager) { this._groupManager = g }
  get groupManager(): GroupManager {
    if (!this._groupManager) throw new Error('GroupManager not initialized')
    return this._groupManager
  }
}

export const wscontainer = new WSContainer()