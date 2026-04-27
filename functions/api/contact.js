export async function onRequestPost(context) {
  const { request, env } = context;

  const formData = await request.formData();
  const token = formData.get('g-recaptcha-response');

  if (!token) {
    return new Response(JSON.stringify({ success: false, message: 'reCAPTCHAトークンがありません。' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // reCAPTCHA v3 verification
  const secretKey = env.RECAPTCHA_SECRET_KEY;
  const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secretKey}&response=${token}`,
  });
  const verifyData = await verifyRes.json();

  if (!verifyData.success || verifyData.score < 0.5) {
    return new Response(JSON.stringify({ success: false, message: 'reCAPTCHAの検証に失敗しました。' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Forward to Web3Forms
  const web3Res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    body: formData,
  });
  const data = await web3Res.json();

  return new Response(JSON.stringify(data), {
    status: web3Res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
