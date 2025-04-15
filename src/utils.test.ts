import { describe, it, expect } from 'vitest'
import { JSONStringify, type RenameMap } from './utils'

describe('JSONStringify', () => {
  const baseObject = {
    a: 1,
    b: 2,
    c: { a: 11, b: 22, d: { a: 111 } },
    d: [
      { a: 50, x: 100 },
      { b: 60, a: 70 },
    ],
    e: null,
    f: [1, 2, 3],
    g: { a: 'keep_g' },
  }

  it('should return JSON string of object without changes when renameKeys is empty', () => {
    const result = JSONStringify(baseObject, {})
    expect(JSON.parse(result)).toEqual(baseObject)
  })

  it('should handle the first example: {a:z}', () => {
    const o = { a: 1, b: 2, c: { a: 11, b: 22 } }
    const renameMap: RenameMap = { a: 'z' }
    const expected = { z: 1, b: 2, c: { a: 11, b: 22 } }
    const result = JSONStringify(o, renameMap)
    expect(JSON.parse(result)).toEqual(expected)
  })

  it('should handle the second example: {c:{a:z}}', () => {
    const o = { a: 1, b: 2, c: { a: 11, b: 22 } }
    const renameMap: RenameMap = { c: { a: 'z' } }
    const expected = { a: 1, b: 2, c: { z: 11, b: 22 } }
    const result = JSONStringify(o, renameMap)
    expect(JSON.parse(result)).toEqual(expected)
  })

  it('should rename only specified top-level keys when using string values', () => {
    const renameMap: RenameMap = { a: 'z', b: 'y' }
    const expected = {
      z: 1, // renamed
      y: 2, // renamed
      c: { a: 11, b: 22, d: { a: 111 } }, // nested a/b untouched
      d: [
        { a: 50, x: 100 },
        { b: 60, a: 70 },
      ], // nested a/b untouched
      e: null,
      f: [1, 2, 3],
      g: { a: 'keep_g' }, // nested a untouched
    }
    const result = JSONStringify(baseObject, renameMap)
    expect(JSON.parse(result)).toEqual(expected)
  })

  it('should rename nested keys using nested rename map objects', () => {
    const renameMap: RenameMap = {
      c: { a: 'z', d: { a: 'k' } },
      g: { a: 'g_new' },
    }
    const expected = {
      a: 1,
      b: 2,
      c: { z: 11, b: 22, d: { k: 111 } }, // c.a renamed to z, c.d.a renamed to k
      d: [
        { a: 50, x: 100 },
        { b: 60, a: 70 },
      ], // d array untouched
      e: null,
      f: [1, 2, 3],
      g: { g_new: 'keep_g' }, // g.a renamed
    }
    const result = JSONStringify(baseObject, renameMap)
    expect(JSON.parse(result)).toEqual(expected)
  })

  it('should rename keys deeply within arrays if a matching nested rule exists', () => {
    // To rename 'a' inside the objects within the array 'd',
    // the rename map needs to target 'a' at the level where it occurs.
    const renameMap: RenameMap = { d: { a: 'z' } } // This applies universally
    const expected = {
      a: 1,
      b: 2,
      c: { a: 11, b: 22, d: { a: 111 } },
      d: [
        { z: 50, x: 100 },
        { b: 60, z: 70 },
      ],
      e: null,
      f: [1, 2, 3],
      g: { a: 'keep_g' },
    }
    const result = JSONStringify(baseObject, renameMap)
    expect(JSON.parse(result)).toEqual(expected)
  })

  it('should handle mixed simple and nested renaming rules', () => {
    const renameMap: RenameMap = { a: 'z', c: { b: 'y' } }
    const expected = {
      z: 1, // Renamed by top-level rule {a: 'z'}
      b: 2,
      c: { a: 11, y: 22, d: { a: 111 } }, // c.b renamed to y by nested rule, c.a and c.d.a untouched by *this* rule
      d: [
        { a: 50, x: 100 },
        { b: 60, a: 70 },
      ],
      e: null,
      f: [1, 2, 3],
      g: { a: 'keep_g' },
    }
    const result = JSONStringify(baseObject, renameMap)
    expect(JSON.parse(result)).toEqual(expected)
  })

  it('should handle empty objects', () => {
    const renameMap: RenameMap = { a: 'z' }
    expect(JSON.parse(JSONStringify({}, renameMap))).toEqual({})
  })

  it('should handle objects with null values', () => {
    const obj = { a: 1, b: null }
    const renameMap: RenameMap = { a: 'z' }
    const expected = { z: 1, b: null }
    expect(JSON.parse(JSONStringify(obj, renameMap))).toEqual(expected)
  })

  it('should handle arrays directly if passed', () => {
    const arr = [{ a: 1 }, { a: 2 }]
    const renameMap: RenameMap = { a: 'z' }
    const expected = [{ z: 1 }, { z: 2 }]
    expect(JSON.parse(JSONStringify(arr, renameMap))).toEqual(expected)
  })

  it('should handle non-string/object values in renameKeys gracefully (treat as no-op for that key)', () => {
    // The type system prevents this, but testing javascript flexibility
    const renameMap: any = { a: true, b: 'y' }
    const obj = { a: 1, b: 2, c: 3 }
    const expected = { a: 1, y: 2, c: 3 } // 'a' is not renamed (invalid rule type), 'b' is
    const result = JSONStringify(obj, renameMap)
    expect(JSON.parse(result)).toEqual(expected)
  })
})
