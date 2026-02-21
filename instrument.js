const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://28a2a4ce8edd90b3b6070b647920e451@o4510776818335744.ingest.us.sentry.io/4510905336528896',
  sendDefaultPii: true,
});
