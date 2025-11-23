const userRepository = require('../repositories/userRepository');

async function seedAdmin() {
  try {
    console.log('Starting admin user seeding...\n');
    
    const admin = await userRepository.seedAdminUser();
    
    console.log('\n✓ Admin seeding completed successfully!');
    console.log('\n=== Admin Credentials ===');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@nimonspedia.com');
    console.log('=========================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
