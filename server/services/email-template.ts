interface EmailData {
  title: string;
  excerpt: string;
  coverImage: string;
  blogUrl: string;
  author: string;
  readTime: string;
}

export function buildEmailHtml(data: EmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.title}</title>
</head>
<body style="margin:0; padding:0; background-color:#0a0a0a; font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#141414; border-radius:12px; border:1px solid #262626; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px; border-bottom:1px solid #262626;">
              <span style="font-size:18px; font-weight:700; color:#ffffff; letter-spacing:-0.025em;">Quit 9to5</span>
            </td>
          </tr>

          <!-- Cover Image -->
          <tr>
            <td style="padding:0;">
              <img src="${data.coverImage}" alt="${data.title}" style="width:100%; height:auto; display:block; object-fit:cover; max-height:280px;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:28px 32px;">
              <!-- Meta -->
              <p style="margin:0 0 12px; font-size:12px; color:#737373;">
                ${data.author} &middot; ${data.readTime}
              </p>

              <!-- Title -->
              <h1 style="margin:0 0 14px; font-size:22px; font-weight:700; color:#ffffff; line-height:1.3;">
                ${data.title}
              </h1>

              <!-- Excerpt -->
              <p style="margin:0 0 24px; font-size:15px; color:#a3a3a3; line-height:1.6;">
                ${data.excerpt}
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb, #3b82f6); border-radius:8px;">
                    <a href="${data.blogUrl}" style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                      Read Full Post →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; border-top:1px solid #262626; text-align:center;">
              <p style="margin:0; font-size:11px; color:#525252; line-height:1.5;">
                You're receiving this because you subscribed to blog updates on Quit 9to5.<br/>
                <a href="${data.blogUrl}" style="color:#3b82f6; text-decoration:underline;">Visit the blog</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
