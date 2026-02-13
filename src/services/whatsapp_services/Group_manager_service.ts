import { WASocket, GroupMetadata } from '@whiskeysockets/baileys'

interface CachedGroups {
  metadata: GroupMetadata,
  type: 'group' | 'community',
  subGroups: string[]
}
export class GroupManager {
  private _sock: WASocket;
  private _groupCache: Map<string, CachedGroups>
  private COMMUNITY_JID: string = '120363295018117451@g.us'
  constructor(sock: WASocket) {
    this._sock = sock
    this._groupCache = new Map()

  }


  async fetchAllGroups(): Promise<Map<string, CachedGroups>> {

    const groups = await this._sock.groupFetchAllParticipating();

    const newGroupCache = new Map<string, CachedGroups>();

    for (const [jid, metadata] of Object.entries(groups)) {
      newGroupCache.set(jid, {
        metadata,
        type: metadata.isCommunity ? 'community' : 'group',
        subGroups: []
      });
    }

    for (const [jid, metadata] of Object.entries(groups)) {
      if (metadata.linkedParent) {
        const parent = newGroupCache.get(metadata.linkedParent);
        if (parent) {
          parent.subGroups.push(jid);
        }
      }
    }

    const parent = newGroupCache.get(this.COMMUNITY_JID);

    if (parent) {
      const community = await this._sock.communityFetchLinkedGroups(this.COMMUNITY_JID);

      for (const subGroup of community.linkedGroups) {

        console.log("--------------------------------------------------");
        console.log("Processing subgroup:", subGroup);

        const jid = subGroup?.id;
        if (!jid) {
          console.log("❌ Skipping — missing JID");
          continue;
        }

        try {
          console.log("📥 Fetching fresh metadata for:", jid);

          const meta = await this._sock.groupMetadata(jid);

          console.log("✅ Fetched:");
          console.log("   ➜ Subject:", meta.subject);
          console.log("   ➜ Participants:", meta.participants?.length);

          newGroupCache.set(jid, {
            metadata: meta,
            type: 'group',
            subGroups: []
          });

          if (!parent.subGroups.includes(jid)) {
            parent.subGroups.push(jid);
          }

          console.log("💾 Updated in new cache & linked");

        } catch (e) {
          console.warn("⚠️ Failed to fetch metadata for:", jid);
          console.warn("   ➜ Error:", e);
        }
      }
    }

    this._groupCache = newGroupCache;

    console.log(`Cached ${this._groupCache.size} groups`);

    return this._groupCache;
  }




  getCommunities(): CachedGroups[] {
    return [...this._groupCache.values()].filter(g => g.type == "community")
  }

  getRRcomunity(): CachedGroups | undefined {
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


  isParticipant(userJid: string): boolean {
    const data = this._groupCache.get(this.COMMUNITY_JID)
    if (!data) return false

    console.log('=== PARTICIPANT CHECK ===')
    console.log('Looking for:', userJid)

    // Community-level check
    const communityMatch = data.metadata.participants.find(p => p.id === userJid)
    if (communityMatch) {
      console.log('FOUND at community level')
      return true
    }

    // Sub-group check
    let found = false
    for (const sug of data.subGroups) {
      const sugdata = this._groupCache.get(sug)
      if (!sugdata) continue

      const match = sugdata.metadata.participants.find(p => p.id === userJid)
      if (match) {
        console.log(`FOUND in: ${sugdata.metadata.subject} (${sug})`)
        console.log('Match:', match)
        found = true
        break
      }
    }

    if (!found) {
      console.log('NOT FOUND in any group')
      // Log total participants per sub-group
      for (const sug of data.subGroups) {
        const sugdata = this._groupCache.get(sug)
        console.log(`${sugdata?.metadata.subject}: ${sugdata?.metadata.participants.length} participants`)
      }
      // Log sample LID format from first sub-group
      const first = this._groupCache.get(data.subGroups[0])
      console.log('Sample LID format:', first?.metadata.participants[0]?.id)
      console.log('Your LID format:', userJid)
    }

    console.log('=== END CHECK ===')
    return found
  }
}