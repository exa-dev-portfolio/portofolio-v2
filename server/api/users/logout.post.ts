import {del} from "~~/server/db/redis"
import {sendAppError, sendSuccess} from "~~/server/utils/response"
import {withTransaction} from "~~/server/db/postgres";
import {deleteToken} from "~~/server/repositories/token.repository";
import {handleError} from "~~/server/utils/handleError";
import {HttpError} from "~~/server/errors/HttpError";

export default handleError(async (event) => {
    try {
        const body = await readBody(event)
        await withTransaction(
            async (client) => {
                // Hapus refresh token dari database jika disimpan di sana
                // Delete refresh token dari Redis

                let refreshToken = getCookie(event, 'refresh_token')
                if (!refreshToken) {
                    refreshToken = body.refresh_token
                }
                if (!refreshToken) {
                    throw new HttpError(401, 'MISSING_REFRESH_TOKEN', 'Refresh token is missing')
                }
                await deleteToken(
                    client,
                    hashToSha256(refreshToken || '')
                )
                if (refreshToken) {
                    await del(`user_refresh_token:${refreshToken}`)
                }
            }
        )

        // Clear cookies di client
        deleteCookie(event, 'access_token', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/api'
        })

        deleteCookie(event, 'refresh_token', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/api'
        })

        deleteCookie(event, 'token', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/'
        })

        return sendSuccess(event, null, 'Logout successful', 'LOGOUT_SUCCESS', 200)
    } catch (error) {
        if (error instanceof HttpError) {
            throw error
        }
        logger.error({ err: error }, 'Logout error:')
        return sendAppError(event, 500, 'LOGOUT_ERROR', 'An error occurred during logout')
    }
})

