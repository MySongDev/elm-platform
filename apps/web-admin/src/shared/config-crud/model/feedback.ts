export interface ConfigCrudFeedback {
  confirmDelete?: (message: string) => boolean | Promise<boolean>
  notifySaveSuccess?: (message: string) => void
  notifyDeleteSuccess?: (message: string) => void
}

export function createSilentCrudFeedback(): Required<ConfigCrudFeedback> {
  return {
    confirmDelete: () => true,
    notifySaveSuccess: () => {},
    notifyDeleteSuccess: () => {},
  }
}
