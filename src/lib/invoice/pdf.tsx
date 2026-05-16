import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Svg,
  Rect,
} from "@react-pdf/renderer";
import type { Invoice, InvoiceLine } from "@prisma/client";

type InvoiceForPdf = Invoice & { lines: InvoiceLine[] };

const COLORS = {
  bg: "#FFFFFF",
  fg: "#0A0A0A",
  muted: "#52525B",
  border: "#E4E4E7",
  accent: "#65A30D",
  light: "#F4F4F5",
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    color: COLORS.fg,
    backgroundColor: COLORS.bg,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.accent,
  },
  brandName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.fg,
  },
  brandDot: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.accent,
  },
  meta: {
    alignItems: "flex-end",
  },
  invoiceLabel: {
    fontSize: 9,
    color: COLORS.muted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.fg,
  },
  invoiceDates: {
    marginTop: 8,
    fontSize: 9,
    color: COLORS.muted,
    textAlign: "right",
  },
  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  partyBlock: {
    width: "48%",
  },
  partyLabel: {
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.fg,
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 1,
  },
  linesHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.fg,
    marginBottom: 4,
  },
  linesRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  colDesc: { width: "55%", paddingRight: 8 },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "17.5%", textAlign: "right" },
  colTotal: { width: "17.5%", textAlign: "right" },
  headerCell: {
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cell: {
    fontSize: 10,
    color: COLORS.fg,
  },
  cellNumeric: {
    fontSize: 10,
    color: COLORS.fg,
    fontFamily: "Courier",
  },
  totals: {
    marginTop: 20,
    alignSelf: "flex-end",
    width: "45%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },
  totalValue: {
    fontSize: 10,
    color: COLORS.fg,
    fontFamily: "Courier",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.fg,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.fg,
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.fg,
  },
  notesBlock: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  notesLabel: {
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  notesBody: {
    fontSize: 9,
    color: COLORS.fg,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 32,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.muted,
  },
});

function fmtMoney(cents: number, currency: string) {
  const amount = (cents / 100).toFixed(2);
  if (currency === "EUR") return `${amount} €`;
  if (currency === "USD") return `$${amount}`;
  return `${amount} ${currency}`;
}

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export type IssuerInfo = {
  name: string;
  addressLines: string[]; // free form, line per array entry
  email?: string;
  vat?: string;
  siret?: string;
};

const DEFAULT_ISSUER: IssuerInfo = {
  name: "Hulabe",
  addressLines: ["support@hulabe.com", "https://www.hulabe.com"],
  email: "support@hulabe.com",
};

export function InvoiceDocument({
  invoice,
  issuer = DEFAULT_ISSUER,
  labels,
}: {
  invoice: InvoiceForPdf;
  issuer?: IssuerInfo;
  labels?: Partial<typeof DEFAULT_LABELS>;
}) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const taxPct = (invoice.taxRate / 100).toFixed(2);

  return (
    <Document
      title={`Invoice ${invoice.number}`}
      author={issuer.name}
      subject={`Invoice ${invoice.number}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Svg
              width={32}
              height={32}
              viewBox="0 0 32 32"
              style={styles.brandMark}
            >
              <Rect width={32} height={32} fill={COLORS.accent} rx={6} />
            </Svg>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.brandName}>{issuer.name.toLowerCase()}</Text>
              <Text style={styles.brandDot}>.</Text>
            </View>
          </View>
          <View style={styles.meta}>
            <Text style={styles.invoiceLabel}>{L.invoice}</Text>
            <Text style={styles.invoiceNumber}>#{invoice.number}</Text>
            <Text style={styles.invoiceDates}>
              {L.issued}: {fmtDate(invoice.issuedAt)}
            </Text>
            {invoice.dueAt && (
              <Text style={styles.invoiceDates}>
                {L.due}: {fmtDate(invoice.dueAt)}
              </Text>
            )}
            {invoice.paidAt && (
              <Text style={[styles.invoiceDates, { color: COLORS.accent }]}>
                {L.paid}: {fmtDate(invoice.paidAt)}
              </Text>
            )}
          </View>
        </View>

        {/* Parties */}
        <View style={styles.parties}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>{L.from}</Text>
            <Text style={styles.partyName}>{issuer.name}</Text>
            {issuer.addressLines.map((line, i) => (
              <Text key={i} style={styles.partyLine}>
                {line}
              </Text>
            ))}
            {issuer.vat && (
              <Text style={styles.partyLine}>VAT: {issuer.vat}</Text>
            )}
            {issuer.siret && (
              <Text style={styles.partyLine}>SIRET: {issuer.siret}</Text>
            )}
          </View>

          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>{L.to}</Text>
            <Text style={styles.partyName}>{invoice.clientName ?? "—"}</Text>
            {invoice.clientEmail && (
              <Text style={styles.partyLine}>{invoice.clientEmail}</Text>
            )}
            {invoice.clientAddress
              ?.split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <Text key={i} style={styles.partyLine}>
                  {line}
                </Text>
              ))}
            {invoice.clientVatNumber && (
              <Text style={styles.partyLine}>VAT: {invoice.clientVatNumber}</Text>
            )}
          </View>
        </View>

        {/* Lines */}
        <View style={styles.linesHeader}>
          <Text style={[styles.colDesc, styles.headerCell]}>
            {L.description}
          </Text>
          <Text style={[styles.colQty, styles.headerCell]}>{L.qty}</Text>
          <Text style={[styles.colUnit, styles.headerCell]}>{L.unitPrice}</Text>
          <Text style={[styles.colTotal, styles.headerCell]}>{L.total}</Text>
        </View>

        {invoice.lines.length === 0 ? (
          <View style={styles.linesRow}>
            <Text style={[styles.colDesc, styles.cell, { color: COLORS.muted }]}>
              {L.noLines}
            </Text>
          </View>
        ) : (
          invoice.lines
            .sort((a, b) => a.position - b.position)
            .map((line) => (
              <View key={line.id} style={styles.linesRow}>
                <Text style={[styles.colDesc, styles.cell]}>
                  {line.description}
                </Text>
                <Text style={[styles.colQty, styles.cellNumeric]}>
                  {line.quantity}
                </Text>
                <Text style={[styles.colUnit, styles.cellNumeric]}>
                  {fmtMoney(line.unitPriceCents, invoice.currency)}
                </Text>
                <Text style={[styles.colTotal, styles.cellNumeric]}>
                  {fmtMoney(line.totalCents, invoice.currency)}
                </Text>
              </View>
            ))
        )}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{L.subtotal}</Text>
            <Text style={styles.totalValue}>
              {fmtMoney(invoice.subtotalCents, invoice.currency)}
            </Text>
          </View>
          {invoice.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {L.tax} ({taxPct}%)
              </Text>
              <Text style={styles.totalValue}>
                {fmtMoney(invoice.taxCents, invoice.currency)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>{L.grandTotal}</Text>
            <Text style={styles.grandTotalValue}>
              {fmtMoney(invoice.amountCents, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>{L.notes}</Text>
            <Text style={styles.notesBody}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            {issuer.name} · {issuer.email ?? ""}
          </Text>
          <Text>
            {L.invoice} {invoice.number}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

const DEFAULT_LABELS = {
  invoice: "INVOICE",
  from: "FROM",
  to: "BILLED TO",
  issued: "Issued",
  due: "Due",
  paid: "Paid",
  description: "Description",
  qty: "Qty",
  unitPrice: "Unit",
  total: "Total",
  subtotal: "Subtotal",
  tax: "Tax",
  grandTotal: "Total Due",
  notes: "Notes",
  noLines: "No line items.",
};

/** Render the invoice document to a Buffer (server-side, in a Route Handler). */
export async function renderInvoicePdf(
  invoice: InvoiceForPdf,
  opts: { issuer?: IssuerInfo; labels?: Partial<typeof DEFAULT_LABELS> } = {},
): Promise<Buffer> {
  return renderToBuffer(
    InvoiceDocument({
      invoice,
      issuer: opts.issuer,
      labels: opts.labels,
    }),
  );
}
