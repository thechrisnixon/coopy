import { useRef, useState } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { TextArea } from '@astryxdesign/core/TextArea'
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl'
import { toYaml, toSlug, type ParsedRecipe } from '../lib/draft'
import { commitRecipe, getToken, setToken } from '../lib/github'
import './Add.css'

type Mode = 'photo' | 'link' | 'text'
type Stage = 'input' | 'review' | 'done'

export default function Add() {
  const [mode, setMode] = useState<Mode>('photo')
  const [stage, setStage] = useState<Stage>('input')

  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [yaml, setYaml] = useState('')
  const [slug, setSlug] = useState('')
  const [committedUrl, setCommittedUrl] = useState('')

  const [token, setTokenState] = useState(getToken())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function parse(payload: Record<string, unknown>) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      // A crashed or timed-out function returns the host's HTML error page,
      // not JSON. Parsing it blindly would report a misleading "Unexpected
      // token" instead of what actually went wrong, so read text first.
      const raw = await res.text()
      let body: { recipe?: ParsedRecipe; error?: string } | null = null
      try {
        body = JSON.parse(raw)
      } catch {
        throw new Error(
          res.status === 504 || /timed? ?out/i.test(raw)
            ? 'The parser timed out. Long pages sometimes need a second attempt.'
            : `The parser failed (HTTP ${res.status}) and did not return JSON. ` +
              `This usually means ANTHROPIC_API_KEY isn't set on the server. ` +
              `Response began: "${raw.slice(0, 80).replace(/\s+/g, ' ').trim()}"`,
        )
      }

      if (!res.ok || !body?.recipe) {
        throw new Error(body?.error ?? `Parser returned ${res.status}.`)
      }

      setYaml(toYaml(body.recipe))
      setSlug(toSlug(body.recipe.name))
      setStage('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  function onFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setPreview(dataUrl)
      void parse({ image: dataUrl, mediaType: file.type })
    }
    reader.readAsDataURL(file)
  }

  async function commit() {
    setBusy(true)
    setError('')
    try {
      const { url: fileUrl } = await commitRecipe(slug, yaml, token)
      setCommittedUrl(fileUrl)
      setStage('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setStage('input')
    setYaml('')
    setSlug('')
    setPreview(null)
    setUrl('')
    setText('')
    setCommittedUrl('')
    setError('')
  }

  return (
    <div className="add">
      <header className="add__head">
        <h1 className="display add__title">Add a recipe</h1>
        <p className="add__blurb">
          Parse it from a photo, a link, or pasted text — then review the result
          and commit it. The site rebuilds in about fifteen seconds.
        </p>
      </header>

      {error && (
        <div className="add__error" role="alert">
          {error}
        </div>
      )}

      {stage === 'input' && (
        <>
          <div className="add__modes">
            <SegmentedControl
              label="Source type"
              value={mode}
              onChange={(v) => setMode(v as Mode)}
              size="lg"
            >
              <SegmentedControlItem value="photo" label="Photo" />
              <SegmentedControlItem value="link" label="Link" />
              <SegmentedControlItem value="text" label="Text" />
            </SegmentedControl>
          </div>

          {mode === 'photo' && (
            <div className="add__panel">
              <button
                type="button"
                className="dropzone"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) onFile(file)
                }}
              >
                {preview ? (
                  <img src={preview} alt="Selected recipe" className="dropzone__preview" />
                ) : (
                  <>
                    <span className="dropzone__icon">◳</span>
                    <span className="dropzone__label">
                      Drop a photo of a recipe card, or tap to choose one
                    </span>
                    <span className="dropzone__hint">
                      A phone photo of a handwritten card works fine
                    </span>
                  </>
                )}
              </button>
              {/* capture="environment" opens the rear camera straight from a
                  phone, which is the whole point of the mobile flow. */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onFile(file)
                }}
              />
            </div>
          )}

          {mode === 'link' && (
            <div className="add__panel">
              <TextInput
                label="Recipe URL"
                description="Some sites (Serious Eats, Allrecipes) block automated requests. If a link fails, copy the recipe and use the Text tab."
                placeholder="https://…"
                value={url}
                onChange={setUrl}
                size="lg"
                width="100%"
              />
              <Button
                label="Parse this link"
                variant="primary"
                size="lg"
                isLoading={busy}
                isDisabled={!url.trim()}
                onClick={() => void parse({ url: url.trim() })}
              />
            </div>
          )}

          {mode === 'text' && (
            <div className="add__panel">
              <TextArea
                label="Paste the recipe"
                placeholder="Ingredients, method, anything you've got…"
                value={text}
                onChange={setText}
                rows={12}
                width="100%"
              />
              <Button
                label="Parse this text"
                variant="primary"
                size="lg"
                isLoading={busy}
                isDisabled={!text.trim()}
                onClick={() => void parse({ text: text.trim() })}
              />
            </div>
          )}

          {busy && mode === 'photo' && (
            <p className="add__status eyebrow">Reading the photo…</p>
          )}
        </>
      )}

      {stage === 'review' && (
        <div className="add__panel">
          <h2 className="eyebrow">Review before committing</h2>
          <p className="add__note">
            This is exactly what lands in the repo. Fix anything the parser got
            wrong — misread quantities are the usual culprit.
          </p>

          <TextInput
            label="Filename"
            description="Saved as recipes/<slug>.yaml"
            value={slug}
            onChange={setSlug}
            width="100%"
          />

          <textarea
            className="add__yaml tabular"
            value={yaml}
            onChange={(e) => setYaml(e.target.value)}
            spellCheck={false}
            rows={26}
            aria-label="Recipe YAML"
          />

          <TextInput
            label="GitHub token"
            type="password"
            description="Fine-grained, scoped to coopy, contents:write. Stored only in this browser."
            value={token}
            onChange={(v) => {
              setTokenState(v)
              setToken(v)
            }}
            width="100%"
          />

          <div className="add__actions">
            <Button label="Start over" variant="ghost" size="lg" onClick={reset} />
            <Button
              label="Commit to repo"
              variant="primary"
              size="lg"
              isLoading={busy}
              isDisabled={!token.trim() || !slug.trim() || !yaml.trim()}
              onClick={() => void commit()}
            />
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div className="add__panel add__done">
          <h2 className="display add__doneTitle">Committed.</h2>
          <p className="add__note">
            Vercel is rebuilding — it'll be live in about fifteen seconds.
          </p>
          <div className="add__actions">
            <a href={committedUrl} target="_blank" rel="noreferrer" className="add__link">
              View the file on GitHub ↗
            </a>
            <Button label="Add another" variant="primary" size="lg" onClick={reset} />
          </div>
        </div>
      )}
    </div>
  )
}
