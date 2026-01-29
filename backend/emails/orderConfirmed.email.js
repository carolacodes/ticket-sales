export function orderConfirmedEmail({ eventTitle, orderId, buyerUsername, tickets }) {
    const items = tickets
        .map((t) => `<li><b>${t.code}</b> — ${t.ticketTypeName}</li>`)
        .join("");

    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.4">
        <h2>Compra confirmada ✅</h2>
        <p>Hola ${buyerUsername || ""}, tu compra fue confirmada.</p>
        <p><b>Evento:</b> ${eventTitle}</p>
        <p><b>Orden:</b> ${orderId}</p>
        <h3>Tickets</h3>
        <ul>${items}</ul>
        <p>Guardá este email para el ingreso.</p>
    </div>`;
}
