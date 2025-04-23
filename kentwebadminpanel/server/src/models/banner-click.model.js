import { DataTypes } from 'sequelize';
import sequelize from '../db/connection.js';
import Banner from './banner.model.js';

const BannerClick = sequelize.define('banner_click', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bannerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Banner,
      key: 'id'
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Anonimleştirilmiş IP adresi'
  },
  referrer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      country: null,
      city: null
    }
  },
  deviceType: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'unknown',
    validate: {
      isIn: [['desktop', 'mobile', 'tablet', 'unknown']]
    }
  }
}, {
  tableName: 'banner_clicks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// İlişkileri tanımlayalım
Banner.hasMany(BannerClick, { foreignKey: 'bannerId', as: 'clicks' });
BannerClick.belongsTo(Banner, { foreignKey: 'bannerId' });

export default BannerClick; 