const express = require('express');
const path = require('path');
const NodeRSA = require('node-rsa');
const { v4: uuidv4 } = require('uuid');
const fileUpload = require('express-fileupload');


const app = express();
const rsaKey = new NodeRSA({ b: 512 });

// Enable file upload middleware
app.use(fileUpload());

// Serve static files from the "public" folder
app.use(express.static('public'));

// GET request handler for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/upload.html'));
});

// POST request handler for the "/upload" route
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.image) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const image = req.files.image;

  // Read the image file
  const data = image.data;

  // Encrypt the image data using Node RSA
  const encryptedData = rsaKey.encrypt(data, 'base64');

  // Decrypt the encrypted data
  const decryptedData = rsaKey.decrypt(encryptedData, 'binary');

  // Set the appropriate headers for file download
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename=${uuidv4()}.png`);

  // Send the decrypted image data as the response
  res.send(Buffer.from(decryptedData, 'binary'));
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
