import prisma from '../src/lib/db';

async function main() {
  console.log('Starting dev reset...');

  const DEFAULT_DEV_USER_ID = 'dev_user_123';

  console.log(`Resetting onboarding for user: ${DEFAULT_DEV_USER_ID}`);

  try {
    await prisma.user.upsert({
      where: { id: DEFAULT_DEV_USER_ID },
      update: { onboardingCompleted: true },
      create: {
        id: DEFAULT_DEV_USER_ID,
        email: 'admin@nova-stack.local',
        name: 'Admin User',
        displayName: 'Admin User',
        companyName: 'Nova Stack HQ',
        onboardingCompleted: true,
      },
    });
    console.log('Onboarding reset successfully.');
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
