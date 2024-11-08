const AWS = require("aws-sdk");
require('dotenv').config();

AWS.config.update({
  region: "fra1", 
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
});

const spacesEndpoint = new AWS.Endpoint("https://fra1.digitaloceanspaces.com"); 
const spacesCDNURL = 'https://rubertogo.fra1.digitaloceanspaces.com'; 

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  s3ForcePathStyle: true,
  sslEnabled: true,
});


exports.upload = async (req, res) => {
  try {
    const { originalname, buffer } = req.file;

    if (!originalname || !buffer) {
      return res.status(400).json({ success: false, error: "No file uploaded." });
    }

    const fileExtension = originalname.split('.').pop();
    const newFileName = `${Date.now()}.${fileExtension}`;
    const key = `images/${newFileName}`;

    const params = {
      Bucket: 'rubertogo',  
      Key: key,
      Body: buffer,
      ACL: 'public-read', 
    };

    await s3.upload(params).promise();

    const imageURL = `${spacesCDNURL}/${key}`;
    console.log("Uploaded image URL:", imageURL);

    res.json({ success: true, imageURL });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ success: false, error: "Image upload failed" });
  }
};
