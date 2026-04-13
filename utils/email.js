const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmationEmail = async ({ to, order }) => {
  const transporter = createTransporter();

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.product?.title || 'Product'}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${item.price}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
      <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <div style="background:#2c3e50;padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Order Confirmed! 🎉</h1>
        </div>
        <div style="padding:30px;">
          <p style="color:#555;font-size:16px;">Thank you for your purchase. Your order has been confirmed.</p>
          
          <div style="background:#f8f9fa;border-radius:6px;padding:20px;margin:20px 0;">
            <h3 style="margin:0 0 10px;color:#2c3e50;">Order Summary</h3>
            <p style="margin:4px 0;color:#666;"><strong>Order ID:</strong> ${order._id}</p>
            <p style="margin:4px 0;color:#666;"><strong>Status:</strong> <span style="color:#27ae60;font-weight:bold;">${order.orderStatus.toUpperCase()}</span></p>
            <p style="margin:4px 0;color:#666;"><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="padding:10px;text-align:left;">Product</th>
                <th style="padding:10px;text-align:center;">Qty</th>
                <th style="padding:10px;text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="text-align:right;padding:15px 0;border-top:2px solid #eee;">
            <span style="font-size:20px;font-weight:bold;color:#2c3e50;">Total: ₹${order.totalAmount}</span>
          </div>

          <div style="background:#f8f9fa;border-radius:6px;padding:20px;margin:20px 0;">
            <h3 style="margin:0 0 10px;color:#2c3e50;">Shipping Address</h3>
            <p style="margin:0;color:#666;line-height:1.6;">
              ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''}<br>
              ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pinCode || ''}<br>
              ${order.shippingAddress?.country || 'India'}
            </p>
          </div>

          <p style="color:#888;font-size:14px;margin-top:30px;">
            If you have any questions about your order, please contact our support team.
          </p>
        </div>
        <div style="background:#f0f0f0;padding:15px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Your Store" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `Order Confirmed - #${order._id}`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Order confirmation email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email send error:', error);
    // Don't throw — email failure shouldn't break order flow
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async ({ to, name }) => {
  const transporter = createTransporter();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#2c3e50;">Welcome to Our Store, ${name}! 👋</h2>
      <p>Your account has been created successfully. Start shopping now!</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Your Store" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Welcome to Our Store!',
      html,
    });
  } catch (error) {
    logger.error('Welcome email error:', error);
  }
};

/**
 * Send seller approval email
 */
const sendSellerApprovalEmail = async ({ to, name, approved }) => {
  const transporter = createTransporter();

  const subject = approved ? 'Seller Account Approved!' : 'Seller Account Application Update';
  const html = approved
    ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#27ae60;">Congratulations, ${name}! 🎉</h2>
        <p>Your seller account has been approved. You can now list your products on our platform.</p>
       </div>`
    : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#e74c3c;">Application Update</h2>
        <p>Dear ${name}, we're sorry to inform you that your seller application was not approved at this time.</p>
       </div>`;

  try {
    await transporter.sendMail({
      from: `"Your Store" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.error('Seller approval email error:', error);
  }
};

module.exports = { sendOrderConfirmationEmail, sendWelcomeEmail, sendSellerApprovalEmail };
