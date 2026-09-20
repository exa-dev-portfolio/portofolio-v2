import type {
  Application,
  ApplicationAttachment,
  GenerateInput,
  GenerateResult,
  ChatResult,
  ApplicationStats,
} from "~/types/application";

export const useApply = () => {
  const { $axios } = useNuxtApp();
  const toast = useToastCustom();

  const isGenerating = ref(false);
  const isSending = ref(false);
  const isChatLoading = ref(false);
  const isUploading = ref(false);

  const generateEmail = async (
    input: GenerateInput,
  ): Promise<GenerateResult | null> => {
    isGenerating.value = true;
    try {
      const { data } = await $axios.post<BaseResponse<GenerateResult>>(
        "/api/applications/generate",
        input,
      );
      if (!data?.data) return null;
      return data.data;
    } catch (err: any) {
      toast.showErrorToast("Error", getErrorMessage(err));
      return null;
    } finally {
      isGenerating.value = false;
    }
  };

  const sendChat = async (
    applicationId: string,
    message: string,
  ): Promise<ChatResult | null> => {
    isChatLoading.value = true;
    try {
      const { data } = await $axios.post<BaseResponse<ChatResult>>(
        "/api/applications/chat",
        {
          application_id: applicationId,
          message,
        },
      );
      if (!data?.data) return null;
      return data.data;
    } catch (err: any) {
      toast.showErrorToast("Error", getErrorMessage(err));
      return null;
    } finally {
      isChatLoading.value = false;
    }
  };

  const clearChat = async (applicationId: string): Promise<boolean> => {
    try {
      const { data } = await $axios.post<BaseResponse<{ chat_history: [] }>>(
        "/api/applications/clear-chat",
        {
          application_id: applicationId,
        },
      );
      return Boolean(data?.data);
    } catch (err: any) {
      toast.showErrorToast("Error", getErrorMessage(err));
      return false;
    }
  };

  const fetchApplications = async (): Promise<Application[]> => {
    try {
      const { data } =
        await $axios.get<BaseResponse<Application[]>>("/api/applications");
      return data?.data ?? [];
    } catch {
      return [];
    }
  };

  const fetchApplication = async (
    id: string,
  ): Promise<{
    application: Application;
    attachments: ApplicationAttachment[];
  } | null> => {
    try {
      const { data } = await $axios.get<
        BaseResponse<{
          application: Application;
          attachments: ApplicationAttachment[];
        }>
      >(`/api/applications/${id}`);
      if (!data?.data) return null;
      return data.data;
    } catch {
      return null;
    }
  };

  const updateApplication = async (
    id: string,
    input: Partial<Application>,
  ): Promise<boolean> => {
    try {
      const { data } = await $axios.put<BaseResponse<Application>>(
        `/api/applications/${id}`,
        input,
      );
      return !!data?.data;
    } catch (err: any) {
      toast.showErrorToast("Error", getErrorMessage(err));
      return false;
    }
  };

  const deleteApplication = async (id: string): Promise<boolean> => {
    try {
      const { data } = await $axios.delete<BaseResponse<null>>(
        `/api/applications/${id}`,
      );
      return data?.success ?? false;
    } catch (err: any) {
      toast.showErrorToast("Error", getErrorMessage(err));
      return false;
    }
  };

  const sendEmail = async (
    id: string,
    code?: string,
    attachCv?: boolean,
  ): Promise<{ success: boolean; error?: string }> => {
    isSending.value = true;
    try {
      const body: Record<string, any> = {};
      if (code) body.code = code;
      if (attachCv !== undefined) body.attach_cv = attachCv;
      const { data } = await $axios.post<BaseResponse<null>>(
        `/api/applications/${id}/send`,
        body,
      );
      return { success: data?.success ?? false };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to send email";
      return { success: false, error: msg };
    } finally {
      isSending.value = false;
    }
  };

  const uploadAttachment = async (
    applicationId: string,
    file: File,
  ): Promise<ApplicationAttachment | null> => {
    isUploading.value = true;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await $axios.post<BaseResponse<ApplicationAttachment>>(
        `/api/applications/${applicationId}/attachments`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data?.data ?? null;
    } catch (err: any) {
      toast.showErrorToast("Error", getErrorMessage(err));
      return null;
    } finally {
      isUploading.value = false;
    }
  };

  const deleteAttachment = async (
    applicationId: string,
    attachmentId: string,
  ): Promise<boolean> => {
    try {
      const { data } = await $axios.delete<BaseResponse<null>>(
        `/api/applications/${applicationId}/attachments/${attachmentId}`,
      );
      return data?.success ?? false;
    } catch (err: any) {
      toast.showErrorToast("Error", getErrorMessage(err));
      return false;
    }
  };

  const fetchStats = async (): Promise<ApplicationStats> => {
    try {
      const { data } = await $axios.get<BaseResponse<ApplicationStats>>(
        "/api/applications/stats",
      );
      return data?.data ?? { total: 0, draft: 0, sent: 0 };
    } catch {
      return { total: 0, draft: 0, sent: 0 };
    }
  };

  return {
    isGenerating,
    isSending,
    isChatLoading,
    isUploading,
    generateEmail,
    sendChat,
    clearChat,
    fetchApplications,
    fetchApplication,
    updateApplication,
    deleteApplication,
    sendEmail,
    uploadAttachment,
    deleteAttachment,
    fetchStats,
  };
};

function getErrorMessage(err: any): string {
  return err?.response?.data?.message || err?.message || "Something went wrong";
}
