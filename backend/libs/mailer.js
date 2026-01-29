import { Resend } from "resend";

function mustEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

const resend = new Resend(mustEnv("RESEND_API_KEY"));

export async function sendEmail({ to, subject, html }) {
    const from = mustEnv("MAIL_FROM");

    const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
    });

    if (error) throw new Error(error.message || "Email send failed");
    return data; // incluye id del email
}
