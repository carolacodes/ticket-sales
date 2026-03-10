export function verifyEmailTemplate({ username, verifyUrl }) {
  const safeName = username?.trim() || "Hola";

  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verificá tu email</title>
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
              <div style="font-size:42px; line-height:1; margin-bottom:12px;">✅</div>
              <h1 style="margin:0; font-size:28px; line-height:1.2; color:#ffffff;">
                Verificá tu email
              </h1>
              <p style="margin:10px 0 0; font-size:15px; color:#d1d5db;">
                Confirmá tu cuenta para empezar a usar Ticketify
              </p>
            </div>

            <!-- Content -->
            <div style="padding:28px 24px;">
              <p style="margin:0 0 16px; font-size:16px; color:#111827;">
                ${safeName}, gracias por registrarte. Para activar tu cuenta, hacé click en el botón de abajo.
              </p>

              <div style="text-align:center; margin:24px 0;">
                <a
                  href="${verifyUrl}"
                  style="
                    display:inline-block;
                    background:#111827;
                    color:#ffffff;
                    text-decoration:none;
                    padding:14px 22px;
                    border-radius:12px;
                    font-size:15px;
                    font-weight:700;
                  "
                >
                  Verificar email
                </a>
              </div>

              <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:16px; margin-bottom:16px;">
                <p style="margin:0 0 8px; font-size:14px; font-weight:700; color:#111827;">
                  ¿No funciona el botón?
                </p>
                <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.6; word-break:break-word;">
                  Copiá y pegá este enlace en tu navegador:
                </p>
                <p style="margin:10px 0 0; font-size:13px; color:#111827; word-break:break-word;">
                  ${verifyUrl}
                </p>
              </div>

              <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:16px;">
                <p style="margin:0 0 8px; font-size:14px; font-weight:700; color:#111827;">
                  Importante
                </p>
                <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.6;">
                  Si no creaste esta cuenta, podés ignorar este mensaje sin problema.
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align:center; padding:18px 10px 0;">
            <p style="margin:0; font-size:12px; color:#6b7280;">
              © Ticketify · Verificación automática de cuenta
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}