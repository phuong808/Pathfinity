/**
 * Lightcast API Client
 * 
 * Provides access to Lightcast's Titles taxonomy via OAuth2 authentication.
 * Docs: https://docs.lightcast.dev/apis/titles
 * 
 * Environment variables required:
 *   - LIGHTCAST_CLIENT: OAuth client ID
 *   - LIGHTCAST_SECRET: OAuth client secret
 *   - LIGHTCAST_TITLES: API base URL (optional, defaults to https://emsiservices.com/titles)
 */

// Token cache to avoid repeated auth calls
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get an OAuth2 access token for Lightcast API
 * Tokens are cached and automatically refreshed when expired
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now()
  
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
    return cachedToken.token
  }

  const clientId = process.env.LIGHTCAST_CLIENT
  const clientSecret = process.env.LIGHTCAST_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('LIGHTCAST_CLIENT and LIGHTCAST_SECRET must be set in environment')
  }

  // OAuth2 client credentials flow
  const authUrl = 'https://auth.emsicloud.com/connect/token'
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: 'emsi_open',
  })

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Lightcast auth failed: ${response.status} ${text}`)
  }

  const data = await response.json()
  
  // Cache token (expires_in is in seconds)
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }

  return cachedToken.token
}

export interface LightcastTitle {
  id: string
  name: string
  pluralName?: string
}

/**
 * Search for job titles in Lightcast taxonomy
 * 
 * @param query - Search query string (min 2 characters)
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of matching titles with id, name, and pluralName
 */
export async function searchTitles(query: string, limit = 10): Promise<LightcastTitle[]> {
  if (!query || query.length < 2) {
    return []
  }

  const token = await getAccessToken()
  const baseUrl = process.env.LIGHTCAST_TITLES || 'https://emsiservices.com/titles'
  
  // Use GET /versions/latest/titles with q parameter for title search
  const url = `${baseUrl}/versions/latest/titles?q=${encodeURIComponent(query)}&limit=${limit}&fields=id,name,pluralName`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Lightcast titles API error: ${response.status} ${text}`)
  }

  const data = await response.json()
  
  // Response format: { data: [{ id, name, pluralName }] }
  return data.data || []
}