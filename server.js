import express, { json } from "express";
import mongoose from "mongoose";
const { connect, connection: _connection } = mongoose;
import cors from "cors";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
const app = express();
import { init, Integrations, Handlers } from "@sentry/node";
import { Integrations as _Integrations } from "@sentry/tracing";
import {
  APP_ENV,
  APP_PORT,
  DATABASE_URL,
  SENTRY_DSN_URL,
} from "./config/index.js";
import routes from "./src/routes/index.js";
import ErrorHandler from "./src/middlewares/errorHandler.js";

init({
  environment: APP_ENV,
  dsn: SENTRY_DSN_URL,
  integrations: [
    new Integrations.Http({ tracing: true }),
    new _Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

const port = APP_PORT || 7000;
app.use(Handlers.requestHandler());
app.use(Handlers.tracingHandler());

app.use(
  cors({
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Credentials",
      "Access-Control-Allow-Origin",
    ],
    origin: [`${process.env.CLIENT_APP_URL}`, "http://localhost:7000"],
  }),
);
app.use(json());
app.use(cookieParser());
app.use(
  session({
    name: "session",
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

const uri = DATABASE_URL;
connect(uri);
const connection = _connection;
connection.once("open", () => {
  console.log("MongoDB Connected"); // eslint-disable-line
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Wedly API",
  });
});

app.use("/api", routes);

app.use(
  Handlers.errorHandler({
    shouldHandleError(error) {
      if (error.status >= 400) {
        return true;
      }
      return false;
    },
  }),
);
app.use(ErrorHandler);

app.listen(port, () => {
  console.log(`Server is running on: ${port}`); // eslint-disable-line
});
