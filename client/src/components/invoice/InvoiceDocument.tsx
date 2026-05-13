import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoiceViewModel } from "../../utils/invoiceViewModel";

try {
  Font.register({
    family: "NotoSans",
    fonts: [
      {
        src: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
        fontWeight: "normal",
      },
      {
        src: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf",
        fontWeight: "bold",
      },
    ],
  });
} catch {
  // Font may already be registered (hot reload)
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    color: "#1e293b",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  brand: { fontSize: 14, fontWeight: "bold" },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "right" },
  metaBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
    marginBottom: 12,
    alignSelf: "flex-end",
    width: 180,
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  companyBlock: { marginBottom: 12, lineHeight: 1.4 },
  sectionLabel: { fontSize: 8, color: "#64748b", marginBottom: 2 },
  clientRow: { marginBottom: 4 },
  clientLink: { color: "#2563eb", textDecoration: "underline" },
  table: { marginTop: 12 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  colNo: { width: "12%" },
  colDesc: { width: "43%" },
  colQty: { width: "10%", textAlign: "center" },
  colUnit: { width: "17%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  note: { marginTop: 12, fontSize: 8 },
  totals: { marginTop: 16, alignSelf: "flex-end", width: 200 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalBox: {
    backgroundColor: "#e2e8f0",
    padding: 6,
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerBrand: {
    marginTop: 28,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 10,
  },
});

function money(n: number) {
  return `${n.toLocaleString("mn-MN")}`;
}

export function InvoiceDocument({ data }: { data: InvoiceViewModel }) {
  const { company } = data;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>Infitech</Text>
            <Text>{company.name}</Text>
          </View>
          <Text style={styles.title}>НЭХЭМЖЛЭХ</Text>
        </View>

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text>Огноо:</Text>
            <Text>{data.issuedDateLabel}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text>Дугаар:</Text>
            <Text>{data.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.companyBlock}>
          <Text>{company.address}</Text>
          <Text>Утас: {company.phone}</Text>
          <Text>Данс: {company.bank}</Text>
        </View>

        <Text style={styles.sectionLabel}>Хаана</Text>
        <Text style={styles.clientRow}>{data.clientName}</Text>
        <Text style={styles.sectionLabel}>Байгууллага</Text>
        <Text style={[styles.clientRow, styles.clientLink]}>{data.clientName}</Text>
        <Text style={styles.sectionLabel}>Регистр</Text>
        <Text style={styles.clientRow}>{data.clientReg}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>№</Text>
            <Text style={styles.colDesc}>Тайлбар</Text>
            <Text style={styles.colQty}>Тоо</Text>
            <Text style={styles.colUnit}>Нэгж үнэ</Text>
            <Text style={styles.colTotal}>Нийт үнэ</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colNo}>{data.invoiceNumber}</Text>
            <Text style={styles.colDesc}>{data.description}</Text>
            <Text style={styles.colQty}>{String(data.quantity)}</Text>
            <Text style={styles.colUnit}>{money(data.unitPrice)}</Text>
            <Text style={styles.colTotal}>{money(data.total)}</Text>
          </View>
        </View>

        <Text style={styles.note}>{data.paymentNote}</Text>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Нийт:</Text>
            <Text>{money(data.total)}</Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={{ fontWeight: "bold" }}>Нийт үнэ:</Text>
            <Text style={{ fontWeight: "bold" }}>{money(data.total)}</Text>
          </View>
        </View>

        <Text style={styles.footerBrand}>[{company.name}]</Text>
      </Page>
    </Document>
  );
}
