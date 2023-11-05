const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

const corsOptions = {
  credentials: true, // Include credentials with CORS requests
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if ([process.env.CLIENT_URL, "http://localhost:5173/"].indexOf(origin) !== -1) {
      callback(null, true); // Origin is allowed
    } else {
      callback(new Error('Not allowed by CORS')); // Origin is not allowed
    }
  },
  exposedHeaders: ["Set-Cookie"],
};

// Apply the CORS middleware to all incoming requests
app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions)); // This will handle pre-flight requests for HTTP methods with CORS requirements

app.use(cookieParser());

// Import userRoutes
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

// Use userRoutes middleware
app.use("/api", userRoutes);

// Use transactionRoutes middleware
app.use("/api", transactionRoutes);

// Use expenseRoutes middleware
app.use("/api", expenseRoutes);

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
