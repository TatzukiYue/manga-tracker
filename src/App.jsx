import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'

const emptyManga = {
  title: '',
  origin: 'Japanese',
  chapter: '',
  lastReadDate: '',
  source: '',
  review: '',
  image: null,
}

function App() {
  const [mangaList, setMangaList] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedOrigin, setSelectedOrigin] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [newManga, setNewManga] = useState(emptyManga)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadManga()
  }, [])

  async function loadManga() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('manga')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error(error)
      setErrorMessage(`Could not load manga: ${error.message}`)
    } else {
      setMangaList(
        data.map((manga) => ({
          id: manga.id,
          title: manga.title,
          origin: manga.type,
          chapter: manga.current_chapter ?? '',
          lastReadDate: manga.date ?? '',
          source: manga.source ?? '',
          review: manga.review ?? '',
          image: manga.cover_image ?? null,
        }))
      )
    }

    setLoading(false)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setNewManga((currentManga) => ({ ...currentManga, [name]: value }))
  }

  function handlePaste(event) {
    const items = event.clipboardData.items

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()

        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage('Cover image is larger than 5MB.')
          return
        }

        const reader = new FileReader()
        reader.onload = () => {
          setNewManga((currentManga) => ({
            ...currentManga,
            image: reader.result,
          }))
        }
        reader.readAsDataURL(file)
        break
      }
    }
  }

  function resetForm() {
    setNewManga(emptyManga)
    setEditingId(null)
    setErrorMessage('')
  }

  function closeForm() {
    setShowForm(false)
    resetForm()
  }

  function openAddForm() {
    resetForm()
    setShowForm(true)
  }

  function openEditForm(manga) {
    setNewManga({
      title: manga.title,
      origin: manga.origin,
      chapter: manga.chapter,
      lastReadDate: manga.lastReadDate,
      source: manga.source,
      review: manga.review,
      image: manga.image,
    })
    setEditingId(manga.id)
    setErrorMessage('')
    setShowForm(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setErrorMessage('')

    const databaseManga = {
      title: newManga.title.trim(),
      type: newManga.origin,
      current_chapter: Number(newManga.chapter),
      date: newManga.lastReadDate || null,
      source: newManga.source.trim() || null,
      review: newManga.review.trim() || null,
      cover_image: newManga.image,
    }

    let error

    if (editingId !== null) {
      ;({ error } = await supabase
        .from('manga')
        .update(databaseManga)
        .eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('manga').insert([databaseManga]))
    }

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      setSaving(false)
      return
    }

    await loadManga()
    setSaving(false)
    closeForm()
  }

  async function handleDelete(id, title) {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`)
    if (!confirmed) return

    setErrorMessage('')

    const { error } = await supabase
      .from('manga')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      setErrorMessage(`Could not delete manga: ${error.message}`)
      return
    }

    setMangaList((currentList) =>
      currentList.filter((manga) => manga.id !== id)
    )
  }

  const filteredManga = mangaList.filter((manga) => {
    const matchesOrigin =
      selectedOrigin === 'All' || manga.origin === selectedOrigin

    const matchesSearch = manga.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    return matchesOrigin && matchesSearch
  })

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-title">
          <h2>Manga</h2>
          <p>Library</p>
        </div>

        <div className="bookmark-list">
          {[
            ['All', '📚'],
            ['Korean', '🇰🇷'],
            ['Japanese', '🇯🇵'],
            ['Chinese', '🇨🇳'],
            ['Other', '🌐'],
          ].map(([origin, icon]) => (
            <button
              key={origin}
              className={`bookmark ${origin.toLowerCase()} ${selectedOrigin === origin ? 'active' : ''}`}
              onClick={() => setSelectedOrigin(origin)}
            >
              <span>{icon}</span>
              {origin}
            </button>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <header>
          <div>
            <h1>Manga Tracker</h1>
            <p>Track your manga reading progress.</p>
          </div>

          <button className="add-button" onClick={openAddForm}>
            + Add Manga
          </button>
        </header>

        <section className="library-section">
          <h2>My Library</h2>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search manga..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              value={selectedOrigin}
              onChange={(event) => setSelectedOrigin(event.target.value)}
            >
              <option value="All">All Origins</option>
              <option value="Japanese">Japanese Manga</option>
              <option value="Korean">Korean Manhwa</option>
              <option value="Chinese">Chinese Manhua</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {errorMessage && !showForm && (
            <p className="database-error">{errorMessage}</p>
          )}

          <div className="manga-grid">
            {loading ? (
              <div className="empty-library"><p>Loading manga...</p></div>
            ) : filteredManga.length > 0 ? (
              filteredManga.map((manga) => (
                <article key={manga.id}>
                  <div className="cover-container">
                    {manga.image ? (
                      <img
                        src={manga.image}
                        alt={manga.title}
                        className="manga-cover"
                      />
                    ) : (
                      'Cover'
                    )}
                  </div>

                  <div className="card-content">
                    <h3>{manga.title}</h3>
                    <p>{manga.origin}</p>
                    <p>Chapter {manga.chapter}</p>

                    <div className="card-actions">
                      <button
                        className="edit-button"
                        onClick={() => openEditForm(manga)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(manga.id, manga.title)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-library">
                <p>No manga found.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId !== null ? 'Edit Manga' : 'Add Manga'}</h2>
              <button className="close-button" onClick={closeForm}>✕</button>
            </div>

            {errorMessage && <p className="database-error">{errorMessage}</p>}

            <form onSubmit={handleSubmit}>
              <div className="form-top-section">
                <div className="form-fields">
                  <div className="input-group">
                    <label>Manga title</label>
                    <input type="text" name="title" placeholder="Enter manga title" value={newManga.title} onChange={handleChange} required />
                  </div>

                  <div className="input-group">
                    <label>Type</label>
                    <select name="origin" value={newManga.origin} onChange={handleChange}>
                      <option value="Japanese">Japanese Manga</option>
                      <option value="Korean">Korean Manhwa</option>
                      <option value="Chinese">Chinese Manhua</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Current chapter</label>
                    <input type="number" name="chapter" min="0" placeholder="e.g. 1, 25, 120" value={newManga.chapter} onChange={handleChange} required />
                  </div>

                  <div className="input-group">
                    <label>Date</label>
                    <input type="date" name="lastReadDate" value={newManga.lastReadDate} onChange={handleChange} />
                  </div>
                </div>

                <div className="cover-section">
                  <label>Cover image</label>
                  <div className="paste-area" onPaste={handlePaste} tabIndex="0">
                    {newManga.image ? (
                      <img src={newManga.image} alt="Preview" className="image-preview" />
                    ) : (
                      <div className="paste-placeholder">
                        <div className="image-icon">Pic?</div>
                        <p>Click here and press Ctrl + V<br />to paste an image</p>
                      </div>
                    )}
                  </div>
                  <p className="image-info">Supports JPG, PNG, WebP<br />Max size: 5MB</p>
                </div>
              </div>

              <div className="form-bottom-section">
                <div className="input-group">
                  <label>Where did you read it? (optional)</label>
                  <input type="text" name="source" placeholder="e.g. MangaDex, Tachiyomi, Webtoon, etc." value={newManga.source} onChange={handleChange} />
                </div>

                <div className="input-group">
                  <label>Your personal review...</label>
                  <textarea name="review" placeholder="Share your thoughts about this manga..." value={newManga.review} onChange={handleChange} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeForm}>Cancel</button>
                <button type="submit" className="save-button" disabled={saving}>
                  {saving ? 'Saving...' : editingId !== null ? 'Update Manga' : 'Save Manga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
