// plugins/axios.ts
import axios, {AxiosError, type AxiosInstance} from 'axios'
import {jwtDecode} from 'jwt-decode'

export default defineNuxtPlugin((nuxtApp) => {

    const config = useRuntimeConfig()

    // ✅ AMAN: dipanggil di dalam plugin
    const headers = import.meta.server
        ? useRequestHeaders(['cookie'])
        : {}

    // Use useCookie for consistent cookie handling
    const tokenCookie = useCookie('token', {
        maxAge: 86400, // 1 day
        path: '/',
        sameSite: 'lax',
        secure: import.meta.env.PROD,
    })

    // 🔄 AUTO BASEURL - mengikuti parent domain
    let baseURL = config.public.apiBaseUrl
    if (import.meta.client && typeof window !== 'undefined') {
        // Client-side: gunakan window.location.origin (otomatis ngikutin domain saat ini)
        baseURL = window.location.origin
    } else if (import.meta.server) {
        // Server-side: gunakan host dari request headers
        const host = useRequestHeaders(['host']).host || config.public.apiBaseUrl
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
        baseURL = `${protocol}://${host}`
    }

    const api: AxiosInstance = axios.create({
        baseURL,
        withCredentials: true,
    })

    let isRefreshing = false
    let refreshPromise: Promise<void> | null = null

    // Proactive refresh threshold helper (e.g. 60 seconds before expiration)
    const isTokenExpiringSoon = (token: string, thresholdSeconds = 60): boolean => {
        try {
            const decoded: any = jwtDecode(token)
            if (!decoded?.exp) return false
            const expMs = decoded.exp * 1000
            return (expMs - Date.now()) <= (thresholdSeconds * 1000)
        } catch {
            return false
        }
    }

    const executeRefresh = async (): Promise<void> => {
        if (!isRefreshing) {
            isRefreshing = true
            refreshPromise = api
                .post('/api/users/refresh', {}, {
                    withCredentials: true,
                })
                .then((res) => {
                    if (res?.data?.data?.access_token) {
                        tokenCookie.value = res.data.data.access_token
                    }
                })
                .finally(() => {
                    isRefreshing = false
                    refreshPromise = null
                })
        }
        if (refreshPromise) {
            await refreshPromise
        }
    }

    // =========================
    // REQUEST INTERCEPTOR
    // =========================
    api.interceptors.request.use(async (config) => {
        // Skip proactive refresh check for refresh endpoint itself
        if (config.url?.includes('/api/users/refresh')) {
            return config
        }

        // SSR: forward cookie
        if (import.meta.server) {
            config.withCredentials = true
            if (headers.cookie) {
                config.headers = config.headers || {}
                config.headers.Cookie = headers.cookie
            }
        } else {
            // Client: Authorization with proactive threshold refresh
            let token = tokenCookie.value
            if (token && isTokenExpiringSoon(token, 60)) {
                try {
                    await executeRefresh()
                    token = tokenCookie.value
                } catch {
                    // Fallback to let request execute or fail into response interceptor
                }
            }

            if (token) {
                config.headers = config.headers || {}
                config.headers.Authorization = `Bearer ${token}`
            }
        }

        return config
    })

    // =========================
    // RESPONSE INTERCEPTOR
    // =========================
    api.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest: any = error.config

            if (
                error.response?.status !== 401 ||
                originalRequest?._retry ||
                originalRequest?.url?.includes('/api/users/refresh')
            ) {
                return Promise.reject(error)
            }

            originalRequest._retry = true

            try {
                await executeRefresh()

                const token = tokenCookie.value
                if (token) {
                    originalRequest.headers = originalRequest.headers || {}
                    originalRequest.headers.Authorization = `Bearer ${token}`
                }

                // 🔁 retry request asli
                return api(originalRequest)
            } catch (err) {
                if (import.meta.client) {
                    navigateTo('/login')
                }
                return Promise.reject(err)
            }
        }
    )

    return {
        provide: {
            axios: api,
        },
    }
})
