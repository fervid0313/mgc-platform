// Global String.prototype safety wrapper
// This catches any remaining charAt operations that might cause errors

const originalCharAt = String.prototype.charAt
String.prototype.charAt = function(pos) {
  if (this == null || this === undefined) {
    console.warn('🔧 String.charAt called on null/undefined, returning empty string')
    return ''
  }
  return originalCharAt.call(this, pos)
}

const originalToUpperCase = String.prototype.toUpperCase
String.prototype.toUpperCase = function() {
  if (this == null || this === undefined) {
    console.warn('🔧 String.toUpperCase called on null/undefined, returning empty string')
    return ''
  }
  return originalToUpperCase.call(this)
}

const originalSlice = String.prototype.slice
String.prototype.slice = function(...args) {
  if (this == null || this === undefined) {
    console.warn('🔧 String.slice called on null/undefined, returning empty string')
    return ''
  }
  return originalSlice.call(this, ...args)
}

const originalSubstring = String.prototype.substring
String.prototype.substring = function(...args) {
  if (this == null || this === undefined) {
    console.warn('🔧 String.substring called on null/undefined, returning empty string')
    return ''
  }
  return originalSubstring.call(this, ...args)
}

const originalReplace = String.prototype.replace
String.prototype.replace = function(...args) {
  if (this == null || this === undefined) {
    console.warn('🔧 String.replace called on null/undefined, returning empty string')
    return ''
  }
  return originalReplace.apply(this, args as any)
}

const originalIncludes = String.prototype.includes
String.prototype.includes = function(...args) {
  if (this == null || this === undefined) {
    console.warn('🔧 String.includes called on null/undefined, returning false')
    return false
  }
  return originalIncludes.call(this, ...args)
}

console.log('🔧 Global String safety wrappers initialized')
