import {z} from 'zod'

export const getListingSchema=z.object({
    wts:z.enum(['true','false']).optional().default('true'),
    brand:z.string().max(100).optional().default(''),
    search:z.string().max(200).optional().default(''),
    page:z.coerce.number().int().min(1).max(10000).optional().default(1),
    limit:z.coerce.number().int().max(100).optional().default(20)
})
