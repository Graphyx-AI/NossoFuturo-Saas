import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export interface SendWorkspaceInviteParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  acceptUrl: string;
}

export async function sendWorkspaceInviteEmail({
  to,
  inviterName,
  workspaceName,
  acceptUrl,
}: SendWorkspaceInviteParams): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY não configurada" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const from = `Nosso Futuro <onboarding@resend.dev>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5;">
  <div style="max-width: 480px; margin: 0 auto; padding: 32px 24px;">
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="margin: 0 0 16px; font-size: 22px; color: #18181b;">Convite para o workspace</h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: #71717a; line-height: 1.6;">
        <strong>${escapeHtml(inviterName)}</strong> convidou você para participar do workspace <strong>${escapeHtml(workspaceName)}</strong> no Nosso Futuro.
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; color: #71717a; line-height: 1.6;">
        Clique no botão abaixo para aceitar o convite e começar a acompanhar as finanças junto com sua família.
      </p>
      <a href="${escapeHtml(acceptUrl)}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
        Aceitar convite
      </a>
      <p style="margin: 24px 0 0; font-size: 13px; color: #a1a1aa;">
        Se o botão não funcionar, copie e cole este link no navegador:<br>
        <a href="${escapeHtml(acceptUrl)}" style="color: #10b981; word-break: break-all;">${escapeHtml(acceptUrl)}</a>
      </p>
      <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa;">
        Se você não solicitou este convite, pode ignorar este e-mail.
      </p>
    </div>
    <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
      Nosso Futuro — Gestão financeira para você e sua família
    </p>
  </div>
</body>
</html>
`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: `${inviterName} convidou você para ${workspaceName} — Nosso Futuro`,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao enviar e-mail";
    return { ok: false, error: msg };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
