import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';

const Banner = sequelize.define('banner', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  targetUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      altText: '',
      animationType: 'fade',
      backgroundColor: '#000000',
      seo: {
        title: '',
        description: ''
      },
      dimensions: {
        width: 0,
        height: 0,
        aspectRatio: '16:9'
      }
    }
  }
}, {
  tableName: 'banners',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Banner; 