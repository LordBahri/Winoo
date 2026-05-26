// Universal Links + App Clip configuration for iOS.
// Served at https://petid.app/.well-known/apple-app-site-association
// Apple expects Content-Type: application/json (no .json extension on the URL).

import { NextResponse } from 'next/server';

const TEAM_ID = process.env.APPLE_TEAM_ID ?? 'TEAMID';
const BUNDLE_ID = process.env.APPLE_BUNDLE_ID ?? 'com.petid.app';
const APP_CLIP_BUNDLE_ID = process.env.APPLE_APP_CLIP_BUNDLE_ID ?? 'com.petid.app.Clip';

export const dynamic = 'force-static';

export function GET() {
  const body = {
    applinks: {
      details: [
        {
          appIDs: [`${TEAM_ID}.${BUNDLE_ID}`],
          components: [
            { '/': '/t/*', comment: 'Public tag recovery URLs' },
            { '/': '/scan/*', comment: 'Legacy tag scan URLs' },
            { '/': '/pets/*', comment: 'Pet profile deep links' },
          ],
        },
      ],
    },
    // App Clip — instant pet recovery without App Store install
    appclips: {
      apps: [`${TEAM_ID}.${APP_CLIP_BUNDLE_ID}`],
    },
    // Legacy webcredentials (password autofill from Safari)
    webcredentials: {
      apps: [`${TEAM_ID}.${BUNDLE_ID}`],
    },
  };

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=3600',
    },
  });
}
