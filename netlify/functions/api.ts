import type { Handler } from '@netlify/functions';
import apiHandler from '../../api/proxy.ts';

const buildRequest = (eventBody: string | null, headers: Record<string, string>) => {
  const normalizedHeaders = new Headers();
  Object.entries(headers || {}).forEach(([key, value]) => {
    if (typeof value === 'string') {
      normalizedHeaders.append(key, value);
    }
  });

  return new Request('http://localhost/api', {
    method: 'POST',
    headers: normalizedHeaders,
    body: eventBody,
  });
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const decodedBody = event.body
    ? event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body
    : null;

  try {
    const request = buildRequest(decodedBody, event.headers as Record<string, string>);
    const response = await apiHandler(request);
    const text = await response.text();

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: text,
    };
  } catch (error: any) {
    console.error('Netlify function error', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error?.message ?? 'Internal Server Error' }),
    };
  }
};
