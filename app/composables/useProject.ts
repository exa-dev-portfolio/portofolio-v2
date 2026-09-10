import { useToastCustom } from "~/composables/useToastCustom";
import type {
  GitHubOrgData,
  Project,
  ProjectPreviewInput,
  ProjectsResponse,
} from "~/types/project";

export const useProject = () => {
  const projects = ref<Array<Project>>([]);
  const isLoading = ref<boolean>(false);
  const isSaving = ref<boolean>(false);
  const cursor = ref<number | null>(null);
  const { $axios } = useNuxtApp();
  const toast = useToastCustom();
  const hasMore = ref<boolean>(true);

  const fetchProjects = async (
    loadMore = false,
    searchQuery: string,
    pagination: boolean = true,
  ): Promise<ProjectsResponse> => {
    isLoading.value = true;
    try {
      const query: Record<string, any> = {
        search: searchQuery || undefined,
        pagination: pagination,
        limit: 12,
      };

      if (loadMore && cursor.value) {
        query.cursor = cursor.value;
      }

      const params = Object.fromEntries(
        Object.entries(query).filter(([, v]) => v !== undefined),
      );

      const response = await $axios.get<BaseResponse<ProjectsResponse>>(
        "/api/projects",
        { params },
      );
      const body = response.data;

      // Ensure body.data exists - return default instead of throwing so we handle it gracefully
      if (!body || !body.data) {
        console.error("Invalid response from server", body);
        return {
          data: [],
          has_next: false,
        };
      }

      if (loadMore) {
        projects.value.push(...body.data.data);
      } else {
        projects.value = body.data.data;
      }

      hasMore.value = body.data.has_next;

      if (body.data.data.length > 0) {
        const last = body.data.data.at(-1);
        cursor.value = last && last.id != null ? last.id : null;
      }

      return body.data;
    } catch (error) {
      console.error("Failed to fetch skills:", error);

      // RETURN DEFAULT
      return {
        data: [],
        has_next: false,
      };
    } finally {
      isLoading.value = false;
    }
  };

  const fetchProjectById = async (
    projectId: number,
  ): Promise<Project | null> => {
    isLoading.value = true;
    try {
      const response = await $axios.get<BaseResponse<Project>>(
        `/api/projects/${projectId}`,
      );
      const body = response.data;

      if (!body || !body.data) {
        console.error("Invalid response from server", body);
        return null;
      }

      return body.data;
    } catch (error) {
      console.error("Failed to fetch project by ID:", error);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const createProject = async (
    projectData: Project,
    previewInputs: ProjectPreviewInput[] = [],
  ): Promise<boolean> => {
    isSaving.value = true;
    const loadingToast = toast.showLoadingToast(
      "Creating Project",
      "Please wait while the project is being created.",
    );
    try {
      const formData = new FormData();

      formData.append("name", projectData.name);
      formData.append("description", projectData.description);
      formData.append("status", String(projectData.status));

      if (projectData.image) {
        formData.append("image", projectData.image);
      }

      const cleanFeatures = projectData.features.filter((f: string) =>
        f.trim(),
      );
      cleanFeatures.forEach((f) => formData.append("features", f));

      const techList = projectData.technologies || projectData.id_skills || [];
      techList.forEach((id) => formData.append("id_skills", String(id)));

      if (projectData.start_date?.trim()) {
        formData.append("start_date", projectData.start_date);
      }
      if (projectData.end_date?.trim()) {
        formData.append("end_date", projectData.end_date);
      }
      if (projectData.repo_url?.trim()) {
        formData.append("repo_url", projectData.repo_url);
      }
      if (projectData.live_url?.trim()) {
        formData.append("live_url", projectData.live_url);
      }
      formData.append("is_organization", String(Boolean(projectData.is_organization)));
      if (projectData.github_org?.trim()) {
        formData.append("github_org", projectData.github_org.trim());
      }
      if (projectData.sub_apps) {
        formData.append("sub_apps", JSON.stringify(projectData.sub_apps));
      }

      // Append preview files & metadata
      const metadata: any[] = [];
      let fileIndex = 0;
      if (previewInputs && previewInputs.length > 0) {
        for (const item of previewInputs) {
          if (item.file) {
            formData.append("preview_files", item.file);
            metadata.push({
              title: item.title || "",
              caption: item.caption || "",
              file_index: fileIndex++,
            });
          } else if (item.url) {
            metadata.push({
              url: item.url,
              title: item.title || "",
              caption: item.caption || "",
            });
          }
        }
      }
      formData.append("preview_metadata", JSON.stringify(metadata));

      const res = await $axios.post<BaseResponse<null>>(
        "/api/projects",
        formData,
      );
      toast.updateToast(
        loadingToast.id,
        "Success",
        "Project created successfully!",
        "success",
        4000,
      );
      return Boolean(res.data.success);
    } catch (e) {
      console.error("Failed to create project", e);
      const errorMessage = getErrorMessageAxios(e);
      toast.updateToast(
        loadingToast.id,
        "Error",
        `Failed to create project: ${errorMessage}`,
        "error",
        6000,
      );
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  const updateProject = async (
    projectData: Project,
    previewInputs: ProjectPreviewInput[] = [],
  ): Promise<boolean> => {
    isSaving.value = true;
    const loadingToast = toast.showLoadingToast(
      "Updating Project",
      "Please wait while the project is being updated.",
    );
    try {
      const formData = new FormData();

      if (projectData.id) {
        formData.append("id", String(projectData.id));
      }
      formData.append("name", projectData.name);
      formData.append("description", projectData.description);
      formData.append("status", String(projectData.status));

      if (projectData.image) {
        formData.append("image", projectData.image);
      }

      const cleanFeatures = projectData.features.filter((f: string) =>
        f.trim(),
      );
      cleanFeatures.forEach((f) => formData.append("features", f));

      const techList = projectData.id_skills || projectData.technologies || [];
      techList.forEach((id) => formData.append("id_skills", String(id)));

      if (projectData.start_date?.trim()) {
        formData.append("start_date", projectData.start_date);
      }
      if (projectData.end_date?.trim()) {
        formData.append("end_date", projectData.end_date);
      }
      if (projectData.repo_url?.trim()) {
        formData.append("repo_url", projectData.repo_url);
      }
      if (projectData.live_url?.trim()) {
        formData.append("live_url", projectData.live_url);
      }
      formData.append("is_organization", String(Boolean(projectData.is_organization)));
      if (projectData.github_org?.trim()) {
        formData.append("github_org", projectData.github_org.trim());
      }
      if (projectData.sub_apps) {
        formData.append("sub_apps", JSON.stringify(projectData.sub_apps));
      }

      // Append preview files & metadata
      const metadata: any[] = [];
      let fileIndex = 0;
      if (previewInputs && previewInputs.length > 0) {
        for (const item of previewInputs) {
          if (item.file) {
            formData.append("preview_files", item.file);
            metadata.push({
              title: item.title || "",
              caption: item.caption || "",
              file_index: fileIndex++,
            });
          } else if (item.url) {
            metadata.push({
              url: item.url,
              title: item.title || "",
              caption: item.caption || "",
            });
          }
        }
      }
      formData.append("preview_metadata", JSON.stringify(metadata));

      const res = await $axios.put<BaseResponse<null>>(
        `/api/projects`,
        formData,
      );
      toast.updateToast(
        loadingToast.id,
        "Success",
        "Project updated successfully!",
        "success",
        4000,
      );
      return Boolean(res.data.success);
    } catch (e) {
      console.error("Failed to update project", e);
      const errorMessage = getErrorMessageAxios(e);
      toast.updateToast(
        loadingToast.id,
        "Error",
        `Failed to update project: ${errorMessage}`,
        "error",
        6000,
      );
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  const deleteProject = async (projectId: number): Promise<boolean> => {
    isSaving.value = true;
    const loadingToast = toast.showLoadingToast(
      "Deleting Project",
      "Please wait while the project is being deleted.",
    );
    try {
      const res = await $axios.delete<BaseResponse<null>>(
        `/api/projects/${projectId}`,
      );
      toast.updateToast(
        loadingToast.id,
        "Success",
        "Project deleted successfully!",
        "success",
        4000,
      );
      return Boolean(res.data.success);
    } catch (e) {
      console.error("Failed to delete project", e);
      const errorMessage = getErrorMessageAxios(e);
      toast.updateToast(
        loadingToast.id,
        "Error",
        `Failed to delete project: ${errorMessage}`,
        "error",
        6000,
      );
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  const fetchOrgRepos = async (
    org: string,
  ): Promise<GitHubOrgData | null> => {
    try {
      const response = await $axios.get<BaseResponse<GitHubOrgData>>(
        "/api/github/org-repos",
        {
          params: { org },
        },
      );
      return response.data?.data || null;
    } catch (error) {
      console.error("Failed to fetch GitHub org repos:", error);
      const errorMessage = getErrorMessageAxios(error);
      toast.showErrorToast(
        "GitHub Error",
        errorMessage || "Failed to fetch organization repositories",
      );
      return null;
    }
  };

  return {
    projects,
    isLoading,
    cursor,
    isSaving,
    hasMore,
    fetchProjects,
    createProject,
    fetchProjectById,
    updateProject,
    deleteProject,
    fetchOrgRepos,
  };
};
