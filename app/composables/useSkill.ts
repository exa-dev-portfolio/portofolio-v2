import type {Skill, SkillsResponse} from "~/types/skill";
import {useToastCustom} from "~/composables/useToastCustom";
import {getErrorMessageAxios} from "~/utils/handleError";

export const useSkill = () => {
    const skills = ref<Array<Skill>>([])
    const isLoading = ref<boolean>(false)
    const isSaving = ref<boolean>(false)
    const cursor = ref<string | null>(null)
    const {$axios} = useNuxtApp()
    const toast = useToastCustom()
    const hasMore = ref<boolean>(true)

    const fetchSkills = async (
        loadMore = false,
        searchQuery: string = '',
        pagination: boolean = true,
        categoryId?: number | null,
        categoryName?: string
    ): Promise<SkillsResponse> => {
        isLoading.value = true
        try {
            const query: Record<string, any> = {
                search: searchQuery || undefined,
                pagination: pagination,
                limit: 12,
                category_id: categoryId || undefined,
                category: categoryName && categoryName !== 'All' ? categoryName : undefined,
            }

            if (loadMore && cursor.value) {
                query.cursor = cursor.value
            }

            const params = Object.fromEntries(
                Object.entries(query).filter(([, v]) => v !== undefined)
            )

            const response = await $axios.get <BaseResponse<SkillsResponse>>('/api/skills', {params})
            const body = response.data

            // Ensure body.data exists - return default instead of throwing so we handle it gracefully
            if (!body || !body.data) {
                console.error('Invalid response from server', body)
                return {
                    data: [],
                    has_next: false,
                }
            }

            if (loadMore) {
                skills.value.push(...body.data.data)
            } else {
                skills.value = body.data.data
            }

            hasMore.value = body.data.has_next

            if (body.data.data.length > 0) {
                cursor.value = body.data.data.at(-1)!.id.toString()
            }

            return body.data
        } catch (error) {
            console.error('Failed to fetch skills:', error)

            // RETURN DEFAULT
            return {
                data: [],
                has_next: false,
            }
        } finally {
            isLoading.value = false
        }
    }

    // Create multiple skills
    const createMultipleSkills = async (skillsList: Skill[]): Promise<boolean> => {
        isSaving.value = true
        const loadingToast = toast.showLoadingToast('Creating Skills', 'Please wait while the skills are being created.')
        try {
            const response = await $axios.post<BaseResponse<null>>('/api/skills', {data: skillsList})
            const body = response.data

            if (body && body.success) {
                toast.updateToast(loadingToast.id, 'Success', 'Skills created successfully.', 'success', 4000)
                // Refresh the list
                await fetchSkills(false, '')
                return true
            } else {
                toast.updateToast(loadingToast.id, 'Error', body?.message || 'Failed to create skills.', 'error', 6000)
                return false
            }
        } catch (error) {
            console.error('Failed to create skills:', error)
            const errorMessage = getErrorMessageAxios(error)

            toast.updateToast(
                loadingToast.id,
                'Error',
                errorMessage,
                'error',
                6000
            )
            return false
        } finally {
            isSaving.value = false
        }
    }

    const updateSkill = async (skill: Skill): Promise<boolean> => {
        isSaving.value = true
        const loadingToast = toast.showLoadingToast('Updating Skill', 'Please wait while the skill is being updated.')
        try {
            const response = await $axios.put<BaseResponse<null>>('/api/skills', skill)
            const body = response.data

            if (body && body.success) {
                toast.updateToast(loadingToast.id, 'Success', 'Skill updated successfully.', 'success', 4000)
                await fetchSkills(false, '')
                return true
            } else {
                toast.updateToast(loadingToast.id, 'Error', body?.message || 'Failed to update skill.', 'error', 6000)
                return false
            }
        } catch (error) {
            console.error('Failed to update skill:', error)
            const errorMessage = getErrorMessageAxios(error)

            toast.updateToast(
                loadingToast.id,
                'Error',
                errorMessage,
                'error',
                6000
            )
            return false
        } finally {
            isSaving.value = false
        }
    }

    const deleteSkill = async (skillId: number): Promise<boolean> => {
        isSaving.value = true
        const loadingToast = toast.showLoadingToast('Deleting Skill', 'Please wait while the skill is being deleted.')
        try {
            const response = await $axios.delete(`/api/skills/${skillId}`)
            const body = response.data as BaseResponse<null>

            if (body && body.success) {
                toast.updateToast(loadingToast.id, 'Success', 'Skill deleted successfully.', 'success', 4000)
                // Refresh the list
                await fetchSkills(false, '')
                return true
            } else {
                toast.updateToast(loadingToast.id, 'Error', body?.message || 'Failed to delete skill.', 'error', 6000)
                return false
            }
        } catch (error) {
            console.error('Failed to delete skill:', error)
            const errorMessage = getErrorMessageAxios(error)

            toast.updateToast(
                loadingToast.id,
                'Error',
                errorMessage,
                'error',
                6000
            )
            return false
        } finally {
            isSaving.value = false
        }
    }


    return {
        skills,
        isLoading,
        isSaving,
        cursor,
        hasMore,
        fetchSkills,
        createMultipleSkills,
        updateSkill,
        deleteSkill,
    }
}