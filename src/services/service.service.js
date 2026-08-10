const { prisma } = require('../config/prisma');

exports.createCategory = async (payload) => {
  return prisma.serviceCategory.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      formSchema: payload.formSchema || {},
    },
  });
};

exports.listCategories = async () => prisma.serviceCategory.findMany({ where: { isActive: true } });
