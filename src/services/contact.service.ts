import prisma from "../prisma";

export const identifyService = async (
  email?: string,
  phoneNumber?: string
) => {

  // 1 Find matching contacts
  let matchedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : undefined,
        phoneNumber ? { phoneNumber } : undefined,
      ].filter(Boolean) as any,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

 
  // CASE 1 — No match → create primary


  if (matchedContacts.length === 0) {
    const newPrimary = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary",
      },
    });

    return {
      contact: {
        primaryContatctId: newPrimary.id,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: [],
      },
    };
  }


  // STAGE 3 — PRIMARY MERGE LOGIC


  const primaryIds = new Set<number>();

  for (const contact of matchedContacts) {
    if (contact.linkPrecedence === "primary") {
      primaryIds.add(contact.id);
    } else if (contact.linkedId) {
      primaryIds.add(contact.linkedId);
    }
  }

  const primaries = await prisma.contact.findMany({
    where: {
      id: { in: Array.from(primaryIds) },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (primaries.length > 1) {
    const oldestPrimary = primaries[0];
    const otherPrimaryIds = primaries.slice(1).map(p => p.id);

    await prisma.$transaction(async (tx) => {
      await tx.contact.updateMany({
        where: { id: { in: otherPrimaryIds } },
        data: {
          linkPrecedence: "secondary",
          linkedId: oldestPrimary.id,
        },
      });

      await tx.contact.updateMany({
        where: { linkedId: { in: otherPrimaryIds } },
        data: {
          linkedId: oldestPrimary.id,
        },
      });
    });

    matchedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: oldestPrimary.id },
          { linkedId: oldestPrimary.id },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }


  // STAGE 2 — Create secondary if new info


  const primary =
    matchedContacts.find(c => c.linkPrecedence === "primary") ||
    matchedContacts[0];

  const existingEmails = new Set(
    matchedContacts.map(c => c.email).filter(Boolean)
  );

  const existingPhones = new Set(
    matchedContacts.map(c => c.phoneNumber).filter(Boolean)
  );

  const isNewEmail = email && !existingEmails.has(email);
  const isNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

  if (isNewEmail || isNewPhone) {
    await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "secondary",
        linkedId: primary.id,
      },
    });
  }


  // FINAL RESPONSE BUILDER

  const finalContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primary.id },
        { linkedId: primary.id },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const primaryContact = finalContacts.find(
    c => c.linkPrecedence === "primary"
  )!;

  const emails = [
    primaryContact.email,
    ...finalContacts
      .filter(c => c.id !== primaryContact.id)
      .map(c => c.email),
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  const phoneNumbers = [
    primaryContact.phoneNumber,
    ...finalContacts
      .filter(c => c.id !== primaryContact.id)
      .map(c => c.phoneNumber),
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  const secondaryContactIds = finalContacts
    .filter(c => c.linkPrecedence === "secondary")
    .map(c => c.id);

  return {
    contact: {
      primaryContatctId: primary.id,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
};