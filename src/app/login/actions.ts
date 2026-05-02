'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { setSessionUserId, clearSession } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const rawEmail = formData.get('email')?.toString();
  if (!rawEmail) {
    throw new Error('Email is required');
  }

  const email = rawEmail.trim().toLowerCase();

  let user = await prisma.user.findUnique({
    where: { email },
  });

  const isNew = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
      },
    });
    console.log(`[AUTH] Created new user: ${email} (${user.id})`);
  } else {
    console.log(`[AUTH] User logged in: ${email} (${user.id})`);
  }

  await setSessionUserId(user.id);

  // Route new users or un-onboarded users to setup
  if (isNew || !user.onboardingCompleted) {
    redirect('/setup');
  }

  redirect('/crm');
}

export async function logoutAction() {
  await clearSession();
  redirect('/login');
}

