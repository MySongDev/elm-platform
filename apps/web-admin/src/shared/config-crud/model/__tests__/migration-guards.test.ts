import { describe, expect, it } from 'vitest'
import crudActionColumnSource from '../../components/CrudActionColumn/index.vue?raw'
import configCrudBarrelSource from '../../index.ts?raw'

describe('config-crud migration guards', () => {
  it('does not export the deleted ConfigCrudPage shell', () => {
    expect(configCrudBarrelSource).not.toContain('ConfigCrudPage')
  })

  it('keeps preset table actions connected to v-auth', () => {
    expect(crudActionColumnSource).toContain('v-auth="editAction?.auth"')
    expect(crudActionColumnSource).toContain('v-auth="deleteAction?.auth"')
  })
})
