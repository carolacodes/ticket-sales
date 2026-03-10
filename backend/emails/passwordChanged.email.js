export function passwordChangedEmail({ username, when, ip, userAgent }) {
  const safeName = username?.trim() || "Hola";

  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Contraseña actualizada</title>
    </head>
    <body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#111827;">
      <div style="width:100%; background:#f3f4f6; padding:32px 16px;">
        <div style="max-width:640px; margin:0 auto;">

          <div style="text-align:center; margin-bottom:20px;">
            <div style="display:inline-block; background:#111827; color:#ffffff; padding:10px 16px; border-radius:12px; font-size:18px; font-weight:700;">
              Ticketify
            </div>
          </div>

          <div style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
            
            <div style="background:linear-gradient(135deg, #111827 0%, #1f2937 100%); padding:32px 24px; text-align:center;">
              <div style="font-size:42px; line-height:1; margin-bottom:12px;">✅</div>
              <h1 style="margin:0; font-size:28px; line-height:1.2; color:#ffffff;">
                Contraseña actualizada
              </h1>
              <p style="margin:10px 0 0; font-size:15px; color:#d1d5db;">
                Tu contraseña fue cambiada correctamente
              </p>
            </div>

            <div style="padding:28px 24px;">
              <p style="margin:0 0 16px; font-size:16px; color:#111827;">
                ${safeName}, te confirmamos que la contraseña de tu cuenta fue actualizada con éxito.
              </p>

              <div style="border:1px solid #e5e7eb; border-radius:16px; padding:18px; background:#ffffff; margin-bottom:20px;">
                <div style="font-size:13px; color:#6b7280; margin-bottom:6px;">Fecha</div>
                <div style="font-size:15px; font-weight:700; color:#111827; margin-bottom:14px;">
                  ${when || "N/A"}
                </div>

                <div style="font-size:13px; color:#6b7280; margin-bottom:6px;">IP</div>
                <div style="font-size:15px; font-weight:700; color:#111827; margin-bottom:14px; word-break:break-word;">
                  ${ip || "N/A"}
                </div>

                <div style="font-size:13px; color:#6b7280; margin-bottom:6px;">Dispositivo / Navegador</div>
                <div style="font-size:15px; font-weight:700; color:#111827; word-break:break-word;">
                  ${userAgent || "N/A"}
                </div>
              </div>

              <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:14px; padding:16px;">
                <p style="margin:0 0 8px; font-size:14px; font-weight:700; color:#111827;">
                  ¿No fuiste vos?
                </p>
                <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.6;">
                  Si no realizaste este cambio, restablecé tu contraseña inmediatamente y revisá la seguridad de tu cuenta.
                </p>
              </div>
            </div>
          </div>

          <div style="text-align:center; padding:18px 10px 0;">
            <p style="margin:0; font-size:12px; color:#6b7280;">
              © Ticketify · Notificación automática de seguridad
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}