export const useFeatureFlag = () => {
  const config = useRuntimeConfig();

  const isApkStoreEnabled = computed(() => {
    return Boolean(config.public?.enableApkStore);
  });

  return {
    isApkStoreEnabled,
  };
};
