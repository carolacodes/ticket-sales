import jsPDF from "jspdf";
import QRCode from "qrcode";

function formatDate(iso) {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value, currency = "ARS") {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })} ${currency}`;
}

function addFooter(doc, pageNumber) {
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Ticketify · Purchase receipt · Page ${pageNumber}`, 20, 285);
}

function addHeader(doc) {
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("TICKETIFY", 20, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Purchase Receipt", 160, 18);
}

function addSectionTitle(doc, title, y) {
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, y);

  doc.setDrawColor(230, 230, 230);
  doc.line(20, y + 4, 190, y + 4);

  return y + 12;
}

function addInfoRow(doc, label, value, x, y) {
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text(label, x, y);

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");

  const safeValue = value || "—";
  const lines = doc.splitTextToSize(String(safeValue), 70);
  doc.text(lines, x, y + 6);

  return y + 14 + (lines.length - 1) * 5;
}

async function ticketQrDataUrl(ticket, order) {
  const payload = {
    ticketId: ticket._id,
    code: ticket.code,
    orderId: order._id,
    status: ticket.status,
  };

  return QRCode.toDataURL(JSON.stringify(payload), {
    width: 180,
    margin: 1,
  });
}

export async function generatePurchasePdf(order) {
  const doc = new jsPDF("p", "mm", "a4");

  const event = order.event;
  const tickets = order.tickets ?? [];
  const items = order.items ?? [];
  const currency = order.currency || "ARS";

  let page = 1;
  let y = 42;

  addHeader(doc);
  addFooter(doc, page);

  // Status pill
  doc.setFillColor(order.status === "PAID" ? 16 : 180, order.status === "PAID" ? 185 : 90, order.status === "PAID" ? 129 : 90);
  doc.roundedRect(20, y - 6, 34, 9, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(order.status || "—", 25, y);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(event?.title || "Event purchase", 20, y + 14);

  y += 28;

  y = addSectionTitle(doc, "Order summary", y);

  const col1 = 20;
  const col2 = 110;

  const yStart = y;

  addInfoRow(doc, "Order ID", order._id, col1, y);
  addInfoRow(doc, "Payment provider", order.paymentProvider || "—", col2, y);

  y += 24;

  addInfoRow(doc, "Payment ref", order.paymentRef || "—", col1, y);
  addInfoRow(doc, "Created at", formatDate(order.createdAt), col2, y);

  y += 24;

  addInfoRow(doc, "Paid at", formatDate(order.paidAt), col1, y);
  addInfoRow(doc, "Total", money(order.total, currency), col2, y);

  y += 26;

  y = addSectionTitle(doc, "Event information", y);

  addInfoRow(doc, "Date", formatDate(event?.startAt), col1, y);
  addInfoRow(doc, "Venue", event?.venue || "—", col2, y);

  y += 24;

  addInfoRow(doc, "City", event?.city || "—", col1, y);

  y += 24;

  y = addSectionTitle(doc, "Purchased items", y);

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(20, y - 6, 170, 10, "F");

  doc.setTextColor(90, 90, 90);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Item", 24, y);
  doc.text("Qty", 105, y);
  doc.text("Unit", 125, y);
  doc.text("Total", 160, y);

  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);

  items.forEach((item) => {
    if (y > 260) {
      doc.addPage();
      page += 1;
      addHeader(doc);
      addFooter(doc, page);
      y = 42;
    }

    const itemName = doc.splitTextToSize(item.name || "Ticket", 70);

    doc.setFontSize(10);
    doc.text(itemName, 24, y);
    doc.text(String(item.qty || 0), 106, y);
    doc.text(money(item.unitPrice, item.currency || currency), 125, y);
    doc.text(money(item.lineTotal, item.currency || currency), 160, y);

    y += Math.max(12, itemName.length * 5 + 4);

    doc.setDrawColor(235, 235, 235);
    doc.line(20, y - 4, 190, y - 4);
  });

  y += 8;

  if (tickets.length) {
    doc.addPage();
    page += 1;
    addHeader(doc);
    addFooter(doc, page);
    y = 42;

    y = addSectionTitle(doc, "Tickets", y);

    for (const ticket of tickets) {
      if (y > 230) {
        doc.addPage();
        page += 1;
        addHeader(doc);
        addFooter(doc, page);
        y = 42;
        y = addSectionTitle(doc, "Tickets", y);
      }

      const qr = await ticketQrDataUrl(ticket, order);

      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(20, y - 4, 170, 42, 3, 3);

      doc.addImage(qr, "PNG", 24, y, 30, 30);

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Ticket code: ${ticket.code}`, 62, y + 8);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90, 90, 90);
      doc.text(`Status: ${ticket.status || "—"}`, 62, y + 16);
      doc.text(`Ticket ID: ${ticket._id}`, 62, y + 24);
      doc.text(`Order ID: ${order._id}`, 62, y + 32);

      y += 50;
    }
  }

  doc.save(`ticketify-purchase-${order._id}.pdf`);
}