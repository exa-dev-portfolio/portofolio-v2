<script setup lang="ts">
import type { Application, ApplicationAttachment } from "~/types/application";
import { useBreadCrumbStore } from "~/stores/bread-crumb";

definePageMeta({
  layout: "dashboard",
  breadCrumb: [
    { title: "Apply", link: "/dashboard/apply" },
    { title: "Application" },
  ],
});

const route = useRoute();
const router = useRouter();
const toast = useToastCustom();
const config = useRuntimeConfig();
const id = route.params.id as string;

const {
  fetchApplication,
  updateApplication,
  sendEmail,
  sendChat,
  clearChat,
  uploadAttachment,
  deleteAttachment,
  isSending,
  isChatLoading,
  isUploading,
} = useApply();

const application = ref<Application | null>(null);
const attachments = ref<ApplicationAttachment[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);

const subject = ref("");
const body = ref("");
const reasoning = ref<string[]>([]);

const chatMessages = ref<Array<{ role: string; content: string }>>([]);
const attachCv = ref(true);

const loadData = async () => {
  isLoading.value = true;
  try {
    const appData = await fetchApplication(id);
    if (!appData) {
      toast.showErrorToast("Error", "Application not found");
      await router.push("/dashboard/apply");
      return;
    }
    application.value = appData.application;
    attachments.value = appData.attachments;

    subject.value = appData.application.email_subject || "";
    body.value = appData.application.email_body || "";
    if (appData.application.email_reasoning) {
      reasoning.value = appData.application.email_reasoning
        .split("\n")
        .filter(Boolean);
    }

    // Restore chat history from backend or localStorage
    if (appData.application.chat_history) {
      if (Array.isArray(appData.application.chat_history)) {
        chatMessages.value = [...appData.application.chat_history];
      } else if (typeof appData.application.chat_history === "string") {
        try {
          chatMessages.value = JSON.parse(appData.application.chat_history);
        } catch {
          chatMessages.value = [];
        }
      }
    } else {
      try {
        const cached = localStorage.getItem(`apply_chat_${id}`);
        if (cached) {
          chatMessages.value = JSON.parse(cached);
        }
      } catch {}
    }
    try {
      localStorage.setItem(`apply_chat_${id}`, JSON.stringify(chatMessages.value));
    } catch {}

    const breadCrumb = useBreadCrumbStore();
    breadCrumb.setBreadCrumb([
      { title: "Apply", link: "/dashboard/apply" },
      {
        title: `${appData.application.company_name} - ${appData.application.position}`,
      },
    ]);
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // Pre-load from localStorage instantly to prevent layout jump on refresh
  try {
    const cached = localStorage.getItem(`apply_chat_${id}`);
    if (cached) {
      chatMessages.value = JSON.parse(cached);
    }
  } catch {}
  loadData();
});

const handleSave = async () => {
  if (!application.value) return;
  isSaving.value = true;
  const ok = await updateApplication(id, {
    email_subject: subject.value,
    email_body: body.value,
  });
  if (ok) toast.showSuccessToast("Saved", "Draft saved successfully");
  isSaving.value = false;
};

const handleSend = async () => {
  if (!application.value) return;

  toast.showConfirmationToast(
    "Send Application",
    `Send application to ${application.value.hr_email}?`,
    () => {
      const loadingToast = toast.showLoadingToast("Sending", "Preparing...");
      doSend(loadingToast.id);
    },
  );
};

const doSend = async (tid: any, code?: string) => {
  const toastId = typeof tid === "object" && tid !== null ? tid.id : tid;
  toast.updateToast(
    toastId,
    "Sending",
    "Sending email...",
    "primary",
    Infinity,
    "line-md:loading-loop",
  );
  const result = await sendEmail(id, code, attachCv.value);
  if (result.success) {
    toast.updateToast(toastId, "Sent!", "Email sent successfully", "success", 2000);
    await loadData();
  } else if (result.error?.includes("Gmail authorization required")) {
    toast.updateToast(
      toastId,
      "Authorizing",
      "Please authorize Gmail in the popup...",
      "primary",
      Infinity,
      "line-md:loading-loop",
    );
    requestGmailAuth(toastId);
  } else {
    toast.updateToast(
      toastId,
      "Error",
      result.error || "Failed to send email",
      "error",
      4000,
    );
  }
};

const loadGsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
};

const requestGmailAuth = async (tid: any) => {
  const toastId = typeof tid === "object" && tid !== null ? tid.id : tid;
  const googleClientId = config.public.googleClientId as string;
  if (!googleClientId) {
    toast.updateToast(
      toastId,
      "Error",
      "Google Client ID not configured",
      "error",
      4000,
    );
    return;
  }

  try {
    await loadGsiScript();
  } catch {
    toast.updateToast(
      toastId,
      "Error",
      "Failed to load Google OAuth. Check your internet connection.",
      "error",
      4000,
    );
    return;
  }

  if (!(window as any).google?.accounts?.oauth2) {
    toast.updateToast(
      toastId,
      "Error",
      "Google OAuth not available",
      "error",
      4000,
    );
    return;
  }

  const client = (window as any).google.accounts.oauth2.initCodeClient({
    client_id: googleClientId,
    scope: "https://www.googleapis.com/auth/gmail.send email profile openid",
    ux_mode: "popup",
    callback: async (response: any) => {
      if (response.code) {
        toast.updateToast(
          toastId,
          "Sending",
          "Authorizing Gmail and sending email...",
          "primary",
          Infinity,
          "line-md:loading-loop",
        );
        await doSend(toastId, response.code);
      } else {
        toast.updateToast(
          toastId,
          "Cancelled",
          "Gmail authorization cancelled",
          "warning",
          3000,
        );
      }
    },
  });

  client.requestCode();
};

const handleChatSend = async (message: string) => {
  chatMessages.value.push({ role: "user", content: message });
  try {
    localStorage.setItem(`apply_chat_${id}`, JSON.stringify(chatMessages.value));
  } catch {}

  const result = await sendChat(id, message);
  if (result) {
    if (result.chat_history && Array.isArray(result.chat_history)) {
      chatMessages.value = [...result.chat_history];
    } else {
      chatMessages.value.push({ role: "assistant", content: result.reply });
    }
    try {
      localStorage.setItem(`apply_chat_${id}`, JSON.stringify(chatMessages.value));
    } catch {}

    if (result.revised_subject) subject.value = result.revised_subject;
    if (result.revised_body) body.value = result.revised_body;
    if (result.reasoning) reasoning.value = result.reasoning;
  }
};

const handleChatClear = async () => {
  const confirmed = confirm("Apakah Anda yakin ingin menghapus semua riwayat chat revisi?");
  if (!confirmed) return;

  chatMessages.value = [];
  try {
    localStorage.removeItem(`apply_chat_${id}`);
  } catch {}
  await clearChat(id);
  toast.showSuccessToast("Riwayat Dibersihkan", "Riwayat chat berhasil dihapus.");
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      toast.showErrorToast("Too Large", `${file.name} exceeds 5MB limit`);
      continue;
    }
    const result = await uploadAttachment(id, file);
    if (result) {
      attachments.value.push(result);
      toast.showSuccessToast("Uploaded", `${file.name} attached`);
    }
  }
  target.value = "";
};

const handleDeleteAttachment = async (attachmentId: string) => {
  toast.showConfirmationToast(
    "Remove File",
    "Remove this attachment?",
    async () => {
      const ok = await deleteAttachment(id, attachmentId);
      if (ok) {
        attachments.value = attachments.value.filter(
          (a) => a.id !== attachmentId,
        );
        toast.showSuccessToast("Removed", "Attachment removed");
      }
    },
  );
};
</script>

<template>
  <div v-if="isLoading" class="flex justify-center items-center h-64">
    <Icon name="line-md:loading-loop" size="32" class="text-zinc-400" />
  </div>

  <div v-else-if="application" class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-white mb-1">
          {{ application.company_name }}
        </h1>
        <p class="text-sm text-zinc-400">{{ application.position }}</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="application.status === 'draft'"
          @click="handleSave"
          :disabled="isSaving"
          class="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 text-sm cursor-pointer"
        >
          <Icon v-if="isSaving" name="line-md:loading-loop" size="16" />
          <Icon v-else name="carbon:save" size="16" />
          Save Draft
        </button>
        <button
          @click="handleSend"
          :disabled="isSending || application.status === 'sent'"
          class="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 disabled:opacity-40 transition-all flex items-center gap-2 text-sm shadow-sm cursor-pointer"
        >
          <Icon v-if="isSending" name="line-md:loading-loop" size="16" />
          <Icon v-else name="carbon:send" size="16" />
          {{ application.status === "sent" ? "Sent" : "Send via Gmail" }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div class="lg:col-span-3 space-y-6">
        <ApplySummaryCard
          :company_name="application.company_name"
          :position="application.position"
          :hr_email="application.hr_email"
          :status="application.status"
          :job_link="application.job_link"
          :sent_at="application.sent_at"
        />

        <div class="bg-[#141417] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm">
          <ApplyEmailEditor
            v-model:subject="subject"
            v-model:body="body"
            :reasoning="reasoning"
            :readonly="application.status === 'sent'"
          />
        </div>

        <div class="bg-[#141417] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 class="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="carbon:attachment" size="18" class="text-zinc-400" />
            Attachments
          </h3>

          <div class="space-y-2 mb-4">
            <div
              class="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10"
            >
              <div class="flex items-center gap-3">
                <Icon
                  name="carbon:document-pdf"
                  size="20"
                  class="text-rose-400"
                />
                <div>
                  <p class="text-sm font-medium text-white">CV.pdf</p>
                  <p class="text-xs text-zinc-500">Attach CV as PDF</p>
                </div>
              </div>
              <button
                v-if="application.status === 'draft'"
                @click="attachCv = !attachCv"
                :class="[
                  'px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                  attachCv
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white',
                ]"
              >
                {{ attachCv ? "Attached" : "Not attached" }}
              </button>
              <Icon
                v-else
                name="carbon:checkmark"
                size="18"
                class="text-emerald-400"
              />
            </div>

            <div
              v-for="att in attachments"
              :key="att.id"
              class="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10"
            >
              <div class="flex items-center gap-3">
                <Icon name="carbon:document" size="20" class="text-zinc-400" />
                <div>
                  <p class="text-sm font-medium text-white">
                    {{ att.file_name }}
                  </p>
                  <p v-if="att.file_size" class="text-xs text-zinc-500">
                    {{ (att.file_size / 1024).toFixed(1) }} KB
                  </p>
                </div>
              </div>
              <button
                v-if="application.status === 'draft'"
                @click="handleDeleteAttachment(att.id)"
                class="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
              >
                <Icon name="carbon:close" size="16" />
              </button>
            </div>
          </div>

          <div v-if="application.status === 'draft'">
            <input
              id="fileUpload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
              @change="handleFileUpload"
              class="hidden"
            />
            <label
              for="fileUpload"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/15 text-zinc-400 hover:border-white/30 hover:text-white transition-all cursor-pointer text-sm bg-white/[0.02]"
            >
              <Icon v-if="isUploading" name="line-md:loading-loop" size="16" />
              <Icon v-else name="carbon:cloud-upload" size="18" />
              {{ isUploading ? "Uploading..." : "Add Files (max 5MB each)" }}
            </label>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2">
        <ApplyChatPanel
          :messages="chatMessages"
          :loading="isChatLoading"
          @send="handleChatSend"
          @clear="handleChatClear"
        />
      </div>
    </div>
  </div>
</template>
