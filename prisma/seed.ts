import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create a sample Farmer/Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@chopalorchard.com" },
    update: {},
    create: {
      email: "admin@chopalorchard.com",
      firstName: "Chopal",
      lastName: "Farmer",
      role: UserRole.FARMER,
    },
  });

  console.log("Admin user created/verified.");

  // Note: Add your Product & BatchTraceability models below matching your schema setup
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });