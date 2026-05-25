import { NextResponse } from 'next/server';

const PACKAGE_NAME = 'ph.reviewnatin.app';

export function GET() {
  const sha256 =
    process.env.ANDROID_SHA256_FINGERPRINT?.trim() || 'REPLACE_WITH_PLAY_SIGNING_SHA256';

  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: [sha256],
      },
    },
  ];

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
