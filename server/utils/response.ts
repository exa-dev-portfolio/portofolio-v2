import type {H3Event} from 'h3'
import {setResponseStatus} from 'h3'

export type BaseResponse<T = any> = {
    message: string
    success: boolean
    data: T | null
    code: string
    timestamp: string
}

export function createBaseResponse<T>(
    message: string,
    success: boolean,
    code: string,
    data?: T | null,
): BaseResponse<T> {
    return {
        message,
        success,
        data: data ?? null,
        code,
        timestamp: new Date().toISOString(),
    }
}

export function sendSuccess<T>(
    event: H3Event,
    data?: T,
    message = 'OK',
    code: string = "SUCCESS",
    status = 200
) {
    setResponseStatus(event, status)
    return createBaseResponse(message, true, code, data)
}

export function sendAppError(
    event: H3Event,
    status = 500,
    code: string = 'INTERNAL_ERROR',
    message = 'error',
    data?: any
) {
    setResponseStatus(event, status)
    return createBaseResponse(message, false, code, data)
}
