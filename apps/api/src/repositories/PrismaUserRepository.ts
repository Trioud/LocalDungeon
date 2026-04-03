import type { PrismaClient } from '@prisma/client';
import type { IUserRepository, User, CreateUserData } from '../ports/IUserRepository.js';

interface Deps {
  prisma: PrismaClient;
}

export class PrismaUserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Deps) {
    this.prisma = prisma;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
