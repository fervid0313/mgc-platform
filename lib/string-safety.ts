// String safety utility functions
// Use these instead of direct string operations to prevent charAt errors

export function safeCharAt(str: string | null | undefined, pos: number): string {
  if (str == null || str === undefined || str === '') {
    return ''
  }
  
  if (typeof str !== 'string') {
    try {
      return String(str).charAt(pos)
    } catch (e) {
      return ''
    }
  }
  
  return str.charAt(pos)
}

export function safeToUpperCase(str: string | null | undefined): string {
  if (str == null || str === undefined || str === '') {
    return ''
  }
  
  if (typeof str !== 'string') {
    try {
      return String(str).toUpperCase()
    } catch (e) {
      return ''
    }
  }
  
  return str.toUpperCase()
}

export function safeSlice(str: string | null | undefined, start?: number, end?: number): string {
  if (str == null || str === undefined || str === '') {
    return ''
  }
  
  if (typeof str !== 'string') {
    try {
      return String(str).slice(start || 0, end)
    } catch (e) {
      return ''
    }
  }
  
  return str.slice(start || 0, end)
}

export function safeSubstring(str: string | null | undefined, start?: number, end?: number): string {
  if (str == null || str === undefined || str === '') {
    return ''
  }
  
  if (typeof str !== 'string') {
    try {
      return String(str).substring(start || 0, end)
    } catch (e) {
      return ''
    }
  }
  
  return str.substring(start || 0, end)
}

export function safeReplace(str: string | null | undefined, searchValue: string | RegExp, replaceValue: string): string {
  if (str == null || str === undefined || str === '') {
    return ''
  }
  
  if (typeof str !== 'string') {
    try {
      return String(str).replace(searchValue, replaceValue)
    } catch (e) {
      return ''
    }
  }
  
  return str.replace(searchValue, replaceValue)
}

export function safeIncludes(str: string | null | undefined, searchValue: string | number, position?: number): boolean {
  if (str == null || str === undefined || str === '') {
    return false
  }
  
  if (typeof str !== 'string') {
    try {
      return String(str).includes(String(searchValue), position)
    } catch (e) {
      return false
    }
  }
  
  return str.includes(searchValue, position)
}

if (process.env.NODE_ENV === 'development') {
  console.log('🔧 String safety utility functions initialized')
}
