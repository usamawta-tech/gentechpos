import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  { name: "Espresso", barcode: "1000000000017", price: 3.5, stock: 120, category: "Beverage" },
  { name: "Cappuccino", barcode: "1000000000024", price: 4.25, stock: 98, category: "Beverage" },
  { name: "Iced Latte", barcode: "1000000000031", price: 4.75, stock: 76, category: "Beverage" },
  { name: "Orange Juice", barcode: "1000000000048", price: 3.25, stock: 64, category: "Beverage" },
  { name: "Croissant", barcode: "1000000000055", price: 2.75, stock: 45, category: "Bakery" },
  { name: "Blueberry Muffin", barcode: "1000000000062", price: 3.0, stock: 8, category: "Bakery" },
  { name: "Cinnamon Roll", barcode: "1000000000079", price: 3.95, stock: 6, category: "Bakery" },
  { name: "Chocolate Chip Cookie", barcode: "1000000000086", price: 2.25, stock: 60, category: "Bakery" },
  { name: "Turkey Sandwich", barcode: "1000000000093", price: 7.5, stock: 22, category: "Food" },
  { name: "Veggie Wrap", barcode: "1000000000109", price: 6.5, stock: 4, category: "Food" },
  { name: "Trail Mix", barcode: "1000000000116", price: 4.5, stock: 80, category: "Snacks" },
  { name: "Potato Chips", barcode: "1000000000123", price: 2.5, stock: 120, category: "Snacks" },
  { name: "Bottled Water", barcode: "1000000000130", price: 2.0, stock: 150, category: "Beverage" },
  { name: "Wireless Earbuds", barcode: "1000000000147", price: 59.99, stock: 12, category: "Electronics" },
  { name: "USB-C Cable", barcode: "1000000000154", price: 9.99, stock: 5, category: "Electronics" },
];

async function main() {
  console.log("Seeding database...");
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  const adminPassword = await bcrypt.hash("admin123", 10);
  const cashierPassword = await bcrypt.hash("cashier123", 10);
  await prisma.user.createMany({
    data: [
      { name: "Store Admin", email: "admin@pos.com", password: adminPassword, role: "ADMIN" },
      { name: "Jane Cashier", email: "cashier@pos.com", password: cashierPassword, role: "CASHIER" },
    ],
  });

  await prisma.customer.createMany({
    data: [
      { name: "Walk-in Regular", email: "regular@example.com", phone: "(555) 010-1010" },
      { name: "Acme Corp", email: "orders@acme.com", phone: "(555) 020-2020" },
    ],
  });

  console.log(`Seeded ${products.length} products, 2 users, 2 customers.`);
  console.log("Login: admin@pos.com / admin123  (or cashier@pos.com / cashier123)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
