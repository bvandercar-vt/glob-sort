import type { GlobOptionsWithoutFileTypes } from 'node:fs'
import { glob } from 'node:fs/promises'
import path from 'node:path'

const NUM_PREFIX = /^\d+/

export async function sortedGlob(
  pattern: string | readonly string[],
  {
    sortOrder = [],
    ...globOptions
  }: GlobOptionsWithoutFileTypes & {
    /**
     * Sort order. Comes after number prefix sorting. Can be string to include,
     * or regexp to match.
     *
     * If no match in sort order, secondary sorting is alhpabetical.
     *
     * e.g. ['New', 'Edit', /^Delete/i, ]
     */
    sortOrder?: readonly (RegExp | string)[]
  } = {}
): Promise<string[]> {
  const matches = await Array.fromAsync(glob(pattern, globOptions))

  // returns numeric prefix of the top-level folder for a given path, or null
  const getNumberPrefix = (filePath: string) => {
    const folderNumMatch = filePath.match(NUM_PREFIX)?.[0]
    return folderNumMatch ? Number.parseInt(folderNumMatch, 10) : null
  }

  // returns comparison value of prefix number (if present)
  const compareByNumberPrefix = (a: string, b: string): number => {
    const numA = getNumberPrefix(a)
    const numB = getNumberPrefix(b)
    if (numA === numB) {
      return 0
    }
    if (numA === null) {
      return 1
    }
    if (numB === null) {
      return -1
    }
    return numA - numB
  }

  // checks a match in the sortOrder array
  const checkMatch = (match: string | RegExp, str: string) =>
    match instanceof RegExp
      ? match.test(str)
      : str.toLowerCase().includes(match.toLowerCase())

  // returns comparison value sorted by passed sortOrder
  const compareBySortOrder = (a: string, b: string) => {
    for (const sortOrderMatcher of sortOrder) {
      const aMatch = checkMatch(sortOrderMatcher, a)
      const bMatch = checkMatch(sortOrderMatcher, b)
      if (aMatch !== bMatch) {
        return aMatch ? -1 : 1
      }
    }
    return 0
  }

  return matches
    .map((p) => path.normalize(p))
    .sort((aPath: string, bPath: string) => {
      const aParts = aPath.split(path.sep)
      const bParts = bPath.split(path.sep)

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i += 1) {
        const aPart = aParts[i] ?? ''
        const bPart = bParts[i] ?? ''

        if (aPart === bPart) {
          continue
        }

        const overallComparison =
          // 1) Numeric prefix priority
          compareByNumberPrefix(aPart, bPart) ||
          // 2) Custom sort order (regex/string)
          compareBySortOrder(aPart, bPart) ||
          // 3️) Lastly, just sort alphabetical
          aPart.localeCompare(bPart)

        if (overallComparison) {
          return overallComparison
        }
      }

      return 0
    })
}
