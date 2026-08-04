import logging
import requests
from email.utils import parseaddr

from django.conf import settings


logger = logging.getLogger(__name__)

BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"

def send_brevo_email(subject, text_content, recipient_email, html_content=None):
    api_key = settings.BREVO_API_KEY

    sender_name, sender_email = parseaddr(settings.DEFAULT_FROM_EMAIL)

    payload = {
        "sender": {
            "name": sender_name or "ShoeKave",
            "email": sender_email,
        },
        "to": [
            {
                "email": recipient_email,
            }
        ],
        "subject": subject,
        "textContent": text_content,
    }

    if html_content:
        payload["htmlContent"] = html_content

    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": api_key,
        },
        json=payload,
        timeout=15,
    )

    print(response.status_code)
    print(response.text)

    response.raise_for_status()

    return response.json()


def send_welcome_email(user):
    """
    Sends a welcome email to a newly registered user using Brevo.
    """
    first_name = user.first_name or "Friend"
    recipient_email = user.email

    subject = "Welcome to ShoeKave! 👟"

    text_content = (
        f"Hi {first_name},\n\n"
        f"Welcome to ShoeKave!\n\n"
        f"We're thrilled to have you join our community. ShoeKave is your home for the finest, "
        f"most exclusive footwear and sneakers.\n\n"
        f"What you can do next:\n"
        f"- Browse our latest shoe arrivals and exclusive drops\n"
        f"- Save your favorite styles\n"
        f"- Enjoy fast, secure checkout\n\n"
        f"Happy shopping!\n\n"
        f"Best regards,\n"
        f"The ShoeKave Team\n"
    )

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ShoeKave</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); padding: 35px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 1px;">ShoeKave 👟</h1>
              <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 15px; font-weight: 500;">Step Into Your Next Favorite Pair</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 35px 30px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 22px; font-weight: 700;">Welcome, {first_name}! 👋</h2>
              <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                Thank you for signing up at <strong>ShoeKave</strong>! We are excited to have you in our sneaker community.
              </p>
              
              <div style="background-color: #0f172a; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 10px 0; color: #60a5fa; font-size: 16px; font-weight: 600;">Here's what awaits you:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 14px; line-height: 1.8;">
                  <li>🔥 Exclusive access to fresh sneaker drops & top brands</li>
                  <li>⚡ Lightning-fast checkout & secure payment processing</li>
                  <li>🚚 Reliable order tracking & door-to-door delivery</li>
                </ul>
              </div>

              <p style="margin: 0 0 30px 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                Ready to discover your next pair of shoes?
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="http://localhost:5173/" target="_blank" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);">
                  Start Shopping Now
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 25px 30px; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                © ShoeKave Inc. All rights reserved.
              </p>
              <p style="margin: 0; color: #475569; font-size: 12px;">
                If you didn't create an account with us, please disregard this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    return send_brevo_email(
        subject=subject,
        text_content=text_content,
        recipient_email=recipient_email,
        html_content=html_content,
    )


def send_order_confirmation_email(order):
    """
    Sends an order confirmation email to the user when an order is placed.
    """
    user = order.user
    first_name = user.first_name or "Valued Customer"
    recipient_email = user.email

    items = order.items.select_related("product").all()

    subject = f"Order Confirmation — Order #{order.id} 🛍️"

    items_text = ""
    items_html_rows = ""

    for item in items:
        prod_name = item.product.name if item.product else "Shoe Item"
        size = item.size
        qty = item.quantity
        price = item.price
        item_total = price * qty

        items_text += f"- {prod_name} (Size: {size}) x {qty} @ ₦{price:,.2f} = ₦{item_total:,.2f}\n"

        items_html_rows += f"""
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #334155; color: #f8fafc; font-size: 14px;">
            <strong>{prod_name}</strong><br/>
            <span style="color: #94a3b8; font-size: 12px;">Size: {size}</span>
          </td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #334155; color: #cbd5e1; font-size: 14px; text-align: center;">
            {qty}
          </td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #334155; color: #cbd5e1; font-size: 14px; text-align: right;">
            ₦{price:,.2f}
          </td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #334155; color: #60a5fa; font-weight: 600; font-size: 14px; text-align: right;">
            ₦{item_total:,.2f}
          </td>
        </tr>
        """

    created_str = order.created_at.strftime("%B %d, %Y at %I:%M %p") if getattr(order, "created_at", None) else "Recently"
    total_formatted = f"₦{order.total_amount:,.2f}"

    text_content = (
        f"Hi {first_name},\n\n"
        f"Thank you for your order at ShoeKave! We have received your order #{order.id} and it is currently being processed.\n\n"
        f"ORDER SUMMARY:\n"
        f"Order ID: #{order.id}\n"
        f"Date: {created_str}\n"
        f"Status: {order.status}\n"
        f"Payment Method: {order.payment_method or 'Card'}\n"
        f"Shipping Address: {order.shipping_address or 'N/A'}{f', {order.city}' if order.city else ''}\n"
        f"Phone: {order.phone_number or 'N/A'}\n\n"
        f"ITEMS ORDERED:\n"
        f"{items_text}\n"
        f"TOTAL AMOUNT: {total_formatted}\n\n"
        f"We will notify you once your order is shipped.\n\n"
        f"Thank you for shopping with ShoeKave!\n\n"
        f"Best regards,\n"
        f"The ShoeKave Team"
    )

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation #{order.id}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 650px; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800;">ShoeKave 🛍️</h1>
              <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 15px; font-weight: 500;">Order Confirmation & Receipt</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px;">
              <div style="margin-bottom: 20px;">
                <h2 style="margin: 0 0 6px 0; color: #ffffff; font-size: 20px; font-weight: 700;">Thank You for Your Order, {first_name}!</h2>
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">We've received your order and are getting it ready.</p>
              </div>

              <!-- Details Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; margin: 20px 0; padding: 18px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 10px;">
                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Order Number</p>
                    <p style="margin: 0 0 14px 0; color: #60a5fa; font-size: 16px; font-weight: 700;">#{order.id}</p>

                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Date Placed</p>
                    <p style="margin: 0; color: #cbd5e1; font-size: 14px;">{created_str}</p>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-left: 10px;">
                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Status</p>
                    <p style="margin: 0 0 14px 0;">
                      <span style="background-color: #1e3a8a; color: #93c5fd; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block;">{order.status}</span>
                    </p>

                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Payment Method</p>
                    <p style="margin: 0; color: #cbd5e1; font-size: 14px;">{order.payment_method or 'Card'}</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top: 1px solid #1e293b; padding-top: 14px; margin-top: 14px;">
                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Shipping Address</p>
                    <p style="margin: 0; color: #cbd5e1; font-size: 14px;">{order.shipping_address or 'N/A'}{f", {order.city}" if order.city else ""} (Tel: {order.phone_number or 'N/A'})</p>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <h3 style="margin: 25px 0 12px 0; color: #ffffff; font-size: 16px; font-weight: 700;">Order Details</h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; background-color: #0f172a; border-radius: 8px; overflow: hidden; border: 1px solid #334155;">
                <thead>
                  <tr style="background-color: #1e293b; text-align: left;">
                    <th style="padding: 12px 15px; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600;">Item</th>
                    <th style="padding: 12px 15px; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600; text-align: center;">Qty</th>
                    <th style="padding: 12px 15px; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600; text-align: right;">Price</th>
                    <th style="padding: 12px 15px; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 600; text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items_html_rows}
                </tbody>
              </table>

              <!-- Total -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                <tr>
                  <td align="right">
                    <table border="0" cellspacing="0" cellpadding="0" style="width: 250px;">
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8; font-size: 14px;">Total Amount:</td>
                        <td style="padding: 6px 0; color: #38bdf8; font-size: 20px; font-weight: 800; text-align: right;">{total_formatted}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 25px 30px; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0 0 6px 0; color: #94a3b8; font-size: 13px;">
                Questions about your order? Reply to this email or contact support.
              </p>
              <p style="margin: 0; color: #475569; font-size: 12px;">
                © ShoeKave Inc. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    return send_brevo_email(
        subject=subject,
        text_content=text_content,
        recipient_email=recipient_email,
        html_content=html_content,
    )
