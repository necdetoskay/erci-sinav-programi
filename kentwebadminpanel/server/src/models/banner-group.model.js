import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';

const BannerGroup = sequelize.define('banner_group', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  defaultDimensions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      width: 1920,
      height: 1080,
      aspectRatio: '16:9'
    }
  },
  defaultSettings: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      animationType: 'fade',
      backgroundColor: 'transparent',
      progressBar: {
        show: true,
        position: 'bottom',
        style: 'linear',
        color: 'primary',
        thickness: 3
      }
    }
  },
  bannersCount: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.banners ? this.banners.length : 0;
    },
    set() {
      throw new Error('Do not try to set the `bannersCount` value!');
    }
  }
}, {
  tableName: 'banner_groups',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default BannerGroup; 