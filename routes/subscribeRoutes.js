import express from "express";
const subscribeRoutes = express.Router();
import { createSubscribe } from "../controllers/subscribeController.js";

subscribeRoutes.post("/", createSubscribe);

export default subscribeRoutes;
