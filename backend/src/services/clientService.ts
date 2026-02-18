import { PrismaClient } from '@prisma/client';
import { SaveClientInput } from '../types';

const prisma = new PrismaClient();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class ClientService {
  async listClients(freelancerWallet: string) {
    return prisma.client.findMany({
      where: { freelancerWallet },
      orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async upsertClient(freelancerWallet: string, input: SaveClientInput) {
    const normalizedEmail = normalizeEmail(input.email);

    return prisma.client.upsert({
      where: {
        freelancerWallet_email: {
          freelancerWallet,
          email: normalizedEmail,
        },
      },
      update: {
        name: input.name.trim(),
        company: input.company?.trim() || null,
        address: input.address?.trim() || null,
        ...(input.isFavorite !== undefined && {
          isFavorite: input.isFavorite,
        }),
      },
      create: {
        freelancerWallet,
        name: input.name.trim(),
        email: normalizedEmail,
        company: input.company?.trim() || null,
        address: input.address?.trim() || null,
        isFavorite: input.isFavorite ?? false,
      },
    });
  }

  async updateFavorite(
    clientId: string,
    freelancerWallet: string,
    isFavorite: boolean
  ) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });

    if (!client) {
      throw new Error('Client not found');
    }

    if (client.freelancerWallet !== freelancerWallet) {
      throw new Error('Unauthorized');
    }

    return prisma.client.update({
      where: { id: clientId },
      data: { isFavorite },
    });
  }
}

export const clientService = new ClientService();
