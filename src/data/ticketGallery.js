/* Local stand-in for the gallery store. Swaps for tickets.js once the
   Supabase bucket exists. */

const KEY = 'mizu:ticket-gallery'
const MAX = 18
const THUMB_W = 520

/* Flattened before encoding so the WebP and JPEG paths look identical
   on the page: the plate has real transparency where the notches cut. */
const MAT = '#0a0a0b'

/* Canvas silently returns PNG for a type it cannot encode, so the
   result is checked rather than assumed. Safari only learned canvas
   WebP recently. */
function encode(canvas, q) {
  for (const type of ['image/webp', 'image/jpeg']) {
    const url = canvas.toDataURL(type, q)
    if (url.startsWith(`data:${type}`)) return url
  }
  return canvas.toDataURL('image/jpeg', q)
}

export function readGallery() {
  try {
    const raw = window.localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function write(list) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

function shrink(blob, maxW) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxW / img.naturalWidth)
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(img.naturalWidth * scale))
      c.height = Math.max(1, Math.round(img.naturalHeight * scale))
      const ctx = c.getContext('2d')
      ctx.fillStyle = MAT
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0, c.width, c.height)
      resolve(encode(c, 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode failed'))
    }
    img.src = url
  })
}

export async function addTicket({ blob, name, preset }) {
  const thumb = await shrink(blob, THUMB_W)
  const entry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name || 'GUEST',
    jp: preset?.jp || '',
    design: preset?.name || '',
    thumb,
    at: Date.now(),
  }

  /* Quota throws rather than warning, so drop the oldest and retry. */
  let list = [entry, ...readGallery()].slice(0, MAX)
  while (list.length > 1 && !write(list)) list = list.slice(0, -1)
  if (list.length <= 1 && !write(list)) throw new Error('storage full')

  return entry
}

export function removeTicket(id) {
  write(readGallery().filter((t) => t.id !== id))
}
