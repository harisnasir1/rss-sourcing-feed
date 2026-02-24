import {z} from 'zod'

export const Grouppagination=z.object({
    search:z.string().max(200).optional().default(''),
    page:z.coerce.number().int().min(1).max(10000).optional().default(1),
    limit:z.coerce.number().int().max(100).optional().default(20)
})

export const GroupStatus=z.object({
    id:z.string().max(200),
    status:z.boolean().default(true)
})