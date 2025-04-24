import { BannerGroup, Banner } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * Get all banner groups
 */
export const getAllBannerGroups = catchAsync(async (req, res, next) => {
  const bannerGroups = await BannerGroup.findAll({
    include: [{
      model: Banner,
      attributes: ['id']
    }],
    order: [['created_at', 'DESC']]
  });

  // Compute the bannersCount for each group
  const bannerGroupsWithCount = bannerGroups.map(group => {
    const plainGroup = group.toJSON();
    plainGroup.bannersCount = plainGroup.banners ? plainGroup.banners.length : 0;
    delete plainGroup.banners;
    return plainGroup;
  });

  res.status(200).json(bannerGroupsWithCount);
});

/**
 * Get a specific banner group by ID
 */
export const getBannerGroup = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const bannerGroup = await BannerGroup.findByPk(id, {
    include: [{
      model: Banner,
      attributes: ['id']
    }]
  });

  if (!bannerGroup) {
    return next(new AppError('Banner grubu bulunamadı', 404));
  }

  const plainGroup = bannerGroup.toJSON();
  plainGroup.bannersCount = plainGroup.banners ? plainGroup.banners.length : 0;
  delete plainGroup.banners;

  res.status(200).json(plainGroup);
});

/**
 * Get all banners for a specific group
 */
export const getBannersByGroup = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const bannerGroup = await BannerGroup.findByPk(id);
  if (!bannerGroup) {
    return next(new AppError('Banner grubu bulunamadı', 404));
  }

  const banners = await Banner.findAll({
    where: { groupId: id },
    order: [['order', 'ASC']]
  });

  res.status(200).json(banners);
});

/**
 * Create a new banner group
 */
export const createBannerGroup = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    defaultDimensions,
    defaultSettings
  } = req.body;

  if (!name) {
    return next(new AppError('Grup adı gereklidir', 400));
  }

  const newBannerGroup = await BannerGroup.create({
    name,
    description,
    defaultDimensions: defaultDimensions || undefined,
    defaultSettings: defaultSettings || undefined
  });

  res.status(201).json(newBannerGroup);
});

/**
 * Update an existing banner group
 */
export const updateBannerGroup = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    description,
    defaultDimensions,
    defaultSettings
  } = req.body;

  const bannerGroup = await BannerGroup.findByPk(id);
  if (!bannerGroup) {
    return next(new AppError('Banner grubu bulunamadı', 404));
  }

  // Update fields
  if (name) bannerGroup.name = name;
  if (description !== undefined) bannerGroup.description = description;
  if (defaultDimensions) bannerGroup.defaultDimensions = defaultDimensions;
  if (defaultSettings) bannerGroup.defaultSettings = defaultSettings;

  await bannerGroup.save();

  res.status(200).json(bannerGroup);
});

/**
 * Delete a banner group
 */
export const deleteBannerGroup = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const bannerGroup = await BannerGroup.findByPk(id);
  if (!bannerGroup) {
    return next(new AppError('Banner grubu bulunamadı', 404));
  }

  // Check if there are any banners associated with this group
  const bannerCount = await Banner.count({ where: { groupId: id } });
  if (bannerCount > 0) {
    return next(new AppError('Bu gruba ait bannerlar bulunmaktadır. Önce onları silin veya başka bir gruba taşıyın.', 400));
  }

  await bannerGroup.destroy();

  res.status(204).send();
}); 