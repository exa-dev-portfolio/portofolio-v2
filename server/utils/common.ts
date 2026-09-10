import z from "zod";
import {MultiPartData} from "h3";


export interface ParsedFile {
    filename: string
    data: Buffer
    contentType: string
}

export type ParsedFormData = Record<
    string,
    string | number | boolean | ParsedFile | ParsedFile[] | any[]
>

export const paginationSchemaQuery = z.object({
    pagination: z.string().optional().transform(
        (val) => val === 'true'
    ),
    limit: z.string().optional().refine(
        (val) => {
            if (val === undefined) return true;
            const num = Number(val);
            return Number.isInteger(num) && num > 0 && num <= 100;
        },
        {message: 'limit_must_be_positive_integer_up_to_100'}
    ).transform((val) => val ? Number(val) : undefined
    ),
    cursor: z.string().optional().refine(
        (val) => {
            if (val === undefined || val === '') return true;
            const num = Number(val);
            return Number.isInteger(num) && num > 0 && num <= 100;
        },
        {message: 'limit_must_be_positive_integer_up_to_100'}
    ).transform((val) => val ? Number(val) : undefined
    ),
})

export const fileSchema = z.object({
    filename: z.string().min(1),
    contentType: z.string().optional(),
    data: z.instanceof(Buffer),
}).refine(
    (file) => file.data.length <= 15 * 1024 * 1024,
    {message: 'Max file size is 15MB'}
).refine(
    (file) => !file.contentType || file.contentType.startsWith('image/') || file.contentType === 'application/octet-stream',
    {message: 'File must be an image'}
)

/**
 * Parse Nuxt/H3 multipart form-data into normalized object
 * - Auto parse JSON values
 * - Support multiple files with same field name
 */
export const formatNuxtFormData = (
    data: MultiPartData[],
    forceArrayKeys: string[] = []
): ParsedFormData => {
    const body: ParsedFormData = {}

    for (const item of data) {
        let name = item.name!

        // 🔥 NORMALIZE ARRAY KEY
        if (name.endsWith('[]')) {
            name = name.slice(0, -2)
        }

        // ===== FILE =====
        if (item.type) {
            const file: ParsedFile = {
                filename: item.filename!,
                contentType: item.type,
                data: item.data,
            }

            body[name] = body[name]
                ? mergeArray(body[name], file)
                : (forceArrayKeys.includes(name) ? [file] : file)

            continue
        }

        // ===== TEXT =====
        const raw = item.data.toString()
        let value: any = raw

        try {
            value = JSON.parse(raw)
        } catch {
            value = raw
        }

        // 🔑 FORCE ARRAY
        if (forceArrayKeys.includes(name)) {
            value = Array.isArray(value) ? value : [value]
        }

        if (body[name]) {
            body[name] = mergeArray(body[name], value)
        } else {
            body[name] = value
        }
    }

    return body
}


// 🔑 helper
const mergeArray = (prev: any, next: any) => {
    const a = Array.isArray(prev) ? prev : [prev]
    const b = Array.isArray(next) ? next : [next]
    return [...a, ...b]
}