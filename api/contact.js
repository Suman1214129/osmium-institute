export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, phone, org, orgType, size, message } = req.body;

  const html = `
<h2>New Enterprise Enquiry — Osmium AI</h2>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td><strong>Name</strong></td><td>${name}</td></tr>
  <tr><td><strong>Email</strong></td><td>${email}</td></tr>
  <tr><td><strong>Phone</strong></td><td>${phone || '—'}</td></tr>
  <tr><td><strong>Organisation</strong></td><td>${org}</td></tr>
  <tr><td><strong>Type</strong></td><td>${orgType.replace(/&amp;/g, '&')}</td></tr>
  <tr><td><strong>Learners</strong></td><td>${size || '—'}</td></tr>
  <tr><td><strong>Message</strong></td><td style="white-space:pre-wrap">${message || '—'}</td></tr>
</table>`;

  const mailerRes = await fetch("https://mailer.navchetna.tech/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "aegis_mk_live_e3ec02cc27a0a3a5d53be51fa12148bc20897ed1ca1c3834aeb22feb473b1d76"
    },
    body: JSON.stringify({
      to: "hello@navchetna.tech",
      replyTo: email,
      subject: `Osmium Enquiry: ${org} (${orgType})`,
      html
    })
  });

  const json = await mailerRes.json();
  if (!mailerRes.ok || !json.success) return res.status(500).json({ error: json.error || "Failed" });
  res.status(200).json({ success: true });
}
