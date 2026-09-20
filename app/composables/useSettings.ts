import {useToastCustom} from "~/composables/useToastCustom";
import type {UserSettingsModel} from "~/types/settings";

export const useSettings = () => {
    const {$axios} = useNuxtApp()
    const toast = useToastCustom()
    const isLoading = ref(false)
    const isSaving = ref(false)

    const fetchSettings = async (): Promise<UserSettingsModel | null> => {
        isLoading.value = true
        try {
            const response = await $axios.get<BaseResponse<UserSettingsModel>>('/api/settings')
            const body = response.data

            if (!body || !body.data) {
                console.error('Invalid response from server', body)
                return null
            }

            return body.data
        } catch (error) {
            console.error('Failed to fetch settings:', error)
            return null
        } finally {
            isLoading.value = false
        }
    }

    const updateProfileSettings = async (profileData: {
        name: string
        email: string
        location?: string | null
        open_to_opportunities: boolean
    }): Promise<UserSettingsModel | null> => {
        isSaving.value = true
        const loadingToast = toast.showLoadingToast("Updating Profile", "Please wait while your profile is being updated.")
        try {
            const response = await $axios.put<BaseResponse<UserSettingsModel>>('/api/settings/profile', profileData)
            const body = response.data

            if (!body || !body.data) {
                console.error('Invalid response from server', body)
                toast.updateToast(
                    loadingToast.id,
                    "Error",
                    "Failed to update profile",
                    "error",
                    5000
                )
                return null
            }

            toast.updateToast(
                loadingToast.id,
                "Success",
                "Profile updated successfully!",
                "success",
                3000
            )
            return body.data
        } catch (error) {
            const message = getErrorMessageAxios(error)
            toast.updateToast(
                loadingToast.id,
                "Error",
                message,
                "error",
                5000
            )
            return null
        } finally {
            isSaving.value = false
        }
    }

    const updateSocialLinks = async (socialData: {
        github_profile?: string | null
        linkedin_profile?: string | null
    }): Promise<UserSettingsModel | null> => {
        isSaving.value = true
        const loadingToast = toast.showLoadingToast("Updating Social Links", "Please wait while your social links are being updated.")
        try {
            const response = await $axios.put<BaseResponse<UserSettingsModel>>('/api/settings/social-links', socialData)
            const body = response.data

            if (!body || !body.data) {
                console.error('Invalid response from server', body)
                toast.updateToast(
                    loadingToast.id,
                    "Error",
                    "Failed to update social links",
                    "error",
                    5000
                )
                return null
            }

            toast.updateToast(
                loadingToast.id,
                "Success",
                "Social links updated successfully!",
                "success",
                3000
            )
            return body.data
        } catch (error) {
            console.error('Failed to update social links:', error)
            const message = getErrorMessageAxios(error)
            toast.updateToast(
                loadingToast.id,
                "Error",
                message,
                "error",
                5000
            )
            return null
        } finally {
            isSaving.value = false
        }
    }

    const uploadCV = async (file: File): Promise<string | null> => {
        isSaving.value = true
        const loadingToast = toast.showLoadingToast("Uploading CV", "Please wait while your CV is being uploaded.")
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await $axios.post<BaseResponse<{ url: string }>>('/api/settings/upload-cv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            const body = response.data

            if (!body || !body.data) {
                console.error('Invalid response from server', body)
                toast.updateToast(
                    loadingToast.id,
                    "Error",
                    "Failed to upload CV",
                    "error",
                    5000
                )
                return null
            }

            toast.updateToast(
                loadingToast.id,
                "Success",
                "CV uploaded successfully!",
                "success",
                3000
            )
            return body.data.url
        } catch (error) {
            console.error('Failed to upload CV:', error)
            const message = getErrorMessageAxios(error)
            toast.updateToast(
                loadingToast.id,
                "Error",
                message,
                "error",
                5000
            )
            return null
        } finally {
            isSaving.value = false
        }
    }

    const bindApple = async (identityToken: string, email?: string | null): Promise<UserSettingsModel | null> => {
        isSaving.value = true
        const loadingToast = toast.showLoadingToast("Menghubungkan Apple", "Mohon tunggu, sedang memverifikasi akun Apple...")
        try {
            const response = await $axios.post<BaseResponse<UserSettingsModel>>('/api/settings/bind-apple', {
                identityToken,
                email,
            })
            const body = response.data

            if (!body || !body.data) {
                toast.updateToast(
                    loadingToast.id,
                    "Error",
                    "Gagal menghubungkan akun Apple",
                    "error",
                    5000
                )
                return null
            }

            toast.updateToast(
                loadingToast.id,
                "Berhasil",
                "Akun Apple berhasil terhubung!",
                "success",
                3000
            )
            return body.data
        } catch (error) {
            console.error('Failed to bind Apple:', error)
            const message = getErrorMessageAxios(error)
            toast.updateToast(
                loadingToast.id,
                "Gagal",
                message,
                "error",
                5000
            )
            return null
        } finally {
            isSaving.value = false
        }
    }

    const unbindApple = async (): Promise<UserSettingsModel | null> => {
        isSaving.value = true
        const loadingToast = toast.showLoadingToast("Memutuskan Apple", "Mohon tunggu, sedang memutuskan tautan akun Apple...")
        try {
            const response = await $axios.post<BaseResponse<UserSettingsModel>>('/api/settings/unbind-apple')
            const body = response.data

            if (!body || !body.data) {
                toast.updateToast(
                    loadingToast.id,
                    "Error",
                    "Gagal memutuskan akun Apple",
                    "error",
                    5000
                )
                return null
            }

            toast.updateToast(
                loadingToast.id,
                "Berhasil",
                "Tautan akun Apple berhasil dilepas!",
                "success",
                3000
            )
            return body.data
        } catch (error) {
            console.error('Failed to unbind Apple:', error)
            const message = getErrorMessageAxios(error)
            toast.updateToast(
                loadingToast.id,
                "Gagal",
                message,
                "error",
                5000
            )
            return null
        } finally {
            isSaving.value = false
        }
    }

    return {
        isLoading,
        isSaving,
        fetchSettings,
        updateProfileSettings,
        updateSocialLinks,
        uploadCV,
        bindApple,
        unbindApple,
    }
}


