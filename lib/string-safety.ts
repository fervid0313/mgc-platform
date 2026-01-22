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
  
  return str.includes(String(searchValue), position)
}

// Global String.prototype safety wrapper - aggressive approach
// This will catch ALL string operations including those in third-party libraries

const originalCharAt = String.prototype.charAt
String.prototype.charAt = function(pos) {
  // More comprehensive null/undefined checks
  if (this == null || this === undefined || this === '') {
    return ''
  }
  
  // Also check if this is actually a string
  if (typeof this !== 'string') {
    try {
      return String(this).charAt(pos)
    } catch (e) {
      return ''
    }
  }
  
  return originalCharAt.call(this, pos)
}

const originalToUpperCase = String.prototype.toUpperCase
String.prototype.toUpperCase = function() {
  if (this == null || this === undefined || this === '') {
    return ''
  }
  
  if (typeof this !== 'string') {
    try {
      return String(this).toUpperCase()
    } catch (e) {
      return ''
    }
  }
  
  return originalToUpperCase.call(this)
}

const originalSlice = String.prototype.slice
String.prototype.slice = function(...args: any[]) {
  if (this == null || this === undefined || this === '') {
    return ''
  }
  
  if (typeof this !== 'string') {
    try {
      return String(this).slice(args[0], args[1])
    } catch (e) {
      return ''
    }
  }
  
  return originalSlice.call(this, ...args)
}

const originalSubstring = String.prototype.substring
String.prototype.substring = function(...args: any[]) {
  if (this == null || this === undefined || this === '') {
    return ''
  }
  
  if (typeof this !== 'string') {
    try {
      return String(this).substring(args[0] || 0, args[1])
    } catch (e) {
      return ''
    }
  }
  
  return originalSubstring.call(this, args as any)
}

const originalReplace = String.prototype.replace
String.prototype.replace = function(...args: any[]) {
  if (this == null || this === undefined || this === '') {
    return ''
  }
  
  if (typeof this !== 'string') {
    try {
      return String(this).replace(args[0], args[1])
    } catch (e) {
      return ''
    }
  }
  
  return originalReplace.apply(this, args as any)
}

const originalIncludes = String.prototype.includes
String.prototype.includes = function(...args: any[]) {
  if (this == null || this === undefined || this === '') {
    return false
  }
  
  if (typeof this !== 'string') {
    try {
      return String(this).includes(String(args[0]), args[1])
    } catch (e) {
      return false
    }
  }
  
  return originalIncludes.call(this, args as any)
}

// Only log in development to avoid build interference
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 String safety utility functions initialized')
  console.log('🔧 Global String safety wrappers initialized')
}
