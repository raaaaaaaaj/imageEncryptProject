const express = require('express');
const fileUpload = require('express-fileupload');
const bodyparser = require('body-parser')
const NodeRSA = require('node-rsa')
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const ejs = require('ejs');

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
    mimeType = image.mimetype;
    const data = image.data;
     fileExtension = path.extname(image.name).toLowerCase();
    console.log('File extension:', fileExtension);
    console.log(req.body);
    console.log(req.body.publicKey)
    const publicKeyString = req.body.publicKey;   
    const importedpublicKey = new NodeRSA();
    importedpublicKey.importKey(publicKeyString, 'public');
    encryptedData = importedpublicKey.encrypt(data, 'base64');    
    res.redirect('/');
    
}
);

app.post('/decrypt', (req, res) => {
    console.log(req.body);
    const privateKeyString = req.body.privateKey;
    const encryptedDataString = req.body.ecncryptedData;
    const importedprivateKey = new NodeRSA();
    importedprivateKey.importKey(privateKeyString, 'private');
    const decryptedData = importedprivateKey.decrypt(encryptedDataString, 'binary');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename=${uuidv4()}${fileExtension}`);
    res.send(Buffer.from(decryptedData, 'binary'));

    

}
);
app.listen(3000, () => {
    console.log('Server started on port 3000');
}
);