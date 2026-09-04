import prisma from '../config/db.js';

const detailInclude = {
  jobListing: { select: { id: true, title: true, country: true, cityRegion: true, vendorUserId: true } },
  assignedVendor: { select: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
};

export const findDuplicate = (jobListingId, email) => prisma.jobApplication.findUnique({
  where: { jobListingId_email: { jobListingId, email } },
  select: { id: true },
});

export const create = (data) => prisma.jobApplication.create({
  data,
  select: { id: true, jobListingId: true, status: true, createdAt: true },
});

export const findForAdmin = (id) => prisma.jobApplication.findUnique({ where: { id }, include: detailInclude });

export const findForVendor = (id, vendorUserId) => prisma.jobApplication.findFirst({
  where: { id, assignedVendorUserId: vendorUserId }, include: detailInclude,
});

export const listForAdmin = async ({ jobListingId, assignedVendorUserId, assignment, status, search, take, skip }) => {
  const where = {
    ...(jobListingId && { jobListingId }),
    ...(assignedVendorUserId && { assignedVendorUserId }),
    ...(assignment === 'ASSIGNED' && { assignedVendorUserId: { not: null } }),
    ...(assignment === 'UNASSIGNED' && { assignedVendorUserId: null }),
    ...(status && { status }),
    ...(search && { OR: [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { jobListing: { title: { contains: search, mode: 'insensitive' } } },
    ] }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.jobApplication.findMany({ where, include: detailInclude, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.jobApplication.count({ where }),
  ]);
  return { items, total, take, skip };
};

export const listForVendor = async (vendorUserId, { jobListingId, status, take, skip }) => {
  const where = { assignedVendorUserId: vendorUserId, ...(jobListingId && { jobListingId }), ...(status && { status }) };
  const [items, total] = await prisma.$transaction([
    prisma.jobApplication.findMany({ where, include: detailInclude, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.jobApplication.count({ where }),
  ]);
  return { items, total, take, skip };
};

export const updateStatus = (id, status, statusNote) => prisma.jobApplication.update({
  where: { id }, data: { status, statusNote: statusNote ?? null }, include: detailInclude,
});
