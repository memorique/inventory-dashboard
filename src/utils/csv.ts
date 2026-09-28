export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  let i = 0;
  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += char;
        i += 1;
      }
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
      i += 1;
    } else if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
    } else if (char === "\r" || char === "\n") {
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
      i += char === "\r" && text[i + 1] === "\n" ? 2 : 1;
    } else {
      field += char;
      i += 1;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export interface ColumnDef<Key extends string> {
  key: Key;
  label: string;
  match: string;
}

export function mapHeaders<Key extends string>(
  headerRow: string[],
  columnDefs: ColumnDef<Key>[]
): { indexByKey: Record<Key, number>; missingLabels: string[] } {
  const normalized = headerRow.map(normalizeHeader);
  const indexByKey = {} as Record<Key, number>;
  const missingLabels: string[] = [];

  for (const def of columnDefs) {
    const index = normalized.indexOf(def.match);
    if (index === -1) {
      missingLabels.push(def.label);
    } else {
      indexByKey[def.key] = index;
    }
  }

  return { indexByKey, missingLabels };
}

export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}
