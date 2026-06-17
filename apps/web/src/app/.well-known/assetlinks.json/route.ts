// Android App Links verification.
// Served at https://petid.app/.well-known/assetlinks.json
// Lets Android open /t/* URLs directly in the app (no Chrome chooser).
// Get the SHA-256 fingerprint with:
//   keytool -list -v -keystore upload-keystore.jks -alias upload | grep SHA256

import { NextResponse } from 'next/server';

const PACKAGE_NAME = process.env.ANDROID_PACKAGE_NAME ?? 'com.petid.app';
const SHA256_FINGERPRINTS = (process.env.ANDROID_SHA256_FINGERPRINTS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const dynamic = 'force-static';

export function GET() {
  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: SHA256_FINGERPRINTS.length
          ? SHA256_FINGERPRINTS
          : ['REPLACE_WITH_YOUR_APP_SIGNING_CERT_SHA256'],
      },
    },
  ];

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=3600',
    },
  });
}
