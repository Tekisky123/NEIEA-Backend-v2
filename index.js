import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import donationRoutes from "./routes/donationRoutes.js";
import cors from "cors";
import donorUserRoutes from "./routes/donorUserRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import carouselRoutes from "./routes/carouselRoutes.js";
import videoCardsRoutes from "./routes/videoCardsRoutes.js";
import heroSectionRoutes from "./routes/heroSectionRoutes.js";
import bulletPointsRoutes from "./routes/bulletPointsRoutes.js";
import testimonialsRoutes from "./routes/testimonialsRoutes.js";
import sectionsRoutes from "./routes/sectionsRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import contactRouters from "./routes/contactRoutes.js";
import subscribeRoutes from "./routes/subscribeRoutes.js";
import path from 'path';
import { fileURLToPath } from 'url';
import LeadershipRoutes from "./routes/LeadershipRoutes.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();

connectDB();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE',"PATCH"],
}));

app.use("/donation", donationRoutes);
app.use("/donor", donorUserRoutes);
app.use("/admin", adminRoutes);
app.use("/course", courseRoutes);
app.use("/carousel", carouselRoutes);
app.use("/video-cards", videoCardsRoutes);
app.use("/hero-section", heroSectionRoutes);
app.use("/bullet-points", bulletPointsRoutes);
app.use("/testimonials", testimonialsRoutes);
app.use("/Leadership", LeadershipRoutes);
app.use("/sections", sectionsRoutes);
app.use("/volunteer", volunteerRoutes);
app.use("/contact", contactRouters);
app.use("/subscribe", subscribeRoutes);

app.use((err, req, res, next)=>{
    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Somthing Went Wrong!',
    })
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
