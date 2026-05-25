import { NextResponse } from 'next/server';

const BUNDLE_ID = 'ph.reviewnatin.app';

const PATHS = [
  '/subscribe*',
  '/checkout*',
  '/barkada*',
  '/exam-calendar*',
  '/calendar*',
  '/tutor*',
  '/ai-tutor*',
  '/changelog*',
  '/updates*',
  '/study*',
  '/aral*',
  '/pasapath*',
  '/mistakes*',
  '/flashcards*',
];

export function GET() {
  const teamId = process.env.APPLE_TEAM_ID?.trim() || 'TEAMID';
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: `${teamId}.${BUNDLE_ID}`,
          paths: PATHS,
        },
      ],
    },
  };

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
