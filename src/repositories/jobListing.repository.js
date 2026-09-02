import prisma from '../config/db.js';

const vendorSummary = {
  select: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
};

export const getActiveJobSubscription = (vendorUserId) => prisma.vendorSubscription.findFirst({
  where: {
    vendorUserId,
    status: 'ACTIVE',
    startsAt: { lte: new Date() },
    expiresAt: { gt: new Date() },
    jobPortalAccessSnapshot: true,
  },
  orderBy: { expiresAt: 'desc' },
});

export const countSubmittedJobsForSubscription = (subscriptionId, excludeId) => prisma.jobListing.count({
  where: {
    subscriptionId,
    ...(excludeId && { id: { not: excludeId } }),
    reviewStatus: { in: ['PENDING_REVIEW', 'APPROVED'] },
  },
});

export const create = (data) => prisma.jobListing.create({ data });

export const findById = (id) => prisma.jobListing.findUnique({
  where: { id },
  include: { vendor: vendorSummary, subscription: { select: { id: true, planNameSnapshot: true, expiresAt: true } } },
});

export const findVendorJob = (id, vendorUserId) => prisma.jobListing.findFirst({ where: { id, vendorUserId } });
export const update = (id, data) => prisma.jobListing.update({ where: { id }, data });
export const remove = (id) => prisma.jobListing.delete({ where: { id } });

export const listVendorJobs = async (vendorUserId, { reviewStatus, take, skip }) => {
  const where = { vendorUserId, ...(reviewStatus && { reviewStatus }) };
  const [items, total] = await prisma.$transaction([
    prisma.jobListing.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.jobListing.count({ where }),
  ]);
  return { items, total, take, skip };
};

export const listForAdmin = async ({ reviewStatus, vendorUserId, country, industry, search, take, skip }) => {
  const where = {
    ...(reviewStatus && { reviewStatus }),
    ...(vendorUserId && { vendorUserId }),
    ...(country && { country: { equals: country, mode: 'insensitive' } }),
    ...(industry && { industry: { equals: industry, mode: 'insensitive' } }),
    ...(search && { OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { cityRegion: { contains: search, mode: 'insensitive' } },
      { country: { contains: search, mode: 'insensitive' } },
    ] }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.jobListing.findMany({ where, include: { vendor: vendorSummary }, orderBy: [{ submittedAt: 'asc' }, { createdAt: 'desc' }], take, skip }),
    prisma.jobListing.count({ where }),
  ]);
  return { items, total, take, skip };
};

export const listPublic = async ({ country, cityRegion, industry, employmentType, search, take, skip }) => {
  const now = new Date();
  const where = {
    reviewStatus: 'APPROVED',
    isPublished: true,
    isVisible: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    ...(country && { country: { equals: country, mode: 'insensitive' } }),
    ...(cityRegion && { cityRegion: { equals: cityRegion, mode: 'insensitive' } }),
    ...(industry && { industry: { equals: industry, mode: 'insensitive' } }),
    ...(employmentType && { employmentType: { equals: employmentType, mode: 'insensitive' } }),
    ...(search && { AND: [{ OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { requiredSkills: { has: search } },
    ] }] }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.jobListing.findMany({ where, include: { vendor: vendorSummary }, orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }], take, skip }),
    prisma.jobListing.count({ where }),
  ]);
  return { items, total, take, skip };
};

export const findPublicById = (id) => prisma.jobListing.findFirst({
  where: {
    id,
    reviewStatus: 'APPROVED',
    isPublished: true,
    isVisible: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  },
  include: { vendor: vendorSummary },
});
