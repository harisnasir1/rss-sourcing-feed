export interface UserProfile {
  id?: string
  name: string
  email?: string
  role?: string
  createdAt?: string
  lastLogin?: string | null
  // Signup form extras kept for future personalization
  hasWebsite?: boolean
  hasInventory?: boolean
  inventoryValueBand?: string
}
