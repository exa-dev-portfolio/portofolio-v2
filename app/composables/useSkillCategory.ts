import type { SkillCategory, SkillCategoriesResponse } from "~/types/skill";
import { useToastCustom } from "~/composables/useToastCustom";
import { getErrorMessageAxios } from "~/utils/handleError";

export const useSkillCategory = () => {
    const categories = useState<Array<SkillCategory>>('skill_categories', () => []);
    const isLoading = ref<boolean>(false);
    const isSaving = ref<boolean>(false);
    const { $axios } = useNuxtApp();
    const toast = useToastCustom();

    const fetchCategories = async (): Promise<SkillCategory[]> => {
        isLoading.value = true;
        try {
            const response = await $axios.get<BaseResponse<SkillCategoriesResponse>>('/api/skill-categories');
            const body = response.data;

            if (body && body.data && body.data.data) {
                categories.value = body.data.data;
                return body.data.data;
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch skill categories:', error);
            return [];
        } finally {
            isLoading.value = false;
        }
    };

    const createCategory = async (data: { name: string; description?: string; color?: string }): Promise<boolean> => {
        isSaving.value = true;
        const loadingToast = toast.showLoadingToast('Creating Category', 'Please wait while the category is being created.');
        try {
            const response = await $axios.post<BaseResponse<{ data: SkillCategory }>>('/api/skill-categories', data);
            const body = response.data;

            if (body && body.success) {
                toast.updateToast(loadingToast.id, 'Success', 'Category created successfully.', 'success', 4000);
                await fetchCategories();
                return true;
            } else {
                toast.updateToast(loadingToast.id, 'Error', body?.message || 'Failed to create category.', 'error', 6000);
                return false;
            }
        } catch (error) {
            console.error('Failed to create category:', error);
            const errorMessage = getErrorMessageAxios(error);
            toast.updateToast(loadingToast.id, 'Error', errorMessage, 'error', 6000);
            return false;
        } finally {
            isSaving.value = false;
        }
    };

    const updateCategory = async (data: { id: number; name: string; description?: string; color?: string }): Promise<boolean> => {
        isSaving.value = true;
        const loadingToast = toast.showLoadingToast('Updating Category', 'Please wait while the category is being updated.');
        try {
            const response = await $axios.put<BaseResponse<null>>('/api/skill-categories', data);
            const body = response.data;

            if (body && body.success) {
                toast.updateToast(loadingToast.id, 'Success', 'Category updated successfully.', 'success', 4000);
                await fetchCategories();
                return true;
            } else {
                toast.updateToast(loadingToast.id, 'Error', body?.message || 'Failed to update category.', 'error', 6000);
                return false;
            }
        } catch (error) {
            console.error('Failed to update category:', error);
            const errorMessage = getErrorMessageAxios(error);
            toast.updateToast(loadingToast.id, 'Error', errorMessage, 'error', 6000);
            return false;
        } finally {
            isSaving.value = false;
        }
    };

    const deleteCategory = async (id: number): Promise<boolean> => {
        isSaving.value = true;
        const loadingToast = toast.showLoadingToast('Deleting Category', 'Please wait while the category is being deleted.');
        try {
            const response = await $axios.delete<BaseResponse<null>>(`/api/skill-categories/${id}`);
            const body = response.data;

            if (body && body.success) {
                toast.updateToast(loadingToast.id, 'Success', 'Category deleted successfully.', 'success', 4000);
                await fetchCategories();
                return true;
            } else {
                toast.updateToast(loadingToast.id, 'Error', body?.message || 'Failed to delete category.', 'error', 6000);
                return false;
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
            const errorMessage = getErrorMessageAxios(error);
            toast.updateToast(loadingToast.id, 'Error', errorMessage, 'error', 6000);
            return false;
        } finally {
            isSaving.value = false;
        }
    };

    return {
        categories,
        isLoading,
        isSaving,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    };
};
