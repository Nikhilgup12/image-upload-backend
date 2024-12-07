const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const dbpath1 = path.join(__dirname, "images.db"); 
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
const multer = require('multer');
let db = null;
const PORT = process.env.PORT || 3000;

const initialize = async () => {
  try {
    db = await open({
      filename: dbpath1,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.log(`Error message ${e.message}`);
    process.exit(1);
  }
};
initialize();


// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory for uploads
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Route to upload an image
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // File details
    const fileName = req.file.filename;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;

    // Insert file info into the database
    db.run(`INSERT INTO images (name, url) VALUES (?, ?)`, [fileName, fileUrl], function (err) {
        if (err) {
            console.error('Error saving to database:', err);
            return res.status(500).send('Error saving file info.');
        }

        res.status(200).json({
            message: 'File uploaded successfully!',
            file: {
                id: this.lastID,
                name: fileName,
                url: fileUrl
            }
        });
    });
});

// Route to get all uploaded images
app.get('/images', (req, res) => {
    db.all(`SELECT * FROM images`, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving images:', err);
            return res.status(500).send('Error retrieving images.');
        }

        res.status(200).json({
            images: rows
        });
    });
});

