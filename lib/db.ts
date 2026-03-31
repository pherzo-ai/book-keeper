type SqlValue = string | number | null;
export type Row = Record<string, SqlValue>;

function tursoUrl() {
  return process.env.TURSO_DATABASE_URL!.replace(/^libsql:\/\//, "https://");
}

function encode(v: SqlValue) {
  if (v === null) return { type: "null" };
  if (typeof v === "number")
    return Number.isInteger(v)
      ? { type: "integer", value: String(v) }
      : { type: "float", value: String(v) };
  return { type: "text", value: String(v) };
}

function decodeRow(
  cols: { name: string }[],
  row: { type: string; value: string | null }[]
): Row {
  const obj: Row = {};
  cols.forEach((col, i) => {
    const v = row[i];
    obj[col.name] =
      v.type === "null"
        ? null
        : v.type === "integer"
        ? Number(v.value)
        : (v.value as string);
  });
  return obj;
}

export async function query(
  sql: string,
  args: SqlValue[] = []
): Promise<{ rows: Row[] }> {
  const res = await fetch(`${tursoUrl()}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TURSO_AUTH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql, args: args.map(encode) } },
        { type: "close" },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Turso ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const result = data.results[0];
  if (result.type === "error") throw new Error(result.error.message);

  const { cols, rows } = result.response.result;
  return { rows: rows.map((r: { type: string; value: string | null }[]) => decodeRow(cols, r)) };
}

export async function execute(sql: string, args: SqlValue[] = []) {
  await query(sql, args);
}
