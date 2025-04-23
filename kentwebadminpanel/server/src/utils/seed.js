import { User, Role, Permission, sequelize } from '../models/index.js';
import logger from './logger.js';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

/**
 * Initialize database with default data
 */
export const seedDatabase = async () => {
  try {
    logger.info('Starting database seed...');
    
    // Create default permissions
    const permissions = await Permission.bulkCreate([
      { name: 'view_banners', resource: 'banners', action: 'read', description: 'View all banners' },
      { name: 'manage_banners', resource: 'banners', action: 'manage', description: 'Manage banners (create, update, delete)' },
      { name: 'view_users', resource: 'users', action: 'read', description: 'View all users' },
      { name: 'manage_users', resource: 'users', action: 'manage', description: 'Manage users (create, update, delete)' },
      { name: 'view_roles', resource: 'roles', action: 'read', description: 'View all roles' },
      { name: 'manage_roles', resource: 'roles', action: 'manage', description: 'Manage roles (create, update, delete)' },
    ], { ignoreDuplicates: true });
    
    logger.info(`Created ${permissions.length} permissions`);
    
    // Create default roles
    const adminRole = await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        description: 'Administrator with full access'
      }
    });
    
    const editorRole = await Role.findOrCreate({
      where: { name: 'editor' },
      defaults: {
        description: 'Editor with limited access'
      }
    });
    
    logger.info('Created default roles');
    
    // Assign permissions to roles
    if (adminRole[1]) { // If newly created
      await adminRole[0].setPermissions(await Permission.findAll());
      logger.info('Assigned all permissions to admin role');
    }
    
    if (editorRole[1]) { // If newly created
      const editorPermissions = await Permission.findAll({
        where: {
          name: ['view_banners', 'manage_banners']
        }
      });
      await editorRole[0].setPermissions(editorPermissions);
      logger.info('Assigned banner permissions to editor role');
    }
    
    // Create default admin user
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'password123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        first_name: 'Admin',
        last_name: 'User',
        password: hashedPassword,
        status: 'active',
        last_login: new Date()
      }
    });
    
    // Assign admin role to admin user
    if (adminUser[1]) { // If newly created
      await adminUser[0].setRoles([adminRole[0]]);
      logger.info('Created admin user and assigned admin role');
    }
    
    logger.info('Database seed completed successfully');
    return true;
  } catch (error) {
    logger.error('Database seed failed:', error);
    throw error;
  }
};

// Run directly if executed as script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  sequelize.sync()
    .then(() => seedDatabase())
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
} 