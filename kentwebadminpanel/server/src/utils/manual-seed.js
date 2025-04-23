import { sequelize, User, Role } from '../models/index.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const createTestUser = async () => {
  try {
    console.log('Starting manual seed...');
    
    // Force synchronize the database
    await sequelize.sync({ force: true });
    console.log('Database synchronized');
    
    // Create admin role
    const adminRole = await Role.create({
      id: uuidv4(),
      name: 'admin',
      description: 'Administrator with full access'
    });
    console.log('Admin role created:', adminRole.id);
    
    // Create test user with pre-hashed password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      id: uuidv4(),
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      status: 'active',
      last_login: new Date()
    });
    console.log('Test user created:', user.id);
    
    // Add admin role to user
    await user.addRole(adminRole);
    console.log('Role assigned to user');
    
    console.log('Manual seed completed successfully');
    console.log('You can now log in with:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error in manual seed:', error);
    process.exit(1);
  }
};

// Run the seed function
createTestUser(); 