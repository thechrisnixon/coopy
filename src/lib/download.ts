/**
 * Hands the browser a file to save.
 *
 * Used for the Markdown exports — the same renderer that writes `cookbook/`
 * at build time, so what you download and what's committed are identical.
 */
export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Revoking immediately can cancel the download in some browsers; a tick is
  // enough for the navigation to have been queued.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
