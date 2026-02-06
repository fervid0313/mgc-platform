// Avatar generator for diverse default profile pictures
// Uses username to generate consistent, unique avatars

const avatarStyles = [
  // Geometric patterns
  'geometric-1',
  'geometric-2', 
  'geometric-3',
  'geometric-4',
  'geometric-5',
  // Abstract patterns
  'abstract-1',
  'abstract-2',
  'abstract-3',
  'abstract-4',
  'abstract-5',
  // Gradient patterns
  'gradient-1',
  'gradient-2',
  'gradient-3',
  'gradient-4',
  'gradient-5',
  // Nature patterns
  'nature-1',
  'nature-2',
  'nature-3',
  'nature-4',
  'nature-5',
]

const colorPalettes = [
  // Warm colors
  ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  ['#FD79A8', '#FDCB6E', '#6C5CE7', '#A29BFE', '#74B9FF'],
  ['#FF7675', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E'],
  ['#E17055', '#00B894', '#00CEC9', '#0984E3', '#6C5CE7'],
  ['#FAB1A0', '#FF7675', '#FD79A8', '#E17055', '#FDCB6E'],
  // Cool colors
  ['#00B894', '#00CEC9', '#0984E3', '#6C5CE7', '#A29BFE'],
  ['#74B9FF', '#A29BFE', '#6C5CE7', '#0984E3', '#00CEC9'],
  ['#81ECEC', '#74B9FF', '#A29BFE', '#6C5CE7', '#00B894'],
  ['#55EFC4', '#81ECEC', '#74B9FF', '#A29BFE', '#00B894'],
  ['#00CEC9', '#0984E3', '#6C5CE7', '#A29BFE', '#74B9FF'],
  // Neutral colors
  ['#636E72', '#B2BEC3', '#DFE6E9', '#74B9FF', '#A29BFE'],
  ['#2D3436', '#636E72', '#B2BEC3', '#DFE6E9', '#74B9FF'],
  ['#636E72', '#B2BEC3', '#DFE6E9', '#00B894', '#00CEC9'],
  ['#2D3436', '#636E72', '#B2BEC3', '#00B894', '#00CEC9'],
  ['#636E72', '#74B9FF', '#A29BFE', '#6C5CE7', '#0984E3'],
]

export function generateAvatarUrl(username: string, size: number = 100): string {
  // Generate consistent hash from username
  let hash = 0
  if (!username || typeof username !== 'string') {
    username = 'user'
  }
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Use hash to select style and palette
  const styleIndex = Math.abs(hash) % avatarStyles.length
  const paletteIndex = Math.abs(hash >> 8) % colorPalettes.length
  
  const style = avatarStyles[styleIndex]
  const palette = colorPalettes[paletteIndex]
  
  // Create a data URL for a simple SVG avatar
  const colors = palette.join(',')
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${palette[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${palette[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad${Math.abs(hash)})" />
      <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="${palette[2]}" opacity="0.8" />
      <circle cx="${size/3}" cy="${size/3}" r="${size/8}" fill="${palette[3]}" opacity="0.6" />
      <circle cx="${2*size/3}" cy="${2*size/3}" r="${size/6}" fill="${palette[4]}" opacity="0.7" />
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export function getAvatarUrl(username: string, customAvatar?: string, size: number = 100): string {
  // If custom avatar is provided, use it
  if (customAvatar && customAvatar.trim() !== '') {
    // Check if base64 image is valid
    if (customAvatar.startsWith('data:image/')) {
      return customAvatar
    }
    
    // If it's a regular URL, use it as-is
    return customAvatar
  }
  
  // Otherwise generate a default avatar based on username
  return generateAvatarUrl(username || 'user', size)
}

export function optimizeBase64Avatar(base64String: string, maxSizeKB: number = 50): string {
  // This is a placeholder for base64 optimization
  // In a real implementation, you would:
  // 1. Parse the base64 to get the image
  // 2. Compress/resize the image
  // 3. Convert back to base64
  
  // For now, just return the original if it's under the limit
  if (base64String.length <= maxSizeKB * 1024) {
    return base64String
  }
  
  // If too large, return a fallback avatar
  console.log("[AVATAR] Base64 image too large, using fallback")
  return generateAvatarUrl('user', 100)
}
