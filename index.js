const express = require('express');
const fileUpload = require('express-fileupload');
const bodyparser = require('body-parser')
const NodeRSA = require('node-rsa')
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');

const app = express();

app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(fileUpload());
app.set('view engine', 'ejs');
var publicKey = '';
var privateKey = '';
var encryptedData = '';
var fileExtension = '';
var mimeType = '';
app.get('/', (req, res) => {    
    res.render('website', {publicKey: publicKey , privateKey: privateKey , encryptedData: encryptedData});
}
);

app.post('/generate', (req, res) => {   
    const key = new NodeRSA({ b: 4096 });
     publicKey = key.exportKey('public');
     privateKey = key.exportKey('private');
     encryptedData = '';
    console.log(publicKey);
    console.log(privateKey);
    res.redirect('/');
}
);
app.post('/encrypt', (req, res) => {
    if (!req.files || !req.files.image) {
        return res.status(400).json({ error: 'No image file uploaded' });
    }
    const image = req.files.image;
    console.log(image);
    const jsonDataString = JSON.stringify(image);
    mimeType = image.mimetype;
    const data = image.data;
    console.log(req.body);
    console.log(req.body.publicKey)
    const publicKeyString = req.body.publicKey;   
    const importedpublicKey = new NodeRSA();
    importedpublicKey.importKey(publicKeyString, 'public');
    encryptedData = importedpublicKey.encrypt(jsonDataString, 'base64');    
    const txtFileName = `${uuidv4()}.txt`;
  fs.writeFileSync(txtFileName, encryptedData, 'utf-8');

  // Set the response headers for the download
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename=${txtFileName}`);

  // Stream the file to the response
  const fileStream = fs.createReadStream(txtFileName);
  fileStream.pipe(res);

  // Remove the created text file after download is complete
  fileStream.on('end', () => {
    fs.unlinkSync(txtFileName);
    
  });
    
}
);

app.post('/decrypt', (req, res) => {
  
    const privateKeyString = req.body.privateKey;

    if (!privateKeyString || !req.files || !req.files.encryptedDataFile) {
      return res.status(400).json({ error: 'Missing private key or encrypted data file' });
    }
    
    const encryptedDataFile = req.files.encryptedDataFile;
    const encryptedData = encryptedDataFile.data.toString('utf-8');
   
    const importedPrivateKey = new NodeRSA(privateKeyString, 'private');
    
    const decryptedDataString = importedPrivateKey.decrypt(encryptedData, 'utf-8');
    const decryptedData = JSON.parse(decryptedDataString);
    console.log(decryptedData);
    console.log(decryptedData.mimetype);
    res.setHeader('Content-Type', decryptedData.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename=${decryptedData.name}`);
    res.send(Buffer.from(decryptedData.data, 'binary'));

}
);
app.listen(3000, () => {
    console.log('Server started on port 3000');
}
);