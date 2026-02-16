/// <reference types="node" />

import { PrismaClient, UserRole, BookStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');


  const librarianPassword = await bcrypt.hash('librarian123', 10);
  const librarian = await prisma.user.upsert({
    where: { email: 'librarian@library.com' },
    update: {},
    create: {
      email: 'librarian@library.com',
      password: librarianPassword,
      firstName: 'John',
      lastName: 'Librarian',
      role: UserRole.LIBRARIAN,
    },
  });


  const memberPassword = await bcrypt.hash('member123', 10);
  const member = await prisma.user.upsert({
    where: { email: 'member@library.com' },
    update: {},
    create: {
      email: 'member@library.com',
      password: memberPassword,
      firstName: 'Jane',
      lastName: 'Member',
      role: UserRole.MEMBER,
    },
  });


  const authors = await Promise.all([
    prisma.author.upsert({
      where: { id: 'author-1' },
      update: {},
      create: {
        id: 'author-1',
        name: 'Robert C. Martin',
        biography: 'Software engineer and author, known for Clean Code principles',
      },
    }),
    prisma.author.upsert({
      where: { id: 'author-2' },
      update: {},
      create: {
        id: 'author-2',
        name: 'Martin Fowler',
        biography: 'British software developer, author and international speaker',
      },
    }),
    prisma.author.upsert({
      where: { id: 'author-3' },
      update: {},
      create: {
        id: 'author-3',
        name: 'Eric Evans',
        biography: 'Software design consultant and author of Domain-Driven Design',
      },
    }),
    prisma.author.upsert({
      where: { id: 'author-4' },
      update: {},
      create: {
        id: 'author-4',
        name: 'J.K. Rowling',
        biography: 'British author, best known for the Harry Potter series',
      },
    }),
  ]);


  const books = [
    {
      isbn: '978-0132350884',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      description: 'A handbook of agile software craftsmanship',
      totalCopies: 5,
      availableCopies: 5,
      publishedYear: 2008,
      authorIds: [authors[0].id],
    },
    {
      isbn: '978-0201633610',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      description: 'Classic book on software design patterns',
      totalCopies: 3,
      availableCopies: 3,
      publishedYear: 1994,
      authorIds: [authors[1].id],
    },
    {
      isbn: '978-0321125217',
      title: 'Domain-Driven Design: Tackling Complexity in the Heart of Software',
      description: 'Comprehensive guide to domain-driven design',
      totalCopies: 2,
      availableCopies: 2,
      publishedYear: 2003,
      authorIds: [authors[2].id],
    },
    {
      isbn: '978-0439708180',
      title: 'Harry Potter and the Sorcerer\'s Stone',
      description: 'First book in the Harry Potter series',
      totalCopies: 10,
      availableCopies: 8,
      publishedYear: 1997,
      authorIds: [authors[3].id],
    },
  ];

  for (const bookData of books) {
    const { authorIds, ...bookInfo } = bookData;

    const book = await prisma.book.upsert({
      where: { isbn: bookData.isbn },
      update: {},
      create: bookInfo,
    });


    for (const authorId of authorIds) {
      await prisma.bookAuthor.upsert({
        where: {
          bookId_authorId: {
            bookId: book.id,
            authorId: authorId,
          },
        },
        update: {},
        create: {
          bookId: book.id,
          authorId: authorId,
        },
      });
    }
  }


  const fineConfig = await prisma.fineConfiguration.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      finePerDay: 10.00,
      maxFineAmount: 1000.00,
      gracePeriodDays: 1,
      isActive: true,
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('📚 Created users:');
  console.log('   - Librarian: librarian@library.com / librarian123');
  console.log('   - Member: member@library.com / member123');
  console.log('📖 Created sample books and authors');
  console.log('💰 Fine Configuration:');
  console.log(`   - Fine per day: ₹${fineConfig.finePerDay}`);
  console.log(`   - Maximum fine: ₹${fineConfig.maxFineAmount}`);
  console.log(`   - Grace period: ${fineConfig.gracePeriodDays} day(s)`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });