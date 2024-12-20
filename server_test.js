const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const cors = require('cors');

// Telegram Bot Token
const botToken = '7919464382:AAEF4l9DtTq9sumNeutTqP-TBEF2-nCXpUs'; // Replace with your bot's token

// Folder to store images
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir); // Create directory if it doesn't exist
}

// Enable CORS for your Flutter app domain
app.use(cors());

// Default /file route
app.get('/file', (req, res) => {
  const getUpdatesUrl = `https://api.telegram.org/bot${botToken}/getUpdates`;

  res.send(`
    <html>
      <head>
        <title>File Route</title>
      </head>
      <body>
        <h1>File Route</h1>
        <p>To fetch updates, click the link below:</p>
        <a href="${getUpdatesUrl}" target="_blank">Get Updates</a>
        <p>Add "file_id" value after "https://your-server.com/file/{file_id}"</p>
      </body>
    </html>
  `);
});

// Serve images dynamically, convert to base64, and return as a JSON response
app.get('/file/:id', async (req, res) => {
  const fileId = req.params.id;

  try {
    // Fetch file path from Telegram
    const fileResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const filePath = fileResponse.data.result.file_path;

    // Fetch the file from Telegram
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    // Get the original filename (last part of the file path)
    const originalFileName = path.basename(filePath);

    // Ensure the filename ends with ".jpg"
    const fileName = originalFileName.endsWith('.jpg') ? originalFileName : `${originalFileName}.jpg`;

    // Full path to save the file
    const fileFullPath = path.join(imagesDir, fileName);

    // Save the file locally
    fs.writeFileSync(fileFullPath, response.data);

    // Convert the image file to base64
    const imageBuffer = fs.readFileSync(fileFullPath);
    const base64Image = imageBuffer.toString('base64');
    
    // Send the base64-encoded image as a response
    res.json({ base64Image: `data:image/jpeg;base64,${base64Image}` });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Image not found');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
