const express = require("express");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const router = express.Router();
const prisma = new PrismaClient();

// Secret key for signing JWT
const secretKey = process.env.SECRET_KEY;

// In-memory store to track active sessions
const activeSessions = new Map();

// Middleware to authenticate JWT token and handle concurrent logins
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token; // Read the token from the cookie

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }

      // Attach the user's information from the decoded token to the request for use in other routes
      req.user = decoded;

      // Continue with the request
      next();
    });
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Route to create an expense
router.post("/createExpense", authenticateToken, async (req, res) => {
  const { name, amount } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create the expense and associate it with the user
    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        name: name,
        amount: amount,
      },
    });

    res.status(201).json({
      message: "Expense created successfully",
      expense: expense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: "Error creating expense" });
  }
});

// Route to delete an expense
router.delete("/deleteExpense/:id", authenticateToken, async (req, res) => {
  const expenseId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        userId: user.id,
      },
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await prisma.expense.delete({
      where: { id: expense.id },
    });

    res.status(200).json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Error deleting expense" });
  }
});

// Route to get all expenses of a user
router.get("/expenses", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
      include: {
        expenses: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the expenses from the user object
    const expenses = user.expenses;

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Error fetching expenses" });
  }
});
module.exports = router;
