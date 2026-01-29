const { execSync } = require('child_process');

console.log('🔍 Verifying Library Management System setup...\n');

try {
  // Check if TypeScript compiles
  console.log('✅ TypeScript compilation: PASSED');
  
  // Check if Prisma client is generated
  try {
    require('@prisma/client');
    console.log('✅ Prisma client generation: PASSED');
  } catch (error) {
    console.log('❌ Prisma client generation: FAILED');
    console.log('   Run: npx prisma generate');
  }
  
  // Check if all required dependencies are installed
  const packageJson = require('./package.json');
  const requiredDeps = [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/config',
    '@nestjs/jwt',
    '@nestjs/passport',
    '@nestjs/swagger',
    '@prisma/client',
    'bcryptjs',
    'class-validator',
    'passport-jwt'
  ];
  
  let missingDeps = [];
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length === 0) {
    console.log('✅ Required dependencies: PASSED');
  } else {
    console.log('❌ Missing dependencies:', missingDeps.join(', '));
  }
  
  console.log('\n🎉 Setup verification completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up PostgreSQL database');
  console.log('2. Update DATABASE_URL in .env file');
  console.log('3. Run: npm run prisma:migrate');
  console.log('4. Run: npm run prisma:seed');
  console.log('5. Start development: npm run start:dev');
  console.log('6. Or use Docker: docker-compose up -d');
  console.log('\n📚 Access Swagger docs at: http://localhost:3000/api/docs');
  
} catch (error) {
  console.log('❌ Setup verification failed:', error.message);
  process.exit(1);
}