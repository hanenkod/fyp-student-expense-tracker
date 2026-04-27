/**
 * Singleton Prisma client.
 *
 * Importing this module from multiple files reuses the same connection
 * pool. PrismaClient is expensive to construct (it spins up a Rust-based
 * query engine), so we never want more than one per process.
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
