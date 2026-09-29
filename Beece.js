const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/DB");
const authRoutes = require("./routes/admin");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// MongoDB
connectDB();

// Routes
app.use("/", authRoutes);

app.get("/", (req, res) => {
    res.send("Bisi Perfume API is running!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});