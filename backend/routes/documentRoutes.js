const express = require('express');
const router = express.Router();

// Controllers import
const {
    getDocuments,
    uploadDocument,
    queryDocument,
    analyzeRisk,
    getSummary
} = require("../controllers/documentController.js");


const { protect } = require('../middleware/authMiddleware'); // Bouncer guard
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/uploadMiddleware');

//Routes mapping 
router.get("/", protect, getDocuments);

router.post(
    "/upload",
    protect,
    upload.single("pdfFile"),
    uploadDocument
);

router.post("/query", protect, queryDocument);

router.post("/analyze-risk", protect, analyzeRisk);

router.post("/summary", protect, getSummary);


module.exports = router;



