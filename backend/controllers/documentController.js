const Document = require("../models/Document");
const axios = require("axios");
const { uploadToCloudinary } = require("../middleware/uploadMiddleware");
const path = require("path");

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:8000";

// 1. Get All Documents
const getDocuments = async (req, res) => {
    try {
        const documents = await Document
            .find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch documents" });
    }
};


// 2. Upload Document
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded!" });
        }

        const isPdf = req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith('.pdf');
        const baseName = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, "_");
        const uploadOptions = {
            folder: "legalmind-documents",
            public_id: isPdf ? `${baseName}_${Date.now()}.pdf` : `${baseName}_${Date.now()}`,
            resource_type: isPdf ? "raw" : "auto",
        };

        // Cloudinary upload directly from the saved physical disk file
        let cloudinaryPublicId = undefined;
        try {
            const result = await uploadToCloudinary(req.file.path, uploadOptions);
            cloudinaryPublicId = result.public_id;
        } catch (cloudError) {
            console.warn("Cloudinary upload bypassed (likely 10MB free tier limit). Defaulting to Local AI Server Storage.", cloudError.message);
        }

        // Point the UI safely to our static Node server uploads directory for flawlessly reliable zero-cors PDF previews
        const fs = require('fs');
        const PORT = process.env.PORT || 5000;
        const localFileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

        const newDoc = await Document.create({
            userId: req.user._id,
            title: req.file.originalname,
            fileUrl: localFileUrl, // Safe local preview URL overriding Cloudinary
            cloudinaryPublicId: cloudinaryPublicId
        });

        let aiEngineOutput = null;
        try {
            const FormData = require('form-data');
            const data = new FormData();

            // Read the saved physical file off disk memory as a stream to pass into AI
            data.append('file', fs.createReadStream(req.file.path));
            data.append('document_id', newDoc._id.toString());

            const pythonResponse = await axios.post(
                `${AI_ENGINE_URL}/ai/ingest-file`,
                data,
                {
                    headers: {
                        ...data.getHeaders()
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity
                }
            );

            newDoc.status = "Ingested";
            await newDoc.save();
            aiEngineOutput = pythonResponse.data;
        } catch (aiError) {
            const aiDetail = aiError.response?.data?.detail || aiError.message;
            console.error("AI ingestion failed:", aiDetail);
        }

        res.status(201).json({
            message: "File uploaded successfully",
            document: newDoc,
            aiEngineOutput,
            warning: aiEngineOutput ? undefined : "File uploaded but AI ingestion is pending"
        });

    } catch (error) {
        res.status(500).json({
            message: "Upload failed",
            error: error.message
        });
    }
};


// 3. Query
const queryDocument = async (req, res) => {
    try {
        const { document_id, user_query } = req.body;

        const pythonResponse = await axios.post(
            `${AI_ENGINE_URL}/ai/query`,
            { document_id, user_query }
        );

        res.json(pythonResponse.data);

    } catch (error) {
        res.status(500).json({ error: "Query failed" });
    }
};


// 4. Risk
const analyzeRisk = async (req, res) => {
    try {
        const { document_id } = req.body;

        const pythonResponse = await axios.post(
            `${AI_ENGINE_URL}/ai/analyze-risk`,
            { document_id }
        );

        res.json(pythonResponse.data);

    } catch (error) {
        res.status(500).json({ error: "Risk failed" });
    }
};


// 5. Summary
const getSummary = async (req, res) => {
    try {
        const { document_id } = req.body;

        const pythonResponse = await axios.post(
            `${AI_ENGINE_URL}/ai/summary`,
            { document_id }
        );

        res.json(pythonResponse.data);

    } catch (error) {
        res.status(500).json({ error: "Summary failed" });
    }
};


module.exports = {
    getDocuments,
    uploadDocument,
    queryDocument,
    analyzeRisk,
    getSummary
};