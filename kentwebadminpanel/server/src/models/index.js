import User from './user.model.js';
import Role from './role.model.js';
import Permission from './permission.model.js';
import Banner from './banner.model.js';
import BannerClick from './banner-click.model.js';
import sequelize from '../db/connection.js';

// Define model relationships

// User can have many roles through user_role junction table
const UserRole = sequelize.define('user_role', {}, { timestamps: true });
User.belongsToMany(Role, { through: UserRole });
Role.belongsToMany(User, { through: UserRole });

// Role can have many permissions through role_permission junction table
const RolePermission = sequelize.define('role_permission', {}, { timestamps: true });
Role.belongsToMany(Permission, { through: RolePermission });
Permission.belongsToMany(Role, { through: RolePermission });

// User can have direct permissions through user_permission junction table
const UserPermission = sequelize.define('user_permission', {}, { timestamps: true });
User.belongsToMany(Permission, { through: UserPermission });
Permission.belongsToMany(User, { through: UserPermission });

// Banner ve BannerClick ilişkisi banner-click.model.js'de tanımlandı

// Export all models and relationships
export {
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  UserPermission,
  Banner,
  BannerClick,
  sequelize
}; 