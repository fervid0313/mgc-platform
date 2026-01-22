// Global String.prototype safety wrapper
// Temporarily disabled for build troubleshooting

/*
const originalCharAt = String.prototype.charAt
String.prototype.charAt = function(pos) {
  // More comprehensive null/undefined checks
  if (this == null || this === undefined || this === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.charAt called on null/undefined/empty, returning empty string')
    }
    return ''
  }
  
  // Also check if this is actually a string
  if (typeof this !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.charAt called on non-string type, converting to string first')
    }
    try {
      return String(this).charAt(pos)
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔧 String.charAt conversion failed, returning empty string')
      }
      return ''
    }
  }
  
  return originalCharAt.call(this, pos)
}

const originalToUpperCase = String.prototype.toUpperCase
String.prototype.toUpperCase = function() {
  if (this == null || this === undefined || this === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.toUpperCase called on null/undefined/empty, returning empty string')
    }
    return ''
  }
  
  if (typeof this !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.toUpperCase called on non-string type, converting to string first')
    }
    try {
      return String(this).toUpperCase()
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔧 String.toUpperCase conversion failed, returning empty string')
      }
      return ''
    }
  }
  
  return originalToUpperCase.call(this)
}

const originalSlice = String.prototype.slice
String.prototype.slice = function(...args: any[]) {
  if (this == null || this === undefined || this === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.slice called on null/undefined/empty, returning empty string')
    }
    return ''
  }
  
  if (typeof this !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.slice called on non-string type, converting to string first')
    }
    try {
      return String(this).slice(args[0], args[1])
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔧 String.slice conversion failed, returning empty string')
      }
      return ''
    }
  }
  
  return originalSlice.call(this, args as any)
}

const originalSubstring = String.prototype.substring
String.prototype.substring = function(...args: any[]) {
  if (this == null || this === undefined || this === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.substring called on null/undefined/empty, returning empty string')
    }
    return ''
  }
  
  if (typeof this !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.substring called on non-string type, converting to string first')
    }
    try {
      return String(this).substring(args[0], args[1])
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔧 String.substring conversion failed, returning empty string')
      }
      return ''
    }
  }
  
  return originalSubstring.call(this, args as any)
}

const originalReplace = String.prototype.replace
String.prototype.replace = function(...args: any[]) {
  if (this == null || this === undefined || this === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.replace called on null/undefined/empty, returning empty string')
    }
    return ''
  }
  
  if (typeof this !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.replace called on non-string type, converting to string first')
    }
    try {
      return String(this).replace(args[0], args[1])
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔧 String.replace conversion failed, returning empty string')
      }
      return ''
    }
  }
  
  return originalReplace.apply(this, args as any)
}

const originalIncludes = String.prototype.includes
String.prototype.includes = function(...args: any[]) {
  if (this == null || this === undefined || this === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.includes called on null/undefined/empty, returning false')
    }
    return false
  }
  
  if (typeof this !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔧 String.includes called on non-string type, converting to string first')
    }
    try {
      return String(this).includes(args[0], args[1])
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔧 String.includes conversion failed, returning false')
      }
      return false
    }
  }
  
  return originalIncludes.call(this, args as any)
}

if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Enhanced Global String safety wrappers initialized')
}
*/
