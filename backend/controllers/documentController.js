const Document = require("../models/Document");
const axios = require("axios");
const { uploadToCloudinary } = require("../middleware/uploadMiddleware");

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

        const result = await uploadToCloudinary(req.file.buffer);

        const newDoc = await Document.create({
            userId: req.user._id,
            title: req.file.originalname,
            fileUrl: result.secure_url,
            cloudinaryPublicId: result.public_id
        });

        const pythonResponse = await axios.post(
            "http://127.0.0.1:8000/ai/ingest",
            {
                file_url: result.secure_url,
                document_id: newDoc._id.toString()
            }
        );

        newDoc.status = "Ingested";
        await newDoc.save();

        res.status(201).json({
            message: "File uploaded successfully",
            document: newDoc,
            aiEngineOutput: pythonResponse.data
        });

    } catch (error) {
        res.status(500).json({
            message: "Upload failed",
            error: error.message
        });
    }
};
console.log("Document controller loaded successfully.",Error);


// 3. Query
const queryDocument = async (req, res) => {
    try {
        const { document_id, user_query } = req.body;

        const pythonResponse = await axios.post(
            "http://127.0.0.1:8000/ai/query",
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
            "http://127.0.0.1:8000/ai/analyze-risk",
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
            "http://127.0.0.1:8000/ai/summary",
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