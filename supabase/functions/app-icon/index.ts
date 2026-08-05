/* Discord application icon lookup.
 *
 * A game detected by Discord sends only an application_id. There are no
 * activity assets, so the presence card has nothing to draw: the tile
 * Discord itself shows is the application's own icon, and the hash for
 * that lives behind /applications/{id}/rpc.
 *
 * That endpoint is public but sends no Access-Control-Allow-Origin, so a
 * browser cannot read it. This is the hop that can. The image it points
 * at needs no proxying — an <img> is not subject to CORS — so only the
 * hash crosses this boundary, never the file.
 *
 * Deployed with --no-verify-jwt: it takes a public snowflake, returns
 * public metadata, and holds no key of its own.
 */

const BUILD = 'v1'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

/* A day at the edge and a week stale-while-revalidate. An app's icon
   changes about never, and this should not cost an upstream call per
   page view. */
const CACHE = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'

const json = (body: unknown, status = 200, cache = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      ...(cache ? { 'Cache-Control': CACHE } : {}),
    },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

  const id = new URL(req.url).searchParams.get('id') ?? ''
  /* Snowflakes only. Anything else is not a lookup, it is someone using
     this as a general-purpose proxy. */
  if (!/^\d{17,20}$/.test(id)) return json({ error: 'bad id' }, 400)

  const r = await fetch(`https://discord.com/api/v10/applications/${id}/rpc`, {
    headers: { 'User-Agent': 'mizu-portfolio/1.0 (+presence card)' },
  })

  if (!r.ok) {
    console.warn('app-icon', BUILD, id, r.status)
    /* Cached as well: an id with no application behind it will still have
       none in an hour, and retrying it on every poll helps nobody. */
    return json({ id, icon: null }, 200, true)
  }

  const app = await r.json().catch(() => null)
  const icon = typeof app?.icon === 'string' ? app.icon : null

  return json(
    {
      id,
      name: typeof app?.name === 'string' ? app.name : null,
      icon,
      url: icon ? `https://cdn.discordapp.com/app-icons/${id}/${icon}.png?size=256` : null,
    },
    200,
    true
  )
})
