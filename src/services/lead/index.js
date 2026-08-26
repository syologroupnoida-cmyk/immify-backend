import { ApiError } from '../../utils/ApiError.js';
import * as leadRepo from '../../repositories/lead.repository.js';
import { getLeadFormConfig } from './formConfig.js';

const getSelectedService = async (categoryId, serviceId) => {
  const service = await leadRepo.findActiveService(serviceId, categoryId);
  if (!service) throw ApiError.badRequest('The selected service does not belong to the selected active category.');
  return service;
};

export const getFormConfig = async ({ categoryId, serviceId }) => {
  const service = await getSelectedService(categoryId, serviceId);
  return getLeadFormConfig({ category: service.category, service });
};

export const createGlobalLead = async ({ clientUserId, payload }) => {
  await getSelectedService(payload.categoryId, payload.serviceId);
  const { passportAvailable, dateOfBirth, passportExpiry, ...leadFields } = payload;
  return leadRepo.createGlobalLead({
    ...leadFields,
    dateOfBirth: dateOfBirth ? new Date(`${dateOfBirth}T00:00:00.000Z`) : null,
    passportAvailable: passportAvailable === undefined ? null : passportAvailable === 'Yes',
    passportExpiry: passportExpiry ? new Date(`${passportExpiry}T00:00:00.000Z`) : null,
    clientUserId: clientUserId ?? null,
  });
};

export const listAdminLeads = (query) => leadRepo.listAdminLeads(query);

export const getAdminLead = async (leadId) => {
  const lead = await leadRepo.findAdminLead(leadId);
  if (!lead) throw ApiError.notFound('Lead not found.');
  return lead;
};

const transition = async ({ leadId, fromStatus, data, message }) => {
  const result = await leadRepo.transitionLead({ id: leadId, fromStatus, data });
  if (result.count !== 1) throw ApiError.conflict(message);
  return getAdminLead(leadId);
};

export const verifyLead = ({ leadId, adminId }) => transition({
  leadId,
  fromStatus: 'PENDING',
  data: { status: 'VERIFIED', reviewedByAdminId: adminId, reviewedAt: new Date(), rejectionReason: null, rejectedAt: null },
  message: 'Only a pending lead can be verified.',
});

export const activateLead = ({ leadId, adminId, creditCost, maxUnlocks, expiresAt }) => transition({
  leadId,
  fromStatus: 'VERIFIED',
  data: {
    status: 'ACTIVE',
    creditCost,
    maxUnlocks,
    unlockCount: 0,
    reviewedByAdminId: adminId,
    activatedAt: new Date(),
    expiresAt: expiresAt ?? null,
  },
  message: 'Only a verified lead can be activated.',
});

export const rejectLead = async ({ leadId, adminId, reason }) => {
  const lead = await getAdminLead(leadId);
  if (!['PENDING', 'VERIFIED'].includes(lead.status)) {
    throw ApiError.conflict('Only a pending or verified lead can be rejected.');
  }
  return transition({
    leadId,
    fromStatus: lead.status,
    data: { status: 'REJECTED', reviewedByAdminId: adminId, reviewedAt: new Date(), rejectedAt: new Date(), rejectionReason: reason },
    message: 'The lead status changed before it could be rejected.',
  });
};

const withMaskedContact = (lead) => ({
  ...lead,
  contact: { name: 'Hidden until purchase', email: 'Hidden until purchase', phone: 'Hidden until purchase' },
  isUnlocked: false,
});

export const listMarketplaceLeads = async ({ vendorUserId, query }) => {
  const result = await leadRepo.listMatchedMarketplaceLeads({ vendorUserId, ...query });
  return { ...result, items: result.items.map(withMaskedContact) };
};

export const getMarketplaceLead = async ({ leadId, vendorUserId }) => {
  const purchased = await leadRepo.findPurchasedLead(leadId, vendorUserId);
  if (purchased) return { ...purchased, isUnlocked: true };
  const lead = await leadRepo.findMatchedMarketplaceLead(leadId, vendorUserId);
  if (!lead) throw ApiError.notFound('Matching active lead not found.');
  return withMaskedContact(lead);
};

export const purchaseLead = async ({ leadId, vendorUserId }) => {
  const result = await leadRepo.purchaseLead({ leadId, vendorUserId });
  if (result.unavailable) throw ApiError.notFound('Lead is unavailable or does not match your offerings.');
  if (result.insufficientCredits) throw ApiError.badRequest('Insufficient credits.', { code: 'INSUFFICIENT_CREDITS' });
  const lead = await leadRepo.findPurchasedLead(leadId, vendorUserId);
  return { ...result, lead: { ...lead, isUnlocked: true } };
};

export const listPurchasedLeads = ({ vendorUserId, query }) => leadRepo.listPurchasedLeads({ vendorUserId, ...query });

export const getPurchasedLead = async ({ leadId, vendorUserId }) => {
  const lead = await leadRepo.findPurchasedLead(leadId, vendorUserId);
  if (!lead) throw ApiError.notFound('Purchased lead not found.');
  return { ...lead, isUnlocked: true };
};

export const getWallet = async (vendorUserId) => {
  const wallet = await leadRepo.getVendorWallet(vendorUserId);
  if (!wallet) throw ApiError.notFound('Vendor profile not found.');
  return wallet;
};

export const adjustVendorCredits = async (payload) => {
  const result = await leadRepo.adjustVendorCredits(payload);
  if (result.notFoundOrInsufficient) {
    throw ApiError.badRequest('Vendor was not found or the adjustment would make the balance negative.');
  }
  return result;
};

export const replaceOfferings = async ({ vendorUserId, payload }) => {
  const result = await leadRepo.replaceVendorOfferings({ vendorUserId, ...payload });
  if (result.invalidSelection) throw ApiError.badRequest('Every selected category must exist and be active.');
  return result;
};

export const getOfferings = async (vendorUserId) => {
  const result = await leadRepo.getVendorOfferings(vendorUserId);
  if (!result) throw ApiError.notFound('Vendor profile not found.');
  return result;
};
