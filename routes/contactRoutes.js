import express from "express";
const contactRouters = express.Router();
import { createContact } from "../controllers/contactController.js";

contactRouters.post("/", createContact);

export default contactRouters;
