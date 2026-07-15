export type PriceAccessRow = {
  readonly id: string;
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  };
  readonly context: {
    readonly deviceType: string | null;
    readonly brand: string | null;
    readonly model: string | null;
    readonly symptomCode: string | null;
    readonly outcome: string;
    readonly matchedPartCount: number;
  };
  readonly hash: {
    readonly ipHashPrefix: string;
    readonly userAgent: string | null;
  };
  readonly createdAt: string;
};

export type PriceAccessPage = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly rows: readonly PriceAccessRow[];
};

export type PriceAccessCells = {
  readonly log: string;
  readonly user: string;
  readonly time: string;
  readonly device: string;
  readonly symptom: string;
  readonly outcome: string;
  readonly matched: string;
  readonly hash: string;
  readonly agent: string;
};

export function buildPriceAccessQuery(options: {
  readonly page: number;
  readonly pageSize: number;
}): string {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, options.page)));
  params.set("pageSize", String(Math.min(100, Math.max(1, options.pageSize))));
  return params.toString();
}

function display(value: string | null): string {
  return value && value.trim().length > 0 ? value : "-";
}

export function priceAccessCells(row: PriceAccessRow): PriceAccessCells {
  const device = [
    display(row.context.deviceType),
    display(row.context.brand),
    display(row.context.model),
  ]
    .filter((value) => value !== "-")
    .join(" ");

  return {
    log: row.id,
    user: `${row.user.name} <${row.user.email}>`,
    time: row.createdAt,
    device: device.length > 0 ? device : "-",
    symptom: display(row.context.symptomCode),
    outcome: row.context.outcome,
    matched: `${row.context.matchedPartCount} matched`,
    hash: row.hash.ipHashPrefix,
    agent: display(row.hash.userAgent),
  };
}

export function filterPriceAccessRows(
  rows: readonly PriceAccessRow[],
  filter: string
): readonly PriceAccessRow[] {
  const needle = filter.trim().toLowerCase();
  if (needle.length === 0) return rows;
  return rows.filter((row) => {
    const cells = priceAccessCells(row);
    return Object.values(cells).some((value) => value.toLowerCase().includes(needle));
  });
}

export function totalPages(page: PriceAccessPage): number {
  return Math.max(1, Math.ceil(page.total / page.pageSize));
}
