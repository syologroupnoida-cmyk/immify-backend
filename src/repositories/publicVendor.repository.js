import prisma from '../config/db.js';

const activeSubscriptionWhere = (now) => ({
  status: 'ACTIVE',
  startsAt: { lte: now },
  expiresAt: { gt: now },
});

const publicListingWhere = ({ categoryId, serviceId } = {}) => ({
  reviewStatus: 'APPROVED',
  isPublished: true,
  isVisible: true,
  category: { isActive: true },
  ...(categoryId && { categoryId }),
  ...(serviceId && { serviceId }),
});

const publicVendorWhere = ({ search, city, state, country, categoryId, serviceId, now }) => ({
  kycStatus: 'APPROVED',
  user: {
    isActive: true,
  },
  ...(search && {
    OR: [
      { user: {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      } },
      { kyc: { companyName: { contains: search, mode: 'insensitive' } } },
      { kyc: { businessName: { contains: search, mode: 'insensitive' } } },
    ],
  }),
  ...((city || state || country) && {
    kyc: {
      ...(city && { officeCity: { contains: city, mode: 'insensitive' } }),
      ...(state && { officeState: { contains: state, mode: 'insensitive' } }),
      ...(country && { country: { contains: country, mode: 'insensitive' } }),
    },
  }),
  serviceListings: { some: publicListingWhere({ categoryId, serviceId }) },
  subscriptions: {
    some: {
      ...activeSubscriptionWhere(now),
      ...(categoryId && { categories: { some: { categoryId } } }),
    },
  },
});

const publicRelations = ({ now, categoryId, serviceId }) => ({
  user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  kyc: {
    select: {
      companyName: true,
      businessName: true,
      companyLogoUrl: true,
      companySinceYears: true,
      teamSize: true,
      country: true,
      officeCity: true,
      officeState: true,
      websiteUrl: true,
      facebookUrl: true,
      instagramUrl: true,
    },
  },
  subscriptions: {
    where: activeSubscriptionWhere(now),
    select: { categories: { select: { categoryId: true } } },
  },
  serviceListings: {
    where: publicListingWhere({ categoryId, serviceId }),
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      priceInPaise: true,
      currency: true,
      categoryId: true,
      category: { select: { id: true, name: true, slug: true } },
      service: { select: { id: true, name: true, description: true, isActive: true } },
      overview: true,
      process: true,
      includes: true,
      chargesIncludeGst: true,
      pricingDetails: true,
      termsAndConditions: true,
      dynamicData: true,
    },
    orderBy: { reviewedAt: 'desc' },
  },
});

export const listPublicVendors = async ({ take, skip, ...filters }) => {
  const now = new Date();
  const where = publicVendorWhere({ ...filters, now });
  const [items, total] = await prisma.$transaction([
    prisma.vendorProfile.findMany({
      where,
      select: publicRelations({ now, ...filters }),
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.vendorProfile.count({ where }),
  ]);
  return { items, total, take, skip };
};

export const findPublicVendor = (vendorUserId, filters = {}) => {
  const now = new Date();
  return prisma.vendorProfile.findFirst({
    where: { userId: vendorUserId, ...publicVendorWhere({ ...filters, now }) },
    select: publicRelations({ ...filters, now }),
  });
};
