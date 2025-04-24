import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import {
  getAllBannerGroups,
  getBannerGroup,
  createBannerGroup,
  updateBannerGroup,
  deleteBannerGroup,
  getBannersByGroup
} from '../controllers/banner-group.controller.js';

const router = express.Router();

// Get all banner groups
router.get('/', protect, restrictTo('admin'), getAllBannerGroups);

// Get a specific banner group
router.get('/:id', protect, restrictTo('admin'), getBannerGroup);

// Get banners by group
router.get('/:id/banners', protect, restrictTo('admin'), getBannersByGroup);

// Create a new banner group
router.post('/', protect, restrictTo('admin'), createBannerGroup);

// Update a banner group
router.put('/:id', protect, restrictTo('admin'), updateBannerGroup);

// Delete a banner group
router.delete('/:id', protect, restrictTo('admin'), deleteBannerGroup);

export default router; 