import prisma from '../config/db.js';

const listSelect = {
  id: true,
  country: true,
  programNo: true,
  category: true,
  programName: true,
  description: true,
  bestFor: true,
  familyOption: true,
  prLongTermPotential: true,
  vendorBasicInr: true,
  vendorStandardInr: true,
  vendorPremiumInr: true,
  leadPriority: true,
  officialPortalUrl: true,
  verificationStatus: true,
};

export const listPublic = async ({ country, category, leadPriority, search, take, skip }) => {
  const where = {
    isActive: true,
    ...(country && { country: { equals: country, mode: 'insensitive' } }),
    ...(category && { category: { equals: category, mode: 'insensitive' } }),
    ...(leadPriority && { leadPriority }),
    ...(search && { OR: [
      { programName: { contains: search, mode: 'insensitive' } },
      { country: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { bestFor: { contains: search, mode: 'insensitive' } },
    ] }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.immigrationProgram.findMany({
      where,
      select: listSelect,
      orderBy: [{ country: 'asc' }, { programNo: 'asc' }],
      take,
      skip,
    }),
    prisma.immigrationProgram.count({ where }),
  ]);
  return { items, total, take, skip };
};

export const findPublicById = (id) => prisma.immigrationProgram.findFirst({
  where: { id, isActive: true },
});

export const getFilterOptions = async () => {
  const [countries, categories] = await Promise.all([
    prisma.immigrationProgram.findMany({ where: { isActive: true }, distinct: ['country'], select: { country: true }, orderBy: { country: 'asc' } }),
    prisma.immigrationProgram.findMany({ where: { isActive: true }, distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } }),
  ]);
  return { countries: countries.map((item) => item.country), categories: categories.map((item) => item.category), leadPriorities: ['High', 'Medium'] };
};
