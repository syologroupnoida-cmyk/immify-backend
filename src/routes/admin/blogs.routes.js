import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { createBlogSchema, listAdminBlogsSchema, updateBlogSchema } from '../../validators/blog.validator.js';
import * as controller from '../../controllers/blog.controller.js';

const router = Router();
router.post('/', validateRequest(createBlogSchema), controller.createBlog);
router.get('/', validateRequest(listAdminBlogsSchema, 'query'), controller.listAdminBlogs);
router.get('/:blogId', controller.getAdminBlog);
router.patch('/:blogId', validateRequest(updateBlogSchema), controller.updateBlog);
router.delete('/:blogId', controller.deleteBlog);
export default router;
