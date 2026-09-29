import { ApiError } from '../../utils/ApiError.js';
import * as repo from '../../repositories/publicVendor.repository.js';

const entitledListings = (vendor) => {
  const categoryIds = new Set(
    vendor.subscriptions.flatMap((subscription) =>
      subscription.categories.map(({ categoryId }) => categoryId)),
  );
  return vendor.serviceListings.filter((listing) =>
    categoryIds.has(listing.categoryId) && (!listing.service || listing.service.isActive));
};

const cardFor = (vendor) => {
  const services = entitledListings(vendor);
  return {
    id: vendor.user.id,
    firstName: vendor.user.firstName,
    lastName: vendor.user.lastName,
    avatarUrl: vendor.user.avatarUrl,
    companyName: vendor.kyc?.companyName ?? null,
    businessName: vendor.kyc?.businessName ?? null,
    companyLogoUrl: vendor.kyc?.companyLogoUrl ?? null,
    location: {
      city: vendor.kyc?.officeCity ?? null,
      state: vendor.kyc?.officeState ?? null,
      country: vendor.kyc?.country ?? null,
    },
    services: services.map((listing) => ({
      listingId: listing.id,
      title: listing.title,
      categoryName: listing.category.name,
      serviceName: listing.service?.name ?? null,
      imageUrl: listing.imageUrl,
      priceInPaise: listing.priceInPaise,
      currency: listing.currency,
    })),
  };
};

export const listPublicVendors = async (query) => {
  const result = await repo.listPublicVendors(query);
  return {
    ...result,
    items: result.items.map(cardFor),
  };
};

export const getPublicVendor = async (vendorUserId, filters = {}) => {
  const vendor = await repo.findPublicVendor(vendorUserId, filters);
  if (!vendor) throw ApiError.notFound('Public vendor not found.');

  const services = entitledListings(vendor);
  if (!services.length) throw ApiError.notFound('Public vendor not found.');

  return {
    ...cardFor(vendor),
    company: vendor.kyc,
    services: services.map(({ categoryId, service, ...listing }) => ({
      ...listing,
      service: service ? {
        id: service.id,
        name: service.name,
        description: service.description,
      } : null,
    })),
  };
};
