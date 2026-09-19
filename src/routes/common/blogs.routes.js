import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listPublicBlogsSchema } from '../../validators/blog.validator.js';
import * as controller from '../../controllers/blog.controller.js';

const router = Router();
router.get('/', validateRequest(listPublicBlogsSchema, 'query'), controller.listPublicBlogs);
router.get('/:slug', controller.getPublicBlog);
export default router;
