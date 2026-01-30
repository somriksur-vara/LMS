const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectDatabase() {
  try {
    console.log('🔍 Database Inspection Report\n');
    
    // Count records in each table
    const userCount = await prisma.user.count();
    const bookCount = await prisma.book.count();
    const authorCount = await prisma.author.count();
    const categoryCount = await prisma.category.count();
    const issueCount = await prisma.issue.count();
    const auditLogCount = await prisma.auditLog.count();
    
    console.log('📊 Record Counts:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Books: ${bookCount}`);
    console.log(`   Authors: ${authorCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Issues: ${issueCount}`);
    console.log(`   Audit Logs: ${auditLogCount}\n`);
    
    // Show sample data
    console.log('👥 Users:');
    const users = await prisma.user.findMany({
      select: { email: true, firstName: true, lastName: true, role: true }
    });
    console.table(users);
    
    console.log('📚 Books:');
    const books = await prisma.book.findMany({
      select: { 
        title: true, 
        isbn: true, 
        totalCopies: true, 
        availableCopies: true,
        status: true 
      }
    });
    console.table(books);
    
    console.log('📖 Categories:');
    const categories = await prisma.category.findMany({
      select: { name: true, description: true }
    });
    console.table(categories);
    
    console.log('✍️ Authors:');
    const authors = await prisma.author.findMany({
      select: { name: true, biography: true }
    });
    console.table(authors);
    
  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDatabase();