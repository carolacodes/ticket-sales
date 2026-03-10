export function orderConfirmedEmail({ eventTitle, orderId, buyerUsername, tickets }) {
  const safeName = buyerUsername?.trim() || "Hola";
  const ticketCount = tickets?.length || 0;

  const ticketCards = tickets
    .map(
      (t, index) => `
        <div style="border:1px solid #e5e7eb; border-radius:14px; padding:16px; margin-bottom:12px; background:#fafafa;">
          <div style="font-size:12px; color:#6b7280; margin-bottom:6px;">
            TICKET #${index + 1}
          </div>

          <div style="font-size:16px; font-weight:700; color:#111827; margin-bottom:6px;">
            ${t.ticketTypeName}
          </div>

          <div style="font-size:13px; color:#6b7280; margin-bottom:4px;">
            Código de acceso
          </div>

          <div style="font-size:15px; font-weight:700; color:#111827; word-break:break-word;">
            ${t.code}
          </div>
        </div>
      `
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Confirmación de compra</title>
    </head>
    <body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#111827;">
      <div style="width:100%; background:#f3f4f6; padding:32px 16px;">
        <div style="max-width:640px; margin:0 auto;">

          <!-- Brand -->
          <div style="text-align:center; margin-bottom:20px;">
            <div style="display:inline-block; background:#111827; color:#ffffff; padding:10px 16px; border-radius:12px; font-size:18px; font-weight:700;">
              Ticketify
            </div>
          </div>

          <!-- Main card -->
          <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
            
            <!-- Hero -->
            <div style="background:linear-gradient(135deg, #111827 0%, #1f2937 100%); padding:32px 24px; text-align:center;">
              <div style="font-size:42px; line-height:1; margin-bottom:12px;">🎟️</div>
              <h1 style="margin:0; font-size:28px; line-height:1.2; color:#ffffff;">
                Compra confirmada
              </h1>
              <p style="margin:10px 0 0; font-size:15px; color:#d1d5db;">
                Tus entradas fueron emitidas correctamente
              </p>
            </div>

            <!-- Content -->
            <div style="padding:28px 24px;">
              <p style="margin:0 0 16px; font-size:16px; color:#111827;">
                ${safeName}, tu compra fue confirmada con éxito. Guardá este email para el ingreso al evento.
              </p>

              <!-- Summary -->
              <div style="border:1px solid #e5e7eb; border-radius:16px; padding:18px; background:#ffffff; margin-bottom:20px;">
                <div style="font-size:13px; color:#6b7280; margin-bottom:6px;">Evento</div>
                <div style="font-size:18px; font-weight:700; color:#111827; margin-bottom:14px;">
                  ${eventTitle}
                </div>

                <div style="font-size:13px; color:#6b7280; margin-bottom:6px;">Orden</div>
                <div style="font-size:15px; font-weight:700; color:#111827; margin-bottom:14px; word-break:break-word;">
                  ${orderId}
                </div>

                <div style="font-size:13px; color:#6b7280; margin-bottom:6px;">Cantidad de tickets</div>
                <div style="font-size:15px; font-weight:700; color:#111827;">
                  ${ticketCount}
                </div>
              </div>

              <h2 style="margin:0 0 14px; font-size:18px; color:#111827;">
                Tus tickets
              </h2>

              <div style="margin-bottom:20px;">
                ${ticketCards}
              </div>

              <!-- Notice -->
              <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:16px;">
                <p style="margin:0 0 8px; font-size:14px; font-weight:700; color:#111827;">
                  Importante
                </p>
                <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.6;">
                  Presentá este correo al momento del ingreso. En la próxima versión podés adjuntar el QR o un PDF con las entradas para hacerlo todavía más formal.
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align:center; padding:18px 10px 0;">
            <p style="margin:0; font-size:12px; color:#6b7280;">
              © Ticketify · Confirmación automática de compra
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}