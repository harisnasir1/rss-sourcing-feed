import { WASocket, GroupMetadata } from '@whiskeysockets/baileys'

interface CachedGroups {
  metadata: GroupMetadata,
  type: 'group' | 'community',
  subGroups: string[]
}
export class GroupManager {
  private _sock: WASocket;
  private _groupCache: Map<string, CachedGroups>
  private COMMUNITY_JID:string = '120363295018117451@g.us'
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
        type: metadata.isCommunity ? 'community' : 'group',
        subGroups: []
      })
    }

    for (const [jid, metadata] of Object.entries(groups)) {
      if (metadata.linkedParent) {
        const parent = this._groupCache.get(metadata.linkedParent);
        if (parent && parent != null) {
          parent.subGroups.push(jid)
        }
      }
    }
    //force to get our community data if that groups or scales we need to add db array here and then force to get all the subgroups.
    
     
     const parent = this._groupCache.get(this.COMMUNITY_JID);
     if(parent) 
{
    const community = await this._sock.communityFetchLinkedGroups(this.COMMUNITY_JID)
   
    console.log(community)
    for (const subGroup of community.linkedGroups) {
      const jid = subGroup.id;

      if (!jid) continue;

      if (!this._groupCache.get(jid)) {
        try {
          const meta = await this._sock.groupMetadata(jid)
          this._groupCache.set(jid, { metadata: meta, type: 'group', subGroups: [] })
          parent.subGroups.push(jid);
        }
        catch (e) {
          console.warn(`Skipping ${subGroup.id} - no access ,${e}`)
        }

      }
      else{
        if (!parent.subGroups.includes(jid)) {
             parent.subGroups.push(jid)
            }
      }
    }
}
    console.log(`Cached ${this._groupCache.size} groups`)

    return this._groupCache
  }

  getCommunities(): CachedGroups[] {
    return [...this._groupCache.values()].filter(g => g.type == "community" )
  }

  getRRcomunity():CachedGroups|undefined{
    return this._groupCache.get(this.COMMUNITY_JID);
  }

  getGroupByJid(jid: string): CachedGroups | undefined {
    return this._groupCache.get(jid)
  }

  async getCommnitiesWithsubgroups() {



    const groups = await this._sock.groupFetchAllParticipating()
    this._groupCache.clear()

    for (const [jid, metadata] of Object.entries(groups)) {
      this._groupCache.set(jid, {
        metadata,
        type: metadata.isCommunity ? 'community' : 'group',
        subGroups: []
      })
    }

    // Fetch community sub-groups directly from WhatsApp
    const community = await this._sock.communityFetchLinkedGroups(this.COMMUNITY_JID)
    console.log(community)
    for (const subGroup of community.linkedGroups) {
      const jid = subGroup.id
      if (!jid) return;
      if (!this._groupCache.has(jid)) {

        try {
          const meta = await this._sock.groupMetadata(jid)
          this._groupCache.set(jid, { metadata: meta, type: 'group', subGroups: [] })
        }
        catch (e) {
          console.warn(`Skipping ${subGroup.id} - no access ,${e}`)
        }
      }
      const parent = this._groupCache.get(this.COMMUNITY_JID)
      if (parent) parent.subGroups.push(jid)
    }

    console.log(`Cached ${this._groupCache.size} groups, community has ${this._groupCache.get(this.COMMUNITY_JID)?.subGroups.length} sub-groups`)

  }



  isParticipant(groupJid: string, userJid: string): boolean {
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