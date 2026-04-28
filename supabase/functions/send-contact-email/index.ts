// @ts-ignore: Deno npm specifier
import nodemailer from 'npm:nodemailer@6.9.9'
// @ts-ignore: Deno standard modules
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, message } = await req.json()

    // @ts-ignore: Deno env access
    const SMTP_USER = Deno.env.get('SMTP_USER') ?? ''
    // @ts-ignore: Deno env access
    const SMTP_PASS = Deno.env.get('SMTP_PASS') ?? ''
    // @ts-ignore: Deno env access
    const SMTP_ADMIN_EMAIL = Deno.env.get('SMTP_ADMIN_EMAIL') ?? ''

    console.log('SMTP_USER:', SMTP_USER ? '✅ Found' : '❌ Missing')
    console.log('SMTP_PASS:', SMTP_PASS ? '✅ Found' : '❌ Missing')

    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error('SMTP credentials are not configured.')
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `"OutSauce Contact" <${SMTP_USER}>`,
      to: SMTP_ADMIN_EMAIL,
      subject: `OutSauce: New Contact Message from ${name}`,
      text: `You have a new message from your contact form:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C41E1E;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <hr/>
          <p><strong>Message:</strong></p>
          <p style="background:#f5f5f5; padding:16px; border-radius:8px;">${message}</p>
        </div>
      `,
    })

    console.log('✅ Email sent successfully to', SMTP_ADMIN_EMAIL)

    return new Response(
      JSON.stringify({ message: 'Email sent successfully!' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('❌ Edge Function Error:', error?.message || error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal Server Error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
