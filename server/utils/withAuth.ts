import {verifyAccessToken} from '~~/server/utils/jwt'
import {HttpError} from '~~/server/errors/HttpError'
import type {EventHandler, EventHandlerRequest, H3Event} from 'h3'
import {sendAppError} from "~~/server/utils/response";

export const withAuth = <T extends EventHandlerRequest, D>(
    handler?: EventHandler<T, D>
): EventHandler<T, D> => {
    return defineEventHandler<T>(async (event: H3Event) => {
        try {
            // 1️⃣ Ambil token dari header
            const authHeader = getHeader(event, 'authorization') ?? ''
            let token: string | null = null

            if (!authHeader) {
                token = getCookie(event, 'token') || ''
                logger.info({ err: token }, 'No Authorization header, trying cookie:')
            }

            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7).trim()
            }

            // 2️⃣ Fallback ke cookie
            if (!token) {
                token = getCookie(event, 'access_token') ?? null
            }

            if (!token) {
                return sendAppError(event, 401, 'missing_token', 'Access token is missing')
            }

            // 3️⃣ Verify JWT
            let payload: any
            try {
                payload = verifyAccessToken(token)
            } catch {
                return sendAppError(event, 401, 'invalid_token', 'Access token is invalid')
            }

            // 4️⃣ Attach ke context (SOURCE OF TRUTH)
            event.context.user = {
                id: payload.sub,
                email: payload.email,
                raw: payload,
            }

            // 5️⃣ Lanjut ke handler kalau ada
            if (handler) {
                return await handler(event)
            } else {
                return sendAppError(
                    event,
                    500, 'no_handler',
                    'No handler provided for authenticated route'
                )
            }
        } catch (err: any) {
            logger.error({ err: err }, "[error]:")
            if (err instanceof HttpError) {
                return sendAppError(event, err.status, err.code, err.message, err.data)
            }
            return sendAppError(
                event,
                500, 'internal_error',
                'An internal server error occurred',
                err.data
            )
        }
    })
}
