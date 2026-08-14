// =============================================================================
//   Service Category catalog — super-admin managed
// =============================================================================
//
// A ServiceCategory (e.g. "Immigration Services") optionally owns a list of
// child Services (e.g. "Express Entry"). Create takes both in one payload;
// after that, categories and their child services are edited independently.
// =============================================================================

import { ApiError } from '../../utils/ApiError.js';
import * as categoryRepo from '../../repositories/serviceCategory.repository.js';

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// -----------------------------------------------------------------------------
//   Category
// -----------------------------------------------------------------------------

export const createCategory = async ({ name, description, services }) => {
  return categoryRepo.createCategoryWithServices({
    name,
    slug: slugify(name),
    description,
    services,
  });
};

export const listCategories = async () => {
  return categoryRepo.listCategories();
};

export const getCategory = async (id) => {
  const category = await categoryRepo.findCategoryById(id);
  if (!category) {
    throw ApiError.notFound('Service category not found.');
  }
  return category;
};

export const updateCategory = async (id, data) => {
  return categoryRepo.updateCategory(id, data);
};

export const deleteCategory = async (id) => {
  await categoryRepo.deleteCategory(id);
};

// -----------------------------------------------------------------------------
//   Child services
// -----------------------------------------------------------------------------

export const addService = async (categoryId, { name, description }) => {
  const category = await categoryRepo.findCategoryRef(categoryId);
  if (!category) {
    throw ApiError.notFound('Service category not found.');
  }
  return categoryRepo.addServiceToCategory({ categoryId, name, description });
};

export const updateService = async (serviceId, data) => {
  return categoryRepo.updateService(serviceId, data);
};

export const deleteService = async (serviceId) => {
  await categoryRepo.deleteService(serviceId);
};
