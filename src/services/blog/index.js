import { ApiError } from '../../utils/ApiError.js';
import * as repo from '../../repositories/blog.repository.js';

const withUniqueSlugError = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (error.code === 'P2002') throw ApiError.conflict('Blog slug already exists.');
    throw error;
  }
};

export const createBlog = (payload) => withUniqueSlugError(() => repo.create(payload));
export const listAdminBlogs = (query) => repo.listAdmin(query);
export const listPublicBlogs = (query) => repo.listPublic(query);

export const getAdminBlog = async (id) => {
  const blog = await repo.findById(id);
  if (!blog) throw ApiError.notFound('Blog not found.');
  return blog;
};

export const getPublicBlog = async (slug) => {
  const blog = await repo.findPublicBySlug(slug);
  if (!blog) throw ApiError.notFound('Blog not found.');
  return blog;
};

export const updateBlog = async (id, payload) => {
  await getAdminBlog(id);
  return withUniqueSlugError(() => repo.update(id, payload));
};

export const deleteBlog = async (id) => {
  await getAdminBlog(id);
  await repo.softDelete(id);
  return { id };
};
