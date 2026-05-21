import type { Component, InjectionKey, Ref } from 'vue'
import { defineAsyncComponent } from 'vue'
import { $t } from '@/shared/i18n'

export interface AccountPane {
  key: string
  label: string
  icon: string
  order: number
  component: Component
}

export interface ActivePaneInfo {
  label: string
}

export const activePaneKey: InjectionKey<Ref<ActivePaneInfo>> = Symbol('activePane')

export const accountPanes: AccountPane[] = [
  {
    key: 'profile',
    label: $t('account.profile'),
    icon: 'user',
    order: 1,
    component: defineAsyncComponent(() => import('./components/Profile.vue')),
  },
  {
    key: 'securityLog',
    label: $t('account.securityLog'),
    icon: 'document',
    order: 2,
    component: defineAsyncComponent(() => import('./components/SecurityLog.vue')),
  },
  {
    key: 'accountManagement',
    label: $t('account.accountManagement'),
    icon: 'setting',
    order: 3,
    component: defineAsyncComponent(() => import('./components/AccountManagement.vue')),
  },
]

export const defaultPane = 'profile'
