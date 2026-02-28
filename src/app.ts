import express from "express";
import identifyRouter from "./routes/identify.route";

const app = express();

app.use(express.json());

app.use("/identify", identifyRouter);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({
    message: "Internal Server Error",
  });
});

export default app;