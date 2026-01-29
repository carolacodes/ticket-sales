export function resetPasswordEmail({ username, resetUrl }) {
    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.4">
            <h2>Restablecer contraseña 🔑</h2>
            <p>Hola ${username || ""}, pediste restablecer tu contraseña.</p>
            <p><a href="${resetUrl}">Crear nueva contraseña</a></p>
            <p>Si no fuiste vos, ignorá este mensaje.</p>
            <p>Este link expira en 60 minutos.</p>
        </div>`;
}
