import { describe, expect, it, vi } from 'vitest'
import { useSubmitGuard } from '../useSubmitGuard'

describe('useSubmitGuard', () => {
  it('runs the first submitter and returns its result', async () => {
    const { guardedSubmit, submitting } = useSubmitGuard()
    const submitter = vi.fn().mockResolvedValue('saved')

    await expect(guardedSubmit(submitter)).resolves.toBe('saved')

    expect(submitter).toHaveBeenCalledTimes(1)
    expect(submitting.value).toBe(false)
  })

  it('ignores duplicate calls while a submit is still running', async () => {
    const { guardedSubmit, submitting } = useSubmitGuard()
    let resolveSubmit!: (value: string) => void
    const submitter = vi.fn(() => new Promise<string>((resolve) => {
      resolveSubmit = resolve
    }))

    const firstSubmit = guardedSubmit(submitter)
    const secondSubmit = guardedSubmit(submitter)

    expect(submitting.value).toBe(true)
    await expect(secondSubmit).resolves.toBeUndefined()
    expect(submitter).toHaveBeenCalledTimes(1)

    resolveSubmit('saved')
    await expect(firstSubmit).resolves.toBe('saved')
    expect(submitting.value).toBe(false)
  })

  it('resets submitting and rethrows the original error after failure', async () => {
    const { guardedSubmit, submitting } = useSubmitGuard()
    const error = new Error('save failed')
    const submitter = vi.fn().mockRejectedValue(error)

    await expect(guardedSubmit(submitter)).rejects.toBe(error)

    expect(submitter).toHaveBeenCalledTimes(1)
    expect(submitting.value).toBe(false)
  })
})
