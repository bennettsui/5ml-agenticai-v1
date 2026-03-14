'use strict';

const BASE_URL = process.env.EVENTFLOW_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function formatDate(dt, tz = 'Asia/Hong_Kong') {
  return new Date(dt).toLocaleString('en-HK', {
    timeZone: tz, weekday: 'long', year: 'numeric',
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const styles = `
  body { margin:0; padding:0; background:#0f172a; font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }
  .wrap { max-width:580px; margin:0 auto; background:#1e293b; border-radius:16px; overflow:hidden; }
  .banner { width:100%; height:200px; object-fit:cover; display:block; background:#0f172a; }
  .body { padding:40px 36px; }
  h1 { margin:0 0 8px; font-size:26px; font-weight:700; color:#f8fafc; letter-spacing:-0.5px; }
  h2 { margin:0 0 24px; font-size:16px; font-weight:400; color:#94a3b8; }
  .meta { background:#0f172a; border-radius:12px; padding:20px 24px; margin:24px 0; }
  .meta-row { display:flex; gap:12px; align-items:flex-start; margin-bottom:12px; }
  .meta-row:last-child { margin-bottom:0; }
  .meta-icon { font-size:18px; line-height:1; margin-top:2px; }
  .meta-text { font-size:14px; color:#cbd5e1; line-height:1.5; }
  .meta-label { font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
  .qr-section { text-align:center; padding:32px 0; }
  .qr-section img { width:180px; height:180px; border-radius:16px; background:#fff; padding:12px; }
  .qr-label { font-size:12px; color:#64748b; margin-top:12px; }
  .cta { display:inline-block; background:#f59e0b; color:#0f172a; font-weight:700; font-size:15px; padding:14px 32px; border-radius:10px; text-decoration:none; margin:8px 0; }
  .divider { height:1px; background:#334155; margin:28px 0; }
  .footer { padding:24px 36px; text-align:center; }
  .footer p { font-size:12px; color:#475569; margin:4px 0; }
  .footer a { color:#64748b; }
  .badge { display:inline-block; background:#f59e0b22; color:#f59e0b; font-size:12px; font-weight:600; padding:4px 10px; border-radius:6px; margin-bottom:16px; }
`;

function emailConfirmation({ attendee, event, tier, qrDataUri }) {
  return {
    subject: `You're registered — ${event.title}`,
    html: `<!DOCTYPE html><html><head><style>${styles}</style></head><body>
      <div class="wrap">
        ${event.banner_url ? `<img class="banner" src="${event.banner_url}" alt="${event.title}">` : ''}
        <div class="body">
          <div class="badge">Registration Confirmed ✓</div>
          <h1>${event.title}</h1>
          <h2>Hi ${attendee.first_name}, you're on the list.</h2>
          <div class="meta">
            <div class="meta-row">
              <div class="meta-icon">📅</div>
              <div class="meta-text"><div class="meta-label">Date &amp; Time</div>${formatDate(event.start_at, event.timezone)}</div>
            </div>
            <div class="meta-row">
              <div class="meta-icon">📍</div>
              <div class="meta-text"><div class="meta-label">Location</div>${event.location || 'Online / See event page'}</div>
            </div>
            ${tier ? `<div class="meta-row">
              <div class="meta-icon">🎟</div>
              <div class="meta-text"><div class="meta-label">Ticket Type</div>${tier.name}</div>
            </div>` : ''}
          </div>
          <div class="qr-section">
            <img src="${qrDataUri}" alt="Your QR Code">
            <div class="qr-label">Show this QR code at check-in</div>
          </div>
          <div class="divider"></div>
          <p style="text-align:center;"><a href="${BASE_URL}/eventflow/${event.slug}" class="cta">View Event Details →</a></p>
        </div>
        <div class="footer">
          <p>You registered for <strong>${event.title}</strong></p>
          <p style="margin-top:8px;"><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a></p>
        </div>
      </div>
    </body></html>`,
  };
}

function emailReminder7d({ attendee, event, tier, qrDataUri }) {
  return {
    subject: `One week away — ${event.title}`,
    html: `<!DOCTYPE html><html><head><style>${styles}</style></head><body>
      <div class="wrap">
        ${event.banner_url ? `<img class="banner" src="${event.banner_url}" alt="${event.title}">` : ''}
        <div class="body">
          <div class="badge">7 Days to Go</div>
          <h1>${event.title}</h1>
          <h2>Hi ${attendee.first_name}, your event is coming up.</h2>
          <div class="meta">
            <div class="meta-row">
              <div class="meta-icon">📅</div>
              <div class="meta-text"><div class="meta-label">Date &amp; Time</div>${formatDate(event.start_at, event.timezone)}</div>
            </div>
            <div class="meta-row">
              <div class="meta-icon">📍</div>
              <div class="meta-text"><div class="meta-label">Location</div>${event.location || 'Online / See event page'}</div>
            </div>
          </div>
          <div class="qr-section">
            <img src="${qrDataUri}" alt="Your QR Code">
            <div class="qr-label">Your check-in QR code — save it now</div>
          </div>
          <div class="divider"></div>
          <p style="text-align:center;"><a href="${BASE_URL}/eventflow/${event.slug}" class="cta">View Event Details →</a></p>
        </div>
        <div class="footer">
          <p><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a></p>
        </div>
      </div>
    </body></html>`,
  };
}

function emailReminder1d({ attendee, event, tier, qrDataUri }) {
  return {
    subject: `Tomorrow! — ${event.title}`,
    html: `<!DOCTYPE html><html><head><style>${styles}</style></head><body>
      <div class="wrap">
        ${event.banner_url ? `<img class="banner" src="${event.banner_url}" alt="${event.title}">` : ''}
        <div class="body">
          <div class="badge">Tomorrow</div>
          <h1>${event.title}</h1>
          <h2>Hi ${attendee.first_name}, see you tomorrow.</h2>
          <div class="meta">
            <div class="meta-row">
              <div class="meta-icon">📅</div>
              <div class="meta-text"><div class="meta-label">Date &amp; Time</div>${formatDate(event.start_at, event.timezone)}</div>
            </div>
            <div class="meta-row">
              <div class="meta-icon">📍</div>
              <div class="meta-text"><div class="meta-label">Location</div>${event.location || 'Online / See event page'}</div>
            </div>
          </div>
          <div class="qr-section">
            <img src="${qrDataUri}" alt="Your QR Code">
            <div class="qr-label">Show this at the entrance for fast check-in</div>
          </div>
        </div>
        <div class="footer">
          <p><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a></p>
        </div>
      </div>
    </body></html>`,
  };
}

function emailDoorsOpen({ attendee, event, qrDataUri }) {
  return {
    subject: `Doors are open — ${event.title}`,
    html: `<!DOCTYPE html><html><head><style>${styles}</style></head><body>
      <div class="wrap">
        <div class="body">
          <div class="badge" style="background:#22c55e22;color:#22c55e;">Happening Now 🟢</div>
          <h1>${event.title}</h1>
          <h2>The doors are open, ${attendee.first_name}. We're waiting for you.</h2>
          <div class="meta">
            <div class="meta-row">
              <div class="meta-icon">📍</div>
              <div class="meta-text"><div class="meta-label">Location</div>${event.location || 'See event page'}</div>
            </div>
          </div>
          <div class="qr-section">
            <img src="${qrDataUri}" alt="Your QR Code">
            <div class="qr-label">Your check-in QR code</div>
          </div>
          <p style="text-align:center;"><a href="${BASE_URL}/eventflow/${event.slug}" class="cta">Event Page →</a></p>
        </div>
      </div>
    </body></html>`,
  };
}

function emailPostEvent({ attendee, event }) {
  return {
    subject: `Thank you for attending ${event.title}`,
    html: `<!DOCTYPE html><html><head><style>${styles}</style></head><body>
      <div class="wrap">
        ${event.banner_url ? `<img class="banner" src="${event.banner_url}" alt="${event.title}">` : ''}
        <div class="body">
          <div class="badge" style="background:#8b5cf622;color:#8b5cf6;">Event Complete</div>
          <h1>Thank you, ${attendee.first_name}.</h1>
          <h2>It was great having you at ${event.title}.</h2>
          <p style="color:#94a3b8;font-size:15px;line-height:1.6;">
            We hope you found it valuable. If you have a moment, we'd love to hear your thoughts.
          </p>
          <div class="divider"></div>
          <p style="text-align:center;"><a href="${BASE_URL}/eventflow/${event.slug}" class="cta">View Event Page →</a></p>
        </div>
        <div class="footer">
          <p>Powered by EventFlow</p>
          <p><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a></p>
        </div>
      </div>
    </body></html>`,
  };
}

const TEMPLATE_MAP = {
  confirmation:  emailConfirmation,
  reminder_7d:   emailReminder7d,
  reminder_1d:   emailReminder1d,
  doors_open:    emailDoorsOpen,
  post_event_1d: emailPostEvent,
};

function getTemplate(type) {
  return TEMPLATE_MAP[type] || null;
}

module.exports = { getTemplate, formatDate };
