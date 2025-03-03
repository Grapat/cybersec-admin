require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const crypto = require("crypto-js");

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(bodyParser.json());

function encodeData(data) {
  return crypto.AES.encrypt(data, process.env.SECRET_KEY).toString();
}

function decodeData(data) {
  const bytes = crypto.AES.decrypt(data, process.env.SECRET_KEY);
  return bytes.toString(crypto.enc.Utf8);
}

// Routes
app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.get("/user", async (req, res, next) => {
  try {
    // ดึงข้อมูลจากฐานข้อมูล
    const users = await prisma.$queryRaw`SELECT id, username, cardId FROM User`;

    console.log("🔍 Users from DB:", users); // Debugging

    // ตรวจสอบว่าข้อมูลที่ได้เป็น array จริง ๆ
    if (!Array.isArray(users)) {
      return res.status(500).json({ error: "Database query did not return an array" });
    }

    // วนลูปเพื่อถอดรหัส `cardId` ทีละรายการ
    const decryptedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      cardId: user.cardId ? decodeData(user.cardId) : null, // ถอดรหัสเฉพาะ cardId
    }));

    res.json({ data: decryptedUsers });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    next(error);
  }
});

app.post("/user", async (req, res, next) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: req.body.username },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const response = await prisma.user.create({
      data: {
        username: req.body.username,
        password: req.body.password,
        cardId: encodeData(req.body.cardId),
      },
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

app.put("/user", async (req, res, next) => {
  try {
    const id = parseInt(req.body.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const response = await prisma.user.update({
      where: { id },
      data: {
        username: req.body.username,
        password: req.body.password,
        cardId: encodeData(req.body.cardId),
      },
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.delete("/user", async (req, res, next) => {
  try {
    if (!req.body.id) {
      return res.status(400).json({ error: "User ID is required in request body" });
    }

    const id = parseInt(req.body.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const response = await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "User deleted successfully", user: response });
  } catch (error) {
    next(error);
  }
});

// Start Server
app.listen(3000, () => {
  console.log(`🚀 Server running on http://localhost:3000`);
});
