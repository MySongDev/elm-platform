export function displayOrderLogRequestId(requestId: string | null | undefined) {
  const normalizedRequestId = requestId?.trim()

  return normalizedRequestId || '-'
}
