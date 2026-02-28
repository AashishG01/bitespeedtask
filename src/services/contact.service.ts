import prisma from "../prisma";

export const identifyService = async (
  email?: string,
  phoneNumber?: string
) => {


  // STEP 1 — Find contacts matching incoming email or phone
  // We search for any contact where:
  //  - email matches OR
  //  - phoneNumber matches
  // Only active (not soft-deleted) contacts
  // Ordered by createdAt so oldest comes first


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



  //  No matching contact found
  // This means it's a completely new customer
  // So we create a PRIMARY contact


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
        primaryContactId: newPrimary.id,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: [],
      },
    };
  }



  // PRIMARY MERGE LOGIC
  // If multiple primary groups are connected via this request,
  // we must merge them into one identity cluster.


  const primaryIds = new Set<number>();

  // Collect all primary IDs involved
  // If a matched contact is:
  //  - primary → add its id
  //  - secondary → add its linkedId (its primary)
  for (const contact of matchedContacts) {
    if (contact.linkPrecedence === "primary") {
      primaryIds.add(contact.id);
    } else if (contact.linkedId) {
      primaryIds.add(contact.linkedId);
    }
  }

  // Fetch all those primary contacts sorted by oldest first
  const primaries = await prisma.contact.findMany({
    where: {
      id: { in: Array.from(primaryIds) },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // If more than one primary exists → merge them
  if (primaries.length > 1) {

    const oldestPrimary = primaries[0]; // Oldest wins
    const otherPrimaryIds = primaries.slice(1).map(p => p.id);

    // Use transaction to ensure atomic merge
    await prisma.$transaction(async (tx) => {

      // Convert newer primaries into secondary
      await tx.contact.updateMany({
        where: { id: { in: otherPrimaryIds } },
        data: {
          linkPrecedence: "secondary",
          linkedId: oldestPrimary.id,
        },
      });

      // Re-link their secondaries to oldest primary
      await tx.contact.updateMany({
        where: { linkedId: { in: otherPrimaryIds } },
        data: {
          linkedId: oldestPrimary.id,
        },
      });
    });

    // After merge, reload full identity cluster
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



  // STAGE 2 — Create secondary contact if new information arrives
  // If email or phone is new within identity cluster,
  // we create a new secondary record.


  // Identify the primary contact in current cluster
  const primary =
    matchedContacts.find(c => c.linkPrecedence === "primary") ||
    matchedContacts[0];

  // Collect existing emails & phones in identity cluster
  const existingEmails = new Set(
    matchedContacts.map(c => c.email).filter(Boolean)
  );

  const existingPhones = new Set(
    matchedContacts.map(c => c.phoneNumber).filter(Boolean)
  );

  // Check whether incoming values are new
  const isNewEmail = email && !existingEmails.has(email);
  const isNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

  // If at least one new piece of information exists → create secondary
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
  // Fetch full identity cluster and build response format


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

  // Find primary contact
  const primaryContact = finalContacts.find(
    c => c.linkPrecedence === "primary"
  )!;

  // Build emails array
  // Primary email must be first
  // Remove duplicates
  const emails = [
    primaryContact.email,
    ...finalContacts
      .filter(c => c.id !== primaryContact.id)
      .map(c => c.email),
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  // Build phone numbers array
  const phoneNumbers = [
    primaryContact.phoneNumber,
    ...finalContacts
      .filter(c => c.id !== primaryContact.id)
      .map(c => c.phoneNumber),
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  // Collect all secondary contact IDs
  const secondaryContactIds = finalContacts
    .filter(c => c.linkPrecedence === "secondary")
    .map(c => c.id);

  // Final structured response
  return {
    contact: {
      primaryContactId: primary.id,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
};