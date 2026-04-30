import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { configureRoutes } from "./utils";

dotenv.config();

const app = express();

// app.use(cors());

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  // standardHeaders: true,
  // legacyHeaders: false,
  handler: (_req, res) => {
    res
      .status(429)
      .json({ message: "Too many requests, please try again later." });
  },
});

app.use("/api", limiter);

// request logger
app.use(morgan("dev"));
app.use(express.json());

// Todo: Auth middleware

// routes
configureRoutes(app);

// health check
app.get("/health", (_req, res) => {
  res.status(200).json({ message: "API Gateway is running" });
});

// Error handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
  },
);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
