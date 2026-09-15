const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ message: 'POST 요청만 허용됩니다.' });
  }

  const { brand, phone, email, url = '', service, message = '', consent } = request.body ?? {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!brand || !phone || !email || !service || !consent) {
    return response.status(400).json({ message: '필수 항목과 개인정보 수집 동의를 확인해 주세요.' });
  }

  if (!emailPattern.test(email)) {
    return response.status(400).json({ message: '이메일 주소를 정확히 입력해 주세요.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return response.status(503).json({ message: '메일 전송 설정이 아직 완료되지 않았습니다.' });
  }

  const from = process.env.RESEND_FROM_EMAIL || 'Rising Hills <onboarding@resend.dev>';
  const to = process.env.CONTACT_TO_EMAIL || 'eskimoi1227@gmail.com';
  const safe = {
    brand: escapeHtml(brand),
    phone: escapeHtml(phone),
    email: escapeHtml(email),
    url: escapeHtml(url || '미입력'),
    service: escapeHtml(service),
    message: escapeHtml(message || '미입력').replaceAll('\n', '<br />'),
  };

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[라이징힐즈 문의] ${service} · ${brand}`,
        html: `
          <div style="font-family:Arial,'Noto Sans KR',sans-serif;line-height:1.7;color:#171917">
            <h1 style="font-size:22px;margin:0 0 24px">새로운 라이징힐즈 문의</h1>
            <p><strong>브랜드·상호명</strong><br />${safe.brand}</p>
            <p><strong>연락처</strong><br />${safe.phone}</p>
            <p><strong>이메일</strong><br />${safe.email}</p>
            <p><strong>홈페이지·운영 채널</strong><br />${safe.url}</p>
            <p><strong>문의 분야</strong><br />${safe.service}</p>
            <p><strong>상담 내용</strong><br />${safe.message}</p>
          </div>
        `,
      }),
    });

    const result = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      return response.status(502).json({ message: '메일 전송에 실패했습니다.', detail: result.message });
    }

    return response.status(200).json({ message: '문의가 정상적으로 접수되었습니다.' });
  } catch {
    return response.status(502).json({ message: '메일 서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}
