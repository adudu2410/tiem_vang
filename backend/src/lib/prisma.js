// import pkg from "@prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";

// const { PrismaClient } = pkg;

// const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// const prisma = new PrismaClient({ adapter });

// export default prisma;

import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = pkg;

const adapter = new PrismaPg(process.env.DATABASE_URL); // ✅ đúng

const prisma = new PrismaClient({ adapter });

export default prisma;
