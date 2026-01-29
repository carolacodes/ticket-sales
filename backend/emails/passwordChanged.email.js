export function passwordChangedEmail({ username, when, ip, userAgent }) {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.4">
        <h2>Contraseña actualizada ✅</h2>
        <p>Hola ${username || ""}, tu contraseña fue actualizada correctamente.</p>

        <p><b>Fecha:</b> ${when}</p>
        <p><b>IP:</b> ${ip || "N/A"}</p>
        <p><b>Dispositivo / Navegador:</b> ${userAgent || "N/A"}</p>

        <p>Si no fuiste vos, restablecé tu contraseña inmediatamente.</p>
    </div>`;
}
