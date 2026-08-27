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

export const createCategory = async ({ name, description, isActive, services }) => {
  return categoryRepo.createCategoryWithServices({
    name,
    slug: slugify(name),
    description,
    isActive,
    services,
  });
};

export const listCategories = async () => {
  return categoryRepo.listCategories();
};

export const listPublicCategories = async () => {
  return categoryRepo.listActiveCategories();
};

export const listPublicServicesByCategory = (categoryId) => categoryRepo.listActiveServicesByCategory(categoryId);

export const getCategory = async (id) => {
  const category = await categoryRepo.findCategoryById(id);
  if (!category) {
    throw ApiError.notFound('Service category not found.');
  }
  return category;
};

export const updateCategory = async (id, data) => {
  const category = await categoryRepo.findCategoryRef(id);
  if (!category) {
    throw ApiError.notFound('Service category not found.');
  }

  const { services = [], ...categoryFields } = data;
  const serviceIds = services.flatMap((service) => (service.id ? [service.id] : []));
  if (serviceIds.length > 0) {
    const existingIds = await categoryRepo.findServiceIdsInCategory(id, serviceIds);
    const invalidIds = serviceIds.filter((serviceId) => !existingIds.includes(serviceId));
    if (invalidIds.length > 0) {
      throw ApiError.badRequest('Every updated service must belong to this category.', {
        invalidServiceIds: invalidIds,
      });
    }
  }

  const categoryData = {
    ...categoryFields,
    ...(categoryFields.name && { slug: slugify(categoryFields.name) }),
  };

  return categoryRepo.updateCategoryWithServices({ id, categoryData, services });
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
