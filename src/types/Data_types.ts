export interface Vendor {
  id?: string;                 // UUID
  whatsappId: string;         // varchar(50)
  phoneNumber: string;        // varchar(50)
  displayName: string;        // varchar(100)
  totalListings: number;      // integer, default 0
  avgRating: number;          // numeric(3,2), default 0
  totalRatings: number;       // integer, default 0
  isBlocked: boolean;         // boolean, default false
  lastMessageAt?: Date;       // timestamp, nullable
  createdAt?: Date;            // timestamp, default now()
  updatedAt?: Date;            // timestamp, default now()
}

export interface MessageBuffer {
  id?: string; 
  vendorId?: string;
  groupId?: string; 
  messageType?: msgtype ;
  description?: string;
  images?: string[]; 
  isProcessed: boolean;
  shouldCombine: boolean;
  whatsappMessageId?: string;
  whatsappTimestamp?: Date; 
  createdAt?: Date; 
}
export type msgtype='text' | 'image' | 'mixed'



export interface WhatsAppMessage {
  key: {
    remoteJid: string;              
    remoteJidAlt?: string;          
    fromMe: boolean;                
    id: string;                     
    participant?: string;           
    participantAlt?: string;        
    addressingMode?: 'pn' | 'lid';  
  };

  messageTimestamp: number;         
  pushName?: string;                
  broadcast?: boolean;


  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text?: string;
      contextInfo?: Record<string, any>;
      inviteLinkGroupTypeV2?: number;
    };

    imageMessage?: {
      url?: string;
      mimetype?: string;
      caption?: string;
      fileSha256?: Buffer;
      fileLength?: number | Record<string, any>;
      height?: number;
      width?: number;
      mediaKey?: Buffer;
      fileEncSha256?: Buffer;
      directPath?: string;
      mediaKeyTimestamp?: number | Record<string, any>;
      jpegThumbnail?: Buffer;
      contextInfo?: Record<string, any>;
      viewOnce?: boolean;
    };


    senderKeyDistributionMessage?: {
      groupId?: string;
      axolotlSenderKeyDistributionMessage?: Buffer;
    };


    messageContextInfo?: {
      deviceListMetadata?: Record<string, any>;
      deviceListMetadataVersion?: number;
      messageSecret?: Buffer;
      limitSharingV2?: Record<string, any>;
    };

    [key: string]: any;
  };
}



export interface Listing {
  id?: string;                        // uuid
  vendorId?: string;                 // uuid, nullable
  groupId?: string;                  // varchar(50)
  groupName?: string;                // text
  rawMessage?: WhatsAppMessage;      // text
  description?: string;              // text
  images?: string[];                 // text[]
  price?: number;                    // numeric
  currency?: string;                  // varchar(50), default 'GBP'
  brand?: string;                    // varchar(50)
  productType?: string;              // varchar(50)
  gender?: ListingGender;            // enum: listing_gender
  size?: string;                     // varchar(50)
  condition?: ListingCondition;      // enum: listing_condition
  viewCount: number;                 // bigint, default 0
  likeCount: number;                 // bigint, default 0
  messageCount: number;              // bigint, default 0
  status?: ListingStatus;            // enum: listing_status
  isWTB: boolean;                    // boolean, default false
  createdAt?: Date;                   // timestamp without time zone, default now()
  updatedAt?: Date;                   // timestamp without time zone, default now()
}
export type ListingGender = 'men' | 'women' | 'unisex' | 'kids';

export type ListingCondition =
  | 'new'
  | 'like_new'
  | 'used'
  | 'fair'
  | 'poor';

export type ListingStatus =
  | 'active'
  | 'sold'
  | 'archived'
  | 'hidden';
