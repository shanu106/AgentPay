const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const EMAIL_STORE_FILE = path.join(os.tmpdir(), 'razorpay_agent_emails.json');

class EmailService {
  constructor() {
    this.sentEmails = [];
    this.loadEmails();
  }

  loadEmails() {
    try {
      if (fs.existsSync(EMAIL_STORE_FILE)) {
        this.sentEmails = JSON.parse(fs.readFileSync(EMAIL_STORE_FILE, 'utf8'));
      }
    } catch (e) {}
  }

  saveEmails() {
    try {
      fs.writeFileSync(EMAIL_STORE_FILE, JSON.stringify(this.sentEmails, null, 2), 'utf8');
    } catch (e) {}
  }

  getTransporter() {
    const gmailUser = (process.env.GMAIL_USER || '').trim();
    const gmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '').trim().replace(/\s+/g, '');

    if (gmailUser && gmailPass) {
      return {
        isLive: true,
        gmailUser,
        transporter: nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass
          }
        })
      };
    }
    return { isLive: false, gmailUser: null, transporter: null };
  }

  async sendOrderConfirmationEmail({ userEmail, userName, order, payment, address }) {
    const recipient = userEmail || 'nawaz@gmail.com';
    const name = userName || 'Customer';
    const orderId = order?.orderId || 'ORD-NEW';
    const razorpayOrderId = order?.razorpayOrderId || 'order_xxx';
    const razorpayPaymentId = payment?.paymentId || order?.paymentId || 'pay_live_captured';
    const amount = Number(order?.amount || 0);
    const items = order?.items || [];
    const deliveryAddr = address || { street: 'Flat 402, Sunshine Heights', area: 'Koramangala 4th Block', city: 'Bengaluru', pincode: '560034' };
    const paymentLabel = payment?.paymentMethod?.label || 'Visa (Domestic) (•••• 1007)';

    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: 600; color: #1e293b;">
          ${item.quantity || 1}x ${item.title || item.productTitle}
        </td>
        <td style="padding: 10px 8px; text-align: right; color: #475569;">
          ₹${(item.unitPrice || item.price || 0).toLocaleString()}
        </td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #0f172a;">
          ₹${(item.lineTotal || (item.price * (item.quantity || 1)) || 0).toLocaleString()}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #0284c7, #2563eb); padding: 24px; color: #ffffff; text-align: center; }
          .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
          .header p { margin: 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 24px; color: #334155; }
          .badge { display: inline-block; padding: 4px 10px; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; border-radius: 9999px; }
          .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-top: 20px; margin-bottom: 8px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .total-row { background: #f8fafc; font-size: 16px; font-weight: 800; color: #0f172a; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 12px; font-size: 13px; line-height: 1.5; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ Order Confirmed & Paid!</h1>
            <p>Razorpay Smart Checkout Assistant</p>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your order has been confirmed and paid successfully via Razorpay:</p>
            
            <div style="margin: 16px 0;">
              <span class="badge">✓ Payment Captured via Razorpay</span>
            </div>

            <div class="section-title">Order Summary</div>
            <table class="table">
              <thead>
                <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 12px; color: #64748b;">
                  <th style="padding: 6px 8px;">Item</th>
                  <th style="padding: 6px 8px; text-align: right;">Unit Price</th>
                  <th style="padding: 6px 8px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="2" style="padding: 12px 8px;">Total Amount Paid</td>
                  <td style="padding: 12px 8px; text-align: right; color: #059669;">₹${amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="section-title">Delivery & Payment Details</div>
            <div class="card">
              <div><strong>📍 Delivery Address:</strong> ${deliveryAddr.recipientName ? `${deliveryAddr.recipientName} - ` : ''}${deliveryAddr.street || ''}, ${deliveryAddr.area || ''}, ${deliveryAddr.city || 'Bengaluru'} - ${deliveryAddr.pincode || '560034'}</div>
              <div style="margin-top: 6px;"><strong>💳 Paid via:</strong> ${paymentLabel}</div>
              <div style="margin-top: 6px;"><strong>🆔 Store Order ID:</strong> <code>#${orderId}</code></div>
              <div style="margin-top: 6px;"><strong>⚡ Razorpay Order ID:</strong> <code>${razorpayOrderId}</code></div>
              <div style="margin-top: 6px;"><strong>🔒 Razorpay Payment ID:</strong> <code style="color:#0284c7; font-weight:bold;">${razorpayPaymentId}</code> (Captured ✓)</div>
            </div>

            <div style="margin-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
              This transaction was securely executed by Razorpay Pre-Authorized Auto-Debit within your pre-set spending limit.
            </div>
          </div>
          <div class="footer">
            © 2026 Razorpay Agentic Commerce Platform • Powered by Google Gemini AI
          </div>
        </div>
      </body>
      </html>
    `;

    const emailRecord = {
      id: `email_${Date.now()}`,
      to: recipient,
      subject: `🎉 Order Confirmed (#${orderId}): ${order?.productTitle || 'Your Items'} (₹${amount.toLocaleString()})`,
      html: htmlContent,
      sentAt: new Date().toISOString(),
      status: 'pending'
    };

    const { isLive, gmailUser, transporter } = this.getTransporter();

    if (isLive && transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"Razorpay Autonomous Shopping Agent" <${gmailUser}>`,
          to: recipient,
          subject: emailRecord.subject,
          html: htmlContent
        });
        emailRecord.status = 'delivered';
        emailRecord.messageId = info.messageId;
        this.sentEmails.unshift(emailRecord);
        this.saveEmails();
        console.log(`\n✅ [GMAIL SMTP DELIVERED TO: ${recipient}]`);
        console.log(`   Message ID: ${info.messageId}\n`);
        return { success: true, messageId: info.messageId, recipient, mode: 'gmail_smtp' };
      } catch (err) {
        console.error(`\n❌ [GMAIL SMTP AUTH/DELIVERY FAILED]: ${err.message}`);
        console.error(`   Please verify App Password for ${gmailUser} at https://myaccount.google.com/apppasswords`);
        emailRecord.status = 'failed_smtp';
        emailRecord.error = err.message;
        this.sentEmails.unshift(emailRecord);
        this.saveEmails();
        return { success: false, error: err.message, recipient, mode: 'failed_smtp' };
      }
    } else {
      // Record simulated email
      emailRecord.status = 'simulated';
      this.sentEmails.unshift(emailRecord);
      this.saveEmails();
      console.log(`\n📧 [EMAIL DISPATCHED TO: ${recipient}] (Simulated Mode)`);
      console.log(`   Subject: ${emailRecord.subject}\n`);
      return { success: true, messageId: emailRecord.id, recipient, mode: 'simulated' };
    }
  }

  getSentEmails(userEmail) {
    if (!userEmail) return this.sentEmails;
    return this.sentEmails.filter(e => e.to.toLowerCase() === userEmail.toLowerCase());
  }
}

module.exports = new EmailService();
