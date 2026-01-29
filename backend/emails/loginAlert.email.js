export function loginAlertEmail({ username, when, ip, userAgent }) {
    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.4">
            <h2>Nuevo inicio de sesión 🔐</h2>
            <p>Hola ${username || ""}, detectamos un nuevo inicio de sesión en tu cuenta.</p>

            <p><b>Fecha:</b> ${when}</p>
            <p><b>IP:</b> ${ip || "N/A"}</p>
            <p><b>Dispositivo / Navegador:</b> ${userAgent || "N/A"}</p>

            <p>Si fuiste vos, podés ignorar este mensaje. Si no, cambiá tu contraseña.</p>
        </div>`;
}
