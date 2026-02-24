import { WASocket, GroupMetadata } from 'baileys'
import { Monitored_Group_Repo } from '../../repositories/MonitoredGroup_repo'
import {listing_repo} from '../../repositories/listing_repo'
import { MonitoredGroup } from '../../types/Data_types';
interface CachedGroups {
  metadata: GroupMetadata,
  type: 'group' | 'community',
  subGroups: string[],

}
export class GroupManager {
  private _sock: WASocket;
  private _groupCache: Map<string, CachedGroups>
  private _cacheReady = false;
  private COMMUNITY_JID: string = '120363295018117451@g.us'
  private monitor_group: Monitored_Group_Repo = new Monitored_Group_Repo()
  private _listing_repo:listing_repo=new listing_repo()
  private _isFetching = false;
  constructor(sock: WASocket) {
    this._sock = sock
    this._groupCache = new Map()
  }
  abort() {
  this._isFetching = false;
}
  private async fetchWithRetry(jid: string, attempts = 3, delay = 5000): Promise<GroupMetadata | null> {
  for (let i = 0; i < attempts; i++) {
      if (!this._isFetching) return null; // aborted
    try {
      return await this._sock.groupMetadata(jid);
    } catch (e: any) {
      if (e?.output?.statusCode === 428 && i < attempts - 1) {
        await this.sleep(delay);
        continue;
      }
      return null;
    }
  }
  return null;
}

private sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

  async fetchAllGroups(): Promise<Map<string, CachedGroups>> {

    try {
      if (this._isFetching) return this._groupCache;
       this._isFetching = true;
      const groups = await this._sock.groupFetchAllParticipating();
      await this.storeGroups(groups);
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


          const jid = subGroup?.id;
          if (!jid) {
            //console.log("❌ Skipping — missing JID");
            continue;
          }

          try {
            const meta = await this.fetchWithRetry(jid);
           if (!meta) continue;
            newGroupCache.set(jid, {
              metadata: meta,
              type: 'group',
              subGroups: []
            });

            if (!parent.subGroups.includes(jid)) {
              parent.subGroups.push(jid);
            }

          } catch (e) {
            console.warn("⚠️ Failed to fetch metadata for:", jid);
            console.warn("   ➜ Error:", e);
            continue;
          }
        }
      }

      this._groupCache = newGroupCache;
      this._cacheReady = true;
      this._isFetching = false;
      console.log(`Cached ${this._groupCache.size} groups`);
      return this._groupCache;
    }
    catch (e: any) {
      console.error('fetchAllGroups failed:', e?.message);
      return this._groupCache;
    }
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
    //console.log(community)
    for (const subGroup of community.linkedGroups) {
      const jid = subGroup.id
      if (!jid) return;
      if (!this._groupCache.has(jid)) {

        try {
          const meta = await this.fetchWithRetry(jid)
          if (!meta) continue;
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

    // console.log('=== PARTICIPANT CHECK ===')
    // console.log('Looking for:', userJid)

    // Community-level check
    const communityMatch = data.metadata.participants.find(p => p.id === userJid)
    if (communityMatch) {
      // console.log('FOUND at community level')
      return true
    }

    // Sub-group check
    let found = false
    for (const sug of data.subGroups) {
      const sugdata = this._groupCache.get(sug)
      if (!sugdata) continue

      const match = sugdata.metadata.participants.find(p => p.id === userJid)
      if (match) {
        // console.log(`FOUND in: ${sugdata.metadata.subject} (${sug})`)
        // console.log('Match:', match)
        found = true
        break
      }
    }

    if (!found) {
      // console.log('NOT FOUND in any group')
      // Log total participants per sub-group
      for (const sug of data.subGroups) {
        const sugdata = this._groupCache.get(sug)
        console.log(`${sugdata?.metadata.subject}: ${sugdata?.metadata.participants.length} participants`)
      }
      // Log sample LID format from first sub-group
      const first = this._groupCache.get(data.subGroups[0])
      // console.log('Sample LID format:', first?.metadata.participants[0]?.id)
      // console.log('Your LID format:', userJid)
    }

    console.log('=== END CHECK ===')
    return found
  }

  async isPhoneInCommunity(phone: string): Promise<boolean> {
    if (!this._groupCache.size || !this._sock) return false;

    const jid = phone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';


    let lid = await this._sock.signalRepository.lidMapping.getLIDForPN(jid);

    if (!lid) {
      try {
        console.log("on sighnup the cache don't have this person so fetching......")
        const result = await this._sock.onWhatsApp(jid);
        if (!result?.[0].exists) return false;
        lid = await this._sock.signalRepository.lidMapping.getLIDForPN(jid);
      }
      catch {
        return false;
      }
    }

    if (!lid) return false;

    if (this._cacheReady) {
      return this.isParticipant(lid);
    }
    // Cache not ready - check directly
    try {
      const community = await this.fetchWithRetry(this.COMMUNITY_JID);
      if (!community) return false;
      return community?.participants.some(p => p.id === lid) || false;
    }
    catch (e) {
      console.log("trying to get data before cache complete")
      return false;
    }
  }

 async storeGroups(groups: Record<string, GroupMetadata>) {
  for (const [jid, metadata] of Object.entries(groups)) {
    try {
      if(metadata&&metadata.subject && metadata.subject!='' && metadata.subject!=null)
      {
        console.log("group name",metadata.subject)
      }
      else{
        console.log("somehting wrong with group name", metadata)
      }
      // const groupid = jid.split("@")[0];
      // const exists = await this.monitor_group.GetGroup(groupid);
      
      // if (exists) {
      //   await this.monitor_group.UpdateGroupName(groupid, metadata.subject);
      //   continue;
      // }

      // const mg: MonitoredGroup = {
      //   whatsappgroupid: groupid,
      //   groupname: metadata.subject,
      //   isactive: true,
      //   totallistings: 0
      // }
      // await this.monitor_group.CreateGroup(mg);
    } catch(e) {
      console.error('Failed to store group:', e);
      continue;
    }
  }
}

}