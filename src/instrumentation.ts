export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SENTRY_DSN) {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      enabled: true,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
        databaseQueryData: false,
        stackFrameVariables: false,
        frameContextLines: 0,
        genAI: { inputs: false, outputs: false },
        mcp: { inputs: false, outputs: false },
      },
      includeServerName: false,
      tracesSampleRate: 0,
      defaultIntegrations: false,
      beforeSend(event) {
        // Only technical server errors; never forward request headers, URL, body or users.
        delete event.request;
        delete event.user;
        delete event.breadcrumbs;
        delete event.extra;
        return event;
      },
    });
  }
}

export async function onRequestError() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SENTRY_DSN) {
    const { reportError } = await import('./server/observability');
    await reportError(new Error('SERVER_REQUEST_ERROR'), 'server');
  }
}
