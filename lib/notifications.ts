import { prisma } from "@/lib/prisma";

/**
 * Creates an in-app notification.
 * Never throws — errors are swallowed so callers are never blocked.
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string
): Promise<void> {
  try {
    await prisma.notification.create({ data: { userId, title, message, type } });
  } catch (err) {
    console.error("[createNotification]", err);
  }
}
