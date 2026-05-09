import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import nodemailer from 'nodemailer';
import {
  notifyTelegramContactMessage,
  publicSiteUrlFromRequest,
} from '@/lib/telegram-contact-notify';

// Source JSON files can be read-only in production (e.g. Vercel).
// Keep editable runtime data in /data (or via env override) so it persists.
// Render: set CONTACT_MESSAGES_FILE_PATH to a path on the persistent disk (e.g. /data/contact-messages.json)
// so заявки с формы не теряются при редеплое.
const SEED_CONTACT_FILE = join(process.cwd(), 'src/lib/contact-data.json');
const SEED_MESSAGES_FILE = join(process.cwd(), 'src/lib/contact-messages.json');

const RUNTIME_CONTACT_FILE =
  process.env.CONTACT_FILE_PATH && process.env.CONTACT_FILE_PATH.trim()
    ? process.env.CONTACT_FILE_PATH.trim()
    : join(process.cwd(), 'data', 'contact-data.json');

const RUNTIME_MESSAGES_FILE =
  process.env.CONTACT_MESSAGES_FILE_PATH && process.env.CONTACT_MESSAGES_FILE_PATH.trim()
    ? process.env.CONTACT_MESSAGES_FILE_PATH.trim()
    : join(process.cwd(), 'data', 'contact-messages.json');

interface ContactData {
  phone: {
    number1: string;
    number2: string;
  };
  email: {
    address1: string;
    address2: string;
  };
  address: {
    street: string;
    city: string;
  };
  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  emergency: {
    phone: string;
  };
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city?: string;
  service?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

function ensureRuntimeFile(runtimePath: string, seedPath: string, fallbackContents: string) {
  try {
    mkdirSync(dirname(runtimePath), { recursive: true });
  } catch {
    // ignore
  }

  if (existsSync(runtimePath)) return;

  try {
    if (existsSync(seedPath)) {
      copyFileSync(seedPath, runtimePath);
      return;
    }
  } catch {
    // ignore
  }

  try {
    writeFileSync(runtimePath, fallbackContents, 'utf-8');
  } catch {
    // ignore
  }
}

function readContactData(): ContactData {
  try {
    ensureRuntimeFile(
      RUNTIME_CONTACT_FILE,
      SEED_CONTACT_FILE,
      JSON.stringify(
        {
          phone: { number1: '', number2: '' },
          email: { address1: '', address2: '' },
          address: { street: '', city: '' },
          hours: { weekdays: '', saturday: '', sunday: '' },
          emergency: { phone: '' },
        },
        null,
        2
      )
    );

    const fileToRead = existsSync(RUNTIME_CONTACT_FILE) ? RUNTIME_CONTACT_FILE : SEED_CONTACT_FILE;
    if (!existsSync(fileToRead)) {
      return {
        phone: { number1: '', number2: '' },
        email: { address1: '', address2: '' },
        address: { street: '', city: '' },
        hours: { weekdays: '', saturday: '', sunday: '' },
        emergency: { phone: '' },
      };
    }

    const data = readFileSync(fileToRead, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      phone: { number1: '', number2: '' },
      email: { address1: '', address2: '' },
      address: { street: '', city: '' },
      hours: { weekdays: '', saturday: '', sunday: '' },
      emergency: { phone: '' }
    };
  }
}

function writeContactData(data: ContactData) {
  ensureRuntimeFile(
    RUNTIME_CONTACT_FILE,
    SEED_CONTACT_FILE,
    JSON.stringify(
      {
        phone: { number1: '', number2: '' },
        email: { address1: '', address2: '' },
        address: { street: '', city: '' },
        hours: { weekdays: '', saturday: '', sunday: '' },
        emergency: { phone: '' },
      },
      null,
      2
    )
  );
  writeFileSync(RUNTIME_CONTACT_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'messages') {
      const messages = readMessages();
      return NextResponse.json(messages);
    } else {
      const data = readContactData();
      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при чтении данных' },
      { status: 500 }
    );
  }
}

function readMessages(): ContactMessage[] {
  try {
    ensureRuntimeFile(RUNTIME_MESSAGES_FILE, SEED_MESSAGES_FILE, '[]');
    const fileToRead = existsSync(RUNTIME_MESSAGES_FILE) ? RUNTIME_MESSAGES_FILE : SEED_MESSAGES_FILE;
    if (!existsSync(fileToRead)) return [];
    const data = readFileSync(fileToRead, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeMessages(messages: ContactMessage[]) {
  ensureRuntimeFile(RUNTIME_MESSAGES_FILE, SEED_MESSAGES_FILE, '[]');
  writeFileSync(RUNTIME_MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
}

async function sendEmail(message: ContactMessage) {
  try {
    const emailBody = `
Новое сообщение с сайта VK Bouwmaster

Имя: ${message.name}
Email: ${message.email}
${message.phone ? `Телефон: ${message.phone}` : ''}

Адрес:
${message.street} ${message.houseNumber}
${message.postalCode}${message.city ? `, ${message.city}` : ''}

${message.service ? `Услуга: ${message.service}` : ''}

Сообщение:
${message.message}

---
Дата отправки: ${new Date(message.createdAt).toLocaleString('ru-RU')}
`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin: 10px 0; }
    .label { font-weight: bold; color: #667eea; }
    .message-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Новое сообщение с сайта VK Bouwmaster</h1>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Имя:</span> ${message.name}
      </div>
      <div class="field">
        <span class="label">Email:</span> <a href="mailto:${message.email}">${message.email}</a>
      </div>
      ${message.phone ? `
      <div class="field">
        <span class="label">Телефон:</span> <a href="tel:${message.phone}">${message.phone}</a>
      </div>
      ` : ''}
      <div class="field">
        <span class="label">Адрес:</span> ${message.street} ${message.houseNumber}, ${message.postalCode}${message.city ? `, ${message.city}` : ''}
      </div>
      ${message.service ? `
      <div class="field">
        <span class="label">Услуга:</span> ${message.service}
      </div>
      ` : ''}
      <div class="message-box">
        <div class="label">Сообщение:</div>
        <div style="white-space: pre-wrap; margin-top: 10px;">${message.message}</div>
      </div>
      <div class="footer">
        Дата отправки: ${new Date(message.createdAt).toLocaleString('ru-RU')}
      </div>
    </div>
  </div>
</body>
</html>
`;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const recipientEmail = process.env.RECIPIENT_EMAIL || process.env.EMAIL_TO || 'vkbouwmaster@gmail.com';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('SMTP настройки не заданы. Email не будет отправлен.');
      console.log('Для настройки отправки email задайте переменные окружения:');
      console.log('SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, RECIPIENT_EMAIL (or EMAIL_TO)');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true для 465, false для других портов
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"VK Bouwmaster Website" <${smtpUser}>`,
      to: recipientEmail,
      subject: `Новое сообщение с сайта от ${message.name}`,
      text: emailBody,
      html: emailHtml,
      replyTo: message.email,
    });

    console.log('Email отправлен:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const message: ContactMessage = {
      id: Date.now().toString(),
      name: String(body.name || '').trim(),
      email: String(body.email || '').trim(),
      phone: String(body.phone || '').trim() || undefined,
      street: String(body.street || '').trim(),
      houseNumber: String(body.houseNumber || '').trim(),
      postalCode: String(body.postalCode || '').trim(),
      city: String(body.city || '').trim() || undefined,
      service: String(body.service || '').trim() || undefined,
      message: String(body.message || '').trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    if (!message.name || !message.email || !message.street || !message.houseNumber || !message.postalCode || !message.message) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    const messages = readMessages();
    messages.unshift(message); // Добавляем новое сообщение в начало
    writeMessages(messages);

    const siteUrl = publicSiteUrlFromRequest(request);
    sendEmail(message).catch((err) => console.error('Email sending failed:', err));
    notifyTelegramContactMessage(message, { siteUrl }).catch((err) =>
      console.error('Telegram sending failed:', err)
    );

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error saving contact message:', error);
    return NextResponse.json(
      { error: 'Ошибка при сохранении сообщения' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    if (type === 'messages' && id) {
      const body = await request.json();
      const messages = readMessages();
      const index = messages.findIndex(m => m.id === id);
      
      if (index === -1) {
        return NextResponse.json(
          { error: 'Сообщение не найдено' },
          { status: 404 }
        );
      }
      
      messages[index] = { ...messages[index], ...body };
      writeMessages(messages);
      return NextResponse.json({ success: true });
    } else {
      const data: ContactData = await request.json();
      writeContactData(data);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при сохранении' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    if (type === 'messages' && id) {
      const messages = readMessages();
      const filtered = messages.filter(m => m.id !== id);
      writeMessages(filtered);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Неверный запрос' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при удалении' },
      { status: 500 }
    );
  }
}

