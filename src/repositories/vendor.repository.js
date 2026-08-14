import prisma from '../config/db.js';

// Slim user fields for vendor list rows.
const VENDOR_USER_LIST_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
  email: true,
  phone: true,
  isActive: true,
  emailVerifiedAt: true,
  createdAt: true,
};

// Fuller user fields for the detail view.
const VENDOR_USER_DETAIL_SELECT = {
  ...VENDOR_USER_LIST_SELECT,
  avatarUrl: true,
  authProvider: true,
  updatedAt: true,
};

/**
 * Paginated + filterable vendor list for the admin dashboard.
 *
 * Filters: kycStatus, isActive, search (matches email/firstName/lastName/phone).
 * Sort: by createdAt (default) or user.firstName (sortBy='name').
 */
export const listVendors = async ({
  kycStatus,
  isActive,
  search,
  take,
  skip,
  sortBy,
  order,
}) => {
  // Build nested User filter (kycStatus is on VendorProfile, rest on User).
  const userWhere = {};
  if (typeof isActive === 'boolean') userWhere.isActive = isActive;
  if (search) {
    userWhere.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  const where = {};
  if (kycStatus) where.kycStatus = kycStatus;
  if (Object.keys(userWhere).length > 0) where.user = userWhere;

  const orderBy =
    sortBy === 'name'
      ? { user: { firstName: order } }
      : { [sortBy]: order };

  const [items, total] = await Promise.all([
    prisma.vendorProfile.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        user: { select: VENDOR_USER_LIST_SELECT },
        kyc: {
          select: {
            companyName: true,
            businessName: true,
            country: true,
            officeCity: true,
            submittedAt: true,
            reviewedAt: true,
            rejectionReason: true,
          },
        },
      },
    }),
    prisma.vendorProfile.count({ where }),
  ]);

  return { items, total };
};

/**
 * Full vendor detail — user + KYC + all documents.
 */
export const getVendorDetail = async (vendorUserId) => {
  return prisma.vendorProfile.findUnique({
    where: { userId: vendorUserId },
    include: {
      user: { select: VENDOR_USER_DETAIL_SELECT },
      kyc: true,
      documents: true,
    },
  });
};

/**
 * Set the vendor's User.isActive flag. On deactivation, revoke all refresh
 * tokens so any open session can't be extended.
 *
 * Returns:
 *   - { notFound: true }    — user doesn't exist
 *   - { notVendor: true }   — user exists but isn't a VENDOR
 *   - { user, profile }     — success (user is the updated User row)
 */
export const setVendorActiveStatus = async ({ vendorUserId, isActive }) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: vendorUserId } });
    if (!user) return { notFound: true };
    if (user.role !== 'VENDOR') return { notVendor: true };

    const updated = await tx.user.update({
      where: { id: vendorUserId },
      data: { isActive },
      select: VENDOR_USER_DETAIL_SELECT,
    });

    if (!isActive) {
      await tx.refreshToken.updateMany({
        where: { userId: vendorUserId, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    const profile = await tx.vendorProfile.findUnique({
      where: { userId: vendorUserId },
      select: { kycStatus: true },
    });

    return { user: updated, profile };
  });
};
