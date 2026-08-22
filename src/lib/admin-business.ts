import { prisma } from './db';
import { allocateUniqueCode } from './business-code';
import { getBookingSchema, resolveCategoryId } from './booking-schema';
import { slugify } from './utils';
import { normalizeEmail } from './identity';

export async function createBusinessForOwner(input: {
  name: string;
  category?: string;
  location?: string;
  description?: string;
  about?: string;
  ownerEmail: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error('Business name is required');
  const ownerEmail = normalizeEmail(input.ownerEmail);
  if (!ownerEmail) throw new Error('Owner email is required');

  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    throw new Error('Create the owner on Accounts first, then assign this shop to their email.');
  }
  if (owner.role === 'CUSTOMER') {
    await prisma.user.update({ where: { id: owner.id }, data: { role: 'OWNER' } });
  }

  let slug = slugify(name) || 'business';
  const existing = await prisma.business.findUnique({ where: { slug } });
  if (existing) slug = `${slug}${Date.now().toString(36)}`;

  const category = resolveCategoryId(input.category);
  const schema = getBookingSchema(category);
  const uniqueCode = await allocateUniqueCode();

  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      name,
      slug,
      category,
      location: input.location || null,
      description: input.description || null,
      about: input.about || null,
      bookingSchema: JSON.stringify(schema),
      uniqueCode,
      contactPhone: owner.phone,
    },
  });

  return { business, owner, emailSent: false };
}

export async function setBusinessActive(id: string, isActive: boolean, reason?: string) {
  return prisma.business.update({
    where: { id },
    data: {
      isActive,
      disabledReason: isActive ? null : reason || 'Disabled by Apointo admin',
    },
  });
}
