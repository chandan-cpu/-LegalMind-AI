const express = require('express');
const router = express.Router();
const axios = require('axios'); // Python ko call karne ke liye
const Document = require('../models/Document');
const { protect } = require('../middleware/authMiddleware'); // Bouncer guard
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/uploadMiddleware');

// --- Get All User Documents Route ---
// Ye API login hue user ko uske saare previously uploaded documents list out karke degi.
router.get('/', protect, async (req, res) => {
    try {
        // Sirf wahi documents find karo jinme current user ki ID ho (taaki private rahe)
        // sort({ createdAt: -1 }) ka matlab latest uploaded file list mein sabse upar dikhe
        const documents = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});

// --- 2. Upload API Route (Cloudinary) ---
router.post('/upload', protect, upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Koi file upload nahi hui!" });
        }

        console.log("File RAM mein hai, ab Cloudinary pe bhejte hain...");

        // a. File buffer ko Cloudinary pe upload karo
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
            folder: 'legalmind-documents',
            resource_type: 'auto',
            public_id: `doc-${Date.now()}`,
        });

        const cloudinaryUrl = cloudinaryResult.secure_url;
        const cloudinaryPublicId = cloudinaryResult.public_id;

        // b. Database me file ki details save karo (Cloudinary URL ke saath)
        const newDoc = await Document.create({
            userId: req.user._id,
            title: req.file.originalname,
            fileUrl: cloudinaryUrl,
            cloudinaryPublicId: cloudinaryPublicId,
        });

        console.log("✅ File Cloudinary pe save ho gayi:", cloudinaryUrl);

        // c. Python AI Engine ko Cloudinary URL bhejo (optional - agar AI down ho toh bhi upload succeed kare)
        let aiEngineOutput = null;
        let aiEngineError = null;

        try {
            console.log("Ab Python AI Engine ko jagate hain...");
            const pythonResponse = await axios.post('http://127.0.0.1:8000/ai/ingest', {
                file_url: cloudinaryUrl,
                document_id: newDoc._id.toString()
            });
            aiEngineOutput = pythonResponse.data;
            // Database update: AI processing complete
            newDoc.status = 'Ingested';
            await newDoc.save();
            console.log("✅ AI Engine ne process kar diya!");
        } catch (aiError) {
            console.warn("⚠️ AI Engine unavailable:", aiError.message);
            aiEngineError = "AI Engine is offline. File uploaded to Cloudinary successfully. Ingest will happen when AI Engine is running.";
            // Status stays 'Uploaded' - will be ingested later
        }

        res.status(201).json({
            message: 'File successfully uploaded to Cloudinary',
            document: newDoc,
            aiEngineOutput,
            aiEngineError,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
});


// --- 6. Delete Document Route (Cloudinary) ---
router.delete('/:id', protect, async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }

        // Make sure the document belongs to the logged-in user
        if (doc.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this document" });
        }

        // Delete from Cloudinary if public_id exists
        if (doc.cloudinaryPublicId) {
            await deleteFromCloudinary(doc.cloudinaryPublicId, 'raw');
            console.log("File Cloudinary se delete ho gayi:", doc.cloudinaryPublicId);
        }

        // Delete from MongoDB
        await doc.deleteOne();

        res.json({ message: "Document deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
});

// --- 3. Chatbot Query Proxy Route ---
router.post('/query', protect, async (req, res) => {
    try {
        const { document_id, user_query } = req.body;
        // Node.js direct Python Engine ko bhejega sawal bina kisi ko bataye
        const pythonResponse = await axios.post('http://127.0.0.1:8000/ai/query', {
             user_query, document_id 
        });
        res.json(pythonResponse.data); // Answer react frontend ko return kiya
    } catch (error) {
        res.status(500).json({ error: "Failed connecting to AI Engine" });
    }
});

// --- 4. Risk Analysis Proxy Route ---
router.post('/analyze-risk', protect, async (req, res) => {
    try {
        const { document_id } = req.body;
        const pythonResponse = await axios.post('http://127.0.0.1:8000/ai/analyze-risk', { document_id });
        res.json(pythonResponse.data);
    } catch (error) {
        res.status(500).json({ error: "Failed analyzing risk via AI Engine" });
    }
});

// --- 5. Document Summary Proxy Route ---
router.post('/summary', protect, async (req, res) => {
    try {
        const { document_id } = req.body;
        const pythonResponse = await axios.post('http://127.0.0.1:8000/ai/summary', { document_id });
        res.json(pythonResponse.data);
    } catch (error) {
        res.status(500).json({ error: "Failed getting summary via AI Engine" });
    }
});


module.exports = router;
