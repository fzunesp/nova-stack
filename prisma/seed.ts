import prisma from '../src/lib/db';
import { faker } from '@faker-js/faker';
import { DEFAULT_DEV_USER_ID } from '../src/lib/auth';

async function main() {
  console.log('Starting deterministic seed...');
  
  // Set deterministic seed
  faker.seed(12345);

  // Clear existing data safely (Dev only)
  console.log('Clearing existing data...');
  await prisma.invoice.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.task.deleteMany();
  // Not deleting user, we will upsert it

  // Step 1: User
  console.log('Creating/Upserting dev user...');
  const devUserId = DEFAULT_DEV_USER_ID;
  const user = await prisma.user.upsert({
    where: { id: devUserId },
    update: { onboardingCompleted: true },
    create: {
      id: devUserId,
      email: 'admin@nova-stack.local',
      name: 'Admin User',
      displayName: 'Admin User',
      companyName: 'Nova Stack HQ',
      onboardingCompleted: true,
    }
  });

  console.log(`Current userId: ${user.id}`);

  let totalContacts = 0;
  let totalDeals = 0;
  let totalInvoices = 0;
  let totalTasks = 0;

  console.log(`\nSeeding data for ${user.email}...`);
  
  // Step 2: Contacts (12-20)
  const numContacts = faker.number.int({ min: 12, max: 20 });
  const userContacts = [];
  
  for (let i = 0; i < numContacts; i++) {
    const contact = await prisma.contact.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number({ style: 'national' }),
        companyName: faker.company.name(),
        notes: faker.lorem.paragraph(),
        createdAt: faker.date.past({ years: 1 }),
        userId: user.id,
      }
    });
    userContacts.push(contact);
    totalContacts++;
  }

  // Step 3: Deals (15-25)
  const numDeals = faker.number.int({ min: 15, max: 25 });
  const userDeals = [];
  const stages = ['lead', 'contacted', 'quoted', 'won', 'lost'];
  
  for (let i = 0; i < numDeals; i++) {
    const contact = faker.helpers.arrayElement(userContacts);
    const stage = faker.helpers.arrayElement(stages);
    
    let expectedCloseDate = null;
    // Future date for active deals
    if (stage !== 'won' && stage !== 'lost') {
      expectedCloseDate = faker.date.future({ years: 0.5 });
    }

    const deal = await prisma.deal.create({
      data: {
        title: `${faker.commerce.productAdjective()} ${faker.commerce.product()} Project`,
        value: faker.number.int({ min: 100, max: 15000 }),
        stage,
        expectedCloseDate,
        createdAt: faker.date.past({ years: 0.5 }),
        contactId: contact.id,
        userId: user.id,
        assignedToId: user.id,
      }
    });
    userDeals.push(deal);
    totalDeals++;
  }

  // Step 4: Invoices (10-15)
  const numInvoices = faker.number.int({ min: 10, max: 15 });
  const invoiceStatuses = ['draft', 'sent', 'paid'];
  
  for (let i = 0; i < numInvoices; i++) {
    const isLinkedToDeal = i < numInvoices / 2 || faker.datatype.boolean(); // Ensure at least 50%
    const status = faker.helpers.arrayElement(invoiceStatuses);
    
    let amount = faker.number.float({ min: 500, max: 10000, fractionDigits: 2 });
    let title = `Invoice for ${faker.company.name()}`;
    let dealId = null;

    if (isLinkedToDeal && userDeals.length > 0) {
      const deal = faker.helpers.arrayElement(userDeals);
      amount = deal.value || amount;
      title = `Invoice for ${deal.title}`;
      dealId = deal.id;
    }

    let dueDate = null;
    if (status !== 'paid') {
      dueDate = faker.date.future({ years: 0.2 }); // Future for unpaid
    }

    await prisma.invoice.create({
      data: {
        title,
        amount,
        status,
        issuedDate: faker.date.recent({ days: 30 }),
        dueDate,
        paidAt: status === 'paid' ? faker.date.recent({ days: 10 }) : null,
        dealId,
        userId: user.id,
      }
    });
    totalInvoices++;
  }

  // Step 5: Tasks (12-20)
  const numTasks = faker.number.int({ min: 12, max: 20 });
  const taskStatuses = ['todo', 'in_progress', 'done'];

  for (let i = 0; i < numTasks; i++) {
    const isFuture = faker.datatype.boolean();
    
    await prisma.task.create({
      data: {
        title: `${faker.hacker.verb()} ${faker.hacker.noun()}`,
        description: faker.lorem.sentences(2),
        status: faker.helpers.arrayElement(taskStatuses),
        dueDate: isFuture ? faker.date.future({ years: 0.2 }) : faker.date.past({ years: 0.1 }),
        createdAt: faker.date.past({ years: 0.2 }),
        userId: user.id,
        assignedToId: user.id,
      }
    });
    totalTasks++;
  }

  console.log('\n=============================');
  console.log('Seed Summary:');
  console.log(`Current userId matched: ${user.id === DEFAULT_DEV_USER_ID}`);
  console.log(`Contacts fetched/created: ${totalContacts}`);
  console.log(`Deals created:    ${totalDeals}`);
  console.log(`Invoices created: ${totalInvoices}`);
  console.log(`Tasks created:    ${totalTasks}`);
  console.log('=============================\n');
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
