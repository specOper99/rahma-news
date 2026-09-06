type Dict = Record<string, unknown>;

function isDict(v: unknown): v is Dict {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function deepMergeMessages(base: Dict, overlay: Dict): Dict {
  const out: Dict = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (isDict(value) && isDict(out[key])) {
      out[key] = deepMergeMessages(out[key] as Dict, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}
