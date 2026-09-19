import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as service from '../services/blog/index.js';

const ok = (res, message, data, statusCode = 200) => sendSuccess(res, { statusCode, message, data });

export const createBlog = asyncHandler(async (req, res) => ok(res, 'Blog created.', await service.createBlog(req.body), 201));
export const listAdminBlogs = asyncHandler(async (req, res) => ok(res, 'Blogs retrieved.', await service.listAdminBlogs(req.query)));
export const getAdminBlog = asyncHandler(async (req, res) => ok(res, 'Blog retrieved.', await service.getAdminBlog(req.params.blogId)));
export const updateBlog = asyncHandler(async (req, res) => ok(res, 'Blog updated.', await service.updateBlog(req.params.blogId, req.body)));
export const deleteBlog = asyncHandler(async (req, res) => ok(res, 'Blog deleted.', await service.deleteBlog(req.params.blogId)));
export const listPublicBlogs = asyncHandler(async (req, res) => ok(res, 'Active blogs retrieved.', await service.listPublicBlogs(req.query)));
export const getPublicBlog = asyncHandler(async (req, res) => ok(res, 'Blog retrieved.', await service.getPublicBlog(req.params.slug)));
