import type { Ref } from 'vue'
import { ref } from 'vue'

interface UseAlertReturn {
  alertText: Ref<string>
  showAlert: (text: string) => void
  closeAlert: () => void
}

export function useAlert(): UseAlertReturn {
  const alertText = ref('')

  const showAlert = (text: string) => {
    alertText.value = text
  }

  const closeAlert = () => {
    alertText.value = ''
  }

  return {
    alertText,
    showAlert,
    closeAlert,
  }
}
