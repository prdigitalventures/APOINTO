import { prisma } from './db';
import { allocateUniqueCode } from './business-code';
import { getBookingSchema } from './booking-schema';
import { slugify } from './utils';
import { hashPassword, issuePasswordResetForUser } from './auth';
import { normalizeEmail, normalizePhone, createSecretToken } from './identity';
import { sendShopAssignedEmail } from './email';
import { uniquePlaceholderPhone } from './admin';

export async function createBusinessForOwner(input: {
  name: string;
  category?: string;
  location?: string;
  description?: string;
  about?: string;
  ownerEmail: string;
  ownerName?: string;
  ownerPhone?: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error('Business name is required');
  const ownerEmail = normalizeEmail(input.ownerEmail);
  if (!ownerEmail) throw new Error('Owner email is required');

  let owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  let invited = false;
  if (!owner) {
    const phone = input.ownerPhone ? normalizePhone(input.ownerPhone) : await uniquePlaceholderPhone();
    if (input.ownerPhone) {
      const taken = await prisma.user.findUnique({ where: { phone } });
      if (taken) throw new Error('That phone number is already registered');
    }
    owner = await prisma.user.create({
      data: {
        name: (input.ownerName || name).trim(),
        email: ownerEmail,
        phone,
        password: await hashPassword(createSecretToken()),
        role: 'OWNER',
        emailVerifiedAt: new Date(),
      },
    });
    invited = true;
    await issuePasswordResetForUser(owner);
  } else if (owner.role === 'CUSTOMER') {
    owner = await prisma.user.update({
      where: { id: owner.id },
      data: { role: 'OWNER' },
    });
  }

  let slug = slugify(name) || 'business';
  const existing = await prisma.business.findUnique({ where: { slug } });
  if (existing) slug = `${slug}${Date.now().toString(36)}`;

  const category = input.category || 'beauty';
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

  const mail = await sendShopAssignedEmail(ownerEmail, {
    ownerName: owner.name,
    businessName: name,
    slug,
  });

  return { business, owner, invited, emailSent: mail.sent };
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
