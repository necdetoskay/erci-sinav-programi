import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';

const Permission = sequelize.define('permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  action: {
    type: DataTypes.ENUM('create', 'read', 'update', 'delete', 'manage'),
    allowNull: false
  },
  is_system_permission: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  paranoid: true // Soft deletes
});

export default Permission; 