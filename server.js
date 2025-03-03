const express = require('express');
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const app = express();
const prisma = new PrismaClient();

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 100, // จำกัด 100 requests ต่อ 15 นาที
  message: { error: "Too many requests, please try again later" },
});
app.use(limiter);

// Middleware
app.use(bodyParser.json());

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
async function checkDBConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}
checkDBConnection();

// Routes
app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.get('/user', async (req, res, next) => {
  try {
    const data = await prisma.user.findMany();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post('/user', async (req, res, next) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: req.body.username },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const response = await prisma.user.create({
      data: {
        username: req.body.username,
        password: hashedPassword,
      },
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

app.put('/user/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid user ID" });

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const response = await prisma.user.update({
      where: { id },
      data: {
        username: req.body.username,
        password: hashedPassword,
      },
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.delete('/user/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid user ID" });

    const response = await prisma.user.delete({
      where: { id },
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start Server
app.listen(3000, () => {
  console.log(`🚀 Server running on http://localhost:3000`);
});
