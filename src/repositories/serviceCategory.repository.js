import prisma from '../config/db.js';

const SERVICE_SELECT = {
  id: true,
  categoryId: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

const CATEGORY_WITH_SERVICES_SELECT = {
  ...CATEGORY_SELECT,
  services: { select: SERVICE_SELECT, orderBy: { createdAt: 'asc' } },
};

// Nested create — category + its child services in one atomic Prisma write.
export const createCategoryWithServices = async ({ name, slug, description, services }) => {
  return prisma.serviceCategory.create({
    data: {
      name,
      slug,
      description,
      services: { create: services },
    },
    select: CATEGORY_WITH_SERVICES_SELECT,
  });
};

export const listCategories = async () => {
  return prisma.serviceCategory.findMany({
    orderBy: { createdAt: 'asc' },
    select: CATEGORY_WITH_SERVICES_SELECT,
  });
};

export const findCategoryById = async (id) => {
  return prisma.serviceCategory.findUnique({
    where: { id },
    select: CATEGORY_WITH_SERVICES_SELECT,
  });
};

// Lightweight existence check — used before writes that only need the FK.
export const findCategoryRef = async (id) => {
  return prisma.serviceCategory.findUnique({ where: { id }, select: { id: true } });
};

// Which of these ids actually exist — used to validate a vendor's KYC
// service-category selections before linking them.
export const findExistingCategoryIds = async (ids) => {
  const rows = await prisma.serviceCategory.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  return rows.map((row) => row.id);
};

export const updateCategory = async (id, data) => {
  return prisma.serviceCategory.update({ where: { id }, data, select: CATEGORY_SELECT });
};

export const deleteCategory = async (id) => {
  return prisma.serviceCategory.delete({ where: { id } });
};

export const addServiceToCategory = async ({ categoryId, name, description }) => {
  return prisma.service.create({
    data: { categoryId, name, description },
    select: SERVICE_SELECT,
  });
};

export const updateService = async (id, data) => {
  return prisma.service.update({ where: { id }, data, select: SERVICE_SELECT });
};

export const deleteService = async (id) => {
  return prisma.service.delete({ where: { id } });
};
