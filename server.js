const express = require('express');
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello world!');
});

// Get all users
app.get('/user', async (req, res) => {
  try {
    const data = await prisma.user.findMany();
    res.json({ data });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users.' });
  }
});

// Create a new user
app.post('/user', async (req, res) => {
  try {
    console.log(req.body);
    const response = await prisma.user.create({
      data: {
        username: req.body.username,
        password: req.body.password,
      },
    });
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'An error occurred while creating the user.' });
  }
});

// Update a user by id
app.put('/user/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const response = await prisma.user.update({
      where: { id },
      data: {
        username: req.body.username,
        password: req.body.password,
      },
    });
    res.json(response);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'An error occurred while updating the user.' });
  }
});

// Delete a user by id
app.delete('/user/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const response = await prisma.user.delete({
      where: { id },
    });
    res.json(response);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'An error occurred while deleting the user.' });
  }
});

app.listen(3000, () => {
  console.log(`🚀 Server running on http://localhost:3000`);
});
