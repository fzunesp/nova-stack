import { NextRequest, NextResponse } from 'next/server';
import { createSubmission } from '@/modules/intake/intake.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'name, email, and message are required' },
        { status: 400 }
      );
    }

    const submission = await createSubmission({ name, email, message });
    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error creating intake submission:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
