/**
 * Field mapping utilities for backend column key prefixes.
 * The backend returns data keys like `tbl3302_student_name` while field
 * metadata uses `student_name`.
 */

export function stripTablePrefix(dataKey: string): string {
  const match = /^tbl\d+_(.+)$/.exec(dataKey);
  return match ? match[1] : dataKey;
}

export function buildFieldKeyMap(
  sampleRow: Record<string, unknown>,
  fieldNames: string[],
): Map<string, string> {
  const map = new Map<string, string>();
  const dataKeys = Object.keys(sampleRow);

  for (const fieldName of fieldNames) {
    if (dataKeys.includes(fieldName)) {
      map.set(fieldName, fieldName);
      continue;
    }
    const prefixed = dataKeys.find((dk) => stripTablePrefix(dk) === fieldName);
    if (prefixed) {
      map.set(fieldName, prefixed);
    }
  }
  return map;
}

export function resolveDataKey(
  fieldName: string,
  fieldKeyMap: Map<string, string>,
): string {
  return fieldKeyMap.get(fieldName) ?? fieldName;
}

export function getCellValue(
  row: Record<string, unknown>,
  fieldName: string,
  fieldKeyMap?: Map<string, string>,
): unknown {
  if (fieldKeyMap) {
    const dataKey = resolveDataKey(fieldName, fieldKeyMap);
    return row[dataKey];
  }
  if (fieldName in row) return row[fieldName];
  const keys = Object.keys(row);
  const prefixed = keys.find((k) => stripTablePrefix(k) === fieldName);
  return prefixed ? row[prefixed] : undefined;
}
