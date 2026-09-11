import {initPostgres, shutdownPostgres} from '~~/server/db/postgres'
import {initRedis, shutdownRedis} from '~~/server/db/redis'

export default defineNitroPlugin(async (nitroApp) => {
    nitroApp.hooks.hook('close', async () => {
        await Promise.allSettled([
            shutdownPostgres(),
            shutdownRedis(),
        ])
    })

    await Promise.allSettled([
        initPostgres(),
        initRedis(),
    ])
})
