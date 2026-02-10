import { WASocket, GroupMetadata } from '@whiskeysockets/baileys'

interface CachedGroups{
    metadata:GroupMetadata,
    type:'group'| 'community',
    subGroups:string[]
}
export class GroupManager {
  private _sock: WASocket;
  private _groupCache: Map<string, CachedGroups>

  constructor(sock: WASocket) {
    this._sock = sock
    this._groupCache = new Map()

  }

  async fetchAllGroups(): Promise<Map<string, CachedGroups>> {
    const groups = await this._sock.groupFetchAllParticipating()

    this._groupCache.clear()
    for (const [jid, metadata] of Object.entries(groups)) {
      this._groupCache.set(jid, {
        metadata,
        type:metadata.isCommunity?'community':'group',
        subGroups:[]
    })
    }
      
    for(const [jid,metadata] of Object.entries(groups))
    {
        if(metadata.linkedParent)
        {
           const parent= this._groupCache.get(metadata.linkedParent);
           if(parent&&parent!=null)
           {
            parent.subGroups.push(jid)
           }
        }
    }

    console.log(`Cached ${this._groupCache.size} groups`)
    
    return this._groupCache
  }

  getCommunities(): CachedGroups[] {

    return [...this._groupCache.values()].filter(g => g.type=="community")
  }

  getGroupByJid(jid: string): CachedGroups | undefined {
    return this._groupCache.get(jid)
  }

  

  isParticipant(groupJid: string, userJid: string): boolean {   //here the groupjid is the one i wanted to block and it is community id
   const data = this._groupCache.get(groupJid);

  
if (!data) return false;

// community-level participants
if (
  data.metadata.participants.some(par => par.id === userJid)
) {
  return true;
}

// sub-groups
return data.subGroups.some(sug => {
  const sugdata = this._groupCache.get(sug);
  return sugdata?.metadata.participants.some(
    par => par.id === userJid
  );
});
  }
}