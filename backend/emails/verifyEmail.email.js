export function verifyEmailTemplate({ username, verifyUrl }) {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.4">
        <h2>Verificá tu email ✅</h2>
        <p>Hola ${username || ""}, para verificar tu cuenta hacé click:</p>
        <p><a href="${verifyUrl}">Verificar email</a></p>
        <p>Si no fuiste vos, ignorá este mensaje.</p>
    </div>`;
}
