const getScope = (value: string) => {
  switch (value.toUpperCase()) {
    case 'DEFINE':
      return null
    case 'FIELD':
      return 'name'
    case 'ON':
      return null
    case 'TABLE':
      return 'table'
    case 'TYPE':
      return 'fieldType'
    case 'VALUE':
      return 'value'
    case 'DEFAULT':
      return 'defaultValue'
    case 'ASSERT':
      return 'assert'
    case 'INSIDE':
      return 'inside'
    default:
      return undefined
  }
}

export const tokenize = (query: string) => {
  const clean = query.trim().replace(/;$/, '')
  const wordArray = clean.split(' ')

  const result: Record<string, string> = {
    name: '',
    table: '',
  }

  let scope: string
  wordArray.forEach((word) => {
    const c = getScope(word)
    if (c) {
      scope = c
      return
    }
    if (c === null) {
      return
    }
    result[scope] = ((result[scope] || '') + ' ' + word).trim()
  })

  return result as {
    name: string
    table: string
    fieldType?: string
    assert?: string
    inside?: string
    value?: string
    defaultValue?: string
  }
}
