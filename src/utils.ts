// Type definition for the renameKeys map
export type RenameMap = {
	[key: string]: string | RenameMap
}

// Helper function to recursively rename keys and process nested structures
const renameKeyInObject = (obj: any, renameKeys: RenameMap): any => {
	// Base case: return non-objects/arrays as is
	if (typeof obj !== 'object' || obj === null) {
		return obj
	}

	// Handle arrays: recursively process each element with the *original* full rename map
	if (Array.isArray(obj)) {
		// Important: Pass the original renameKeys map down, not a potentially nested part of it.
		return obj.map((item) => renameKeyInObject(item, renameKeys))
	}

	// Handle objects
	const newObj: Record<string, any> = {}
	for (const key in obj) {
		// Ensure it's an own property
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const currentValue = obj[key]
			const renameTarget = renameKeys[key]

			if (typeof renameTarget === 'string') {
				// Simple rename: Use the new key, recursively process the value with the *original* full rename map
				newObj[renameTarget] = currentValue
			} else if (
				typeof renameTarget === 'object' &&
				renameTarget !== null &&
				!Array.isArray(renameTarget)
			) {
				// Nested rename rule provided: Keep the original key, recursively process the value with the specific *nested* rules
				newObj[key] = renameKeyInObject(currentValue, renameTarget as RenameMap)
			} else {
				newObj[key] = currentValue
			}
		}
	}
	return newObj
}

/**
 * Creates a JSON string from an object after renaming keys according to a map.
 * Handles nested objects and arrays, applying rules deeply.
 *
 * @param obj The input object or array.
 * @param renameKeys A map defining key renames. String values rename the key directly.
 *                   Object values indicate nested rules for the value of that key.
 *                 Example: { oldKey: 'newKey', nestedKey: { oldInnerKey: 'newInnerKey' } }
 * @returns A JSON string representation of the transformed object.
 */
export function JSONStringify(obj: any, renameKeys: RenameMap = {}): string {
	const transformedObj = renameKeyInObject(obj, renameKeys)
	// Use JSON.stringify with indentation for better readability if needed
	// return JSON.stringify(transformedObj, null, 2);
	return JSON.stringify(transformedObj)
}
