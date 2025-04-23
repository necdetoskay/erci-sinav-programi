import { User, Role, UserRole, sequelize } from '../models/index.js';
import logger from '../utils/logger.js';

const setupAdmin = async (userEmail) => {
  try {
    // Transaction başlat
    await sequelize.transaction(async (t) => {
      // Admin rolünü kontrol et veya oluştur
      const [adminRole] = await Role.findOrCreate({
        where: { name: 'admin' },
        defaults: {
          description: 'Sistem yöneticisi',
          is_system_role: true
        },
        transaction: t
      });

      // Kullanıcıyı bul
      const user = await User.findOne({
        where: { email: userEmail },
        transaction: t
      });

      if (!user) {
        throw new Error(`Kullanıcı bulunamadı: ${userEmail}`);
      }

      // Kullanıcı-rol ilişkisini kontrol et
      const existingRole = await UserRole.findOne({
        where: {
          user_id: user.id,
          role_id: adminRole.id
        },
        transaction: t
      });

      if (!existingRole) {
        // Admin rolünü ata
        await UserRole.create({
          user_id: user.id,
          role_id: adminRole.id
        }, { transaction: t });
        
        logger.info(`Admin rolü başarıyla atandı: ${userEmail}`);
      } else {
        logger.info(`Kullanıcı zaten admin rolüne sahip: ${userEmail}`);
      }
    });

    logger.info('Admin kurulumu başarıyla tamamlandı');
  } catch (error) {
    logger.error('Admin kurulumu sırasında hata:', error);
    throw error;
  }
};

// Script'i çalıştır
if (process.argv[2]) {
  setupAdmin(process.argv[2])
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  logger.error('Kullanıcı email adresi belirtilmedi');
  process.exit(1);
} 