import prisma from '../config/db.js';

export const create = (data) => prisma.blog.create({ data });
export const update = (id, data) => prisma.blog.update({ where: { id }, data });
export const findById = (id) => prisma.blog.findFirst({ where: { id, deletedAt: null } });
export const findPublicBySlug = (slug) => prisma.blog.findFirst({ where: { slug, isActive: true, deletedAt: null } });
export const softDelete = (id) => prisma.blog.update({ where: { id }, data: { deletedAt: new Date() } });

const list = async (where, { take, skip }) => {
  const [items, total] = await prisma.$transaction([
    prisma.blog.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.blog.count({ where }),
  ]);
  return { items, total, take, skip };
};

export const listAdmin = (query) => list({
  deletedAt: null,
  ...(query.category && { category: query.category }),
  ...(query.isActive !== undefined && { isActive: query.isActive }),
}, query);

export const listPublic = (query) => list({
  deletedAt: null,
  isActive: true,
  ...(query.category && { category: query.category }),
}, query);
