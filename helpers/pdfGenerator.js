const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const AWS = require('aws-sdk');
const Booking = require('../Models/Booking.Schema');
const Van = require('../Models/Van.Schema');
const ContractRule = require('../Models/ContractRule.Schema');
const ContractPDF = require('../Models/ContractPDF.Schema');
const User = require('../Models/User.Schema');
const Driver = require('../Models/Driver.Schema'); 
require('dotenv').config();

const sendEmail = require("../utils/sendEmail");


AWS.config.update({
  region: "fra1",
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY
});
const spacesEndpoint = new AWS.Endpoint("https://fra1.digitaloceanspaces.com");
const s3 = new AWS.S3({ endpoint: spacesEndpoint, s3ForcePathStyle: true, sslEnabled: true });

const generatePDF = async (htmlContent) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'image') {
      request.continue();
    } else {
      request.continue();
    }
  });

  const styledHtmlContent = `
    <style>
      /* General page styling */
      @page {
        size: A4;
        margin-top: 10mm; 
        margin-bottom:10mm;
      }
      
      /* First page specific styling */
      @page :first {
        margin: 0;
      }
      
      /* Additional content styling if needed */
      body {
        font-family: Arial, sans-serif;
      }
    </style>
    ${htmlContent}
  `;

  await page.setContent(styledHtmlContent, { waitUntil: 'domcontentloaded' });

  // Wait until all images are fully loaded
  await page.evaluate(() => {
    const images = Array.from(document.images);
    return Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));
  });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    footerTemplate: '<div style="text-align: center; font-size: 10px; color: #999;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    headerTemplate: '<div></div>'
  });

  await browser.close();
  return pdfBuffer;
};


const createContractPDF = async (bookingId, language = 'en') => {
  try {
    const existingContract = await ContractPDF.findOne({ bookingId });
    if (existingContract) {
      return existingContract.pdfLink;
    }
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== 'accepted') throw new Error('Invalid or unaccepted booking');
    
    const user = await User.findById(booking.userId);
    if (!user) throw new Error('User not found');
    
    const van = await Van.findById(booking.vanId);
    if (!van) throw new Error('Van not found');

    let driver = null;
    if (booking.driverId) {
      driver = await Driver.findById(booking.driverId);
    }

    const generateContractNumber = () => {
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); 
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      return `${datePart}-${randomPart}`;
    };

    const contractRules = await ContractRule.find();
    const rulesText = contractRules.map(rule => rule.title[language] || rule.title.en).join('<br>');

    const templatePath = path.join(__dirname, 'pdf.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    const replacements = {
      contractNumber: generateContractNumber(),
      date: new Date().toLocaleDateString('en-GB'),
      companyName: 'Ruberto Go',
      companyAddress: 'Via Giuseppe Maggi 10, 6963 Lugano, Switzerland',
      companyPhone: '+41767678328',
      companyEmail: 'info@rubertogo.ch',
      clientName: `${user.firstName || ''} ${user.lastName || ''}`,
      clientAddress: user.address || 'N/A',
      clientDOB: user.dob || 'N/A',
      clientPhone: user.phone || 'N/A',
      clientEmail: user.email || 'N/A',
      pickupLocation: van.location?.address || 'N/A',
      dropoffLocation: van.location?.address || 'N/A',
      rentalPeriod: `${booking.startDate || 'N/A'} | ${booking.startTime || 'N/A'} to ${booking.endDate || 'N/A'} | ${booking.endTime || 'N/A'}`,
      priceperhour: van.pricePerHour  || 'N/A',
      totalPrice: booking.totalPrice || 'N/A',
      vehicle: van.name?.en || 'N/A',
      licensePlate: van.plateNumber || 'N/A',
      fuelType: van.fuelType || 'N/A',
      insuranceDeductible: booking.insuranceDeductible || 'N/A',
      securityDeposit: booking.securityDeposit || 'N/A',
      contractRules: rulesText || 'N/A',
      driverName: driver ? `${driver.firstName || ''} ${driver.lastName || ''}` : 'N/A',
      driverAddress: driver?.driverAddress || 'N/A',
      driverPhone: driver?.phone || 'N/A',
      driverLicenseFront: driver?.licenseFront || 'N/A',
      driverLicenseBack: driver?.licenseBack || 'N/A'
    };


    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, replacements[key]);
    });

    if (!driver) {
      const driverSectionRegex = /<div class="section">\s*<h3>Driver Information<\/h3>.*?<\/div>/gs;
      html = html.replace(driverSectionRegex, '');
    }

    if (van.contractImages && van.contractImages.length > 0) {
      const contractImagesHTML = van.contractImages.map(image => `
        <div>
          <p style="font-weight: bold; color: #004d99; margin-bottom: 8px">Damage Type: ${image.damageType}</p>
          <div style="width: 100%; height: 150px; background-color: #e6e6e6; text-align: center; display: flex; align-items: center; justify-content: center;">
            <img src="${image.image}" alt="Damage Image" style="max-width: 100%; max-height: 100%;"/>
          </div>
          <p style="margin-top: 10px; font-size: 14px">${image.description || 'No description provided.'}</p>
        </div>
      `).join('');
      
      html = html.replace('{{contractImagesSection}}', `
        <div  style="margin-top: 20px">
          <h3 style="color: #004d99; text-align: center; font-size: 20px">Damage Report</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; padding: 20px; background-color: #ffffff; border: 1px solid #ddd;">
            ${contractImagesHTML}
          </div>
        </div>
      `);
    } else {
      html = html.replace('{{contractImagesSection}}', '');
    }

    const pdfBuffer = await generatePDF(html);
    const pdfKey = `contracts/contract_${bookingId}.pdf`;
    const params = { Bucket: 'rubertogo', Key: pdfKey, Body: pdfBuffer, ContentType: 'application/pdf', ACL: 'public-read' };
    const uploadResponse = await s3.upload(params).promise();
    
    const pdfURL = uploadResponse.Location;
    await ContractPDF.create({ bookingId: booking._id, pdfLink: pdfURL });
    await sendEmail({
      subject: `Your Rental Contract - ${generateContractNumber()}`,
      customizedMessage: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f7f9fc;
                color: #333;
                margin: 0;
                padding: 0;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(90deg, #ff0000, #ff4d4d);
                color: #ffffff;
                text-align: center;
                padding: 20px;
                font-size: 24px;
                font-weight: bold;
              }
              .content {
                padding: 20px 30px;
              }
              .contract-info {
                background-color: #ff6f61;
                color: #ffffff;
                font-size: 18px;
                font-weight: bold;
                padding: 10px 20px;
                border-radius: 5px;
                text-align: center;
                margin: 20px 0;
              }
              .message {
                font-size: 16px;
                color: #555;
                line-height: 1.6;
              }
              .footer {
                text-align: center;
                font-size: 12px;
                color: #aaa;
                padding: 20px;
                background-color: #f1f1f1;
              }
              .footer a {
                color: #ff6f61;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                Ruberto Go Rental Contract
              </div>
              <div class="content">
                <p class="message">Dear ${user.firstName},</p>
                <p class="message">
                  Thank you for choosing <strong>Ruberto Go</strong> for your rental needs. Attached to this email is your rental contract, containing all the details of your booking.
                  Please review it carefully and keep it for your records.
                </p>
                <div class="contract-info">Contract Number: ${generateContractNumber()}</div>
                <h3 style="color: #004d99; font-weight: bold;">Booking Details</h3>
                <ul style="list-style-type: none; padding: 0; font-size: 16px; color: #555;">
                  <li><strong>Vehicle:</strong> ${van.name?.en || 'N/A'}</li>
                  <li><strong>License Plate:</strong> ${van.plateNumber || 'N/A'}</li>
                  <li><strong>Rental Period:</strong> ${booking.startDate} | ${booking.startTime} to ${booking.endDate} | ${booking.endTime}</li>
                  <li><strong>Total Price:</strong> ${booking.totalPrice || 'N/A'}</li>
                </ul>
                <p class="message">
                  If you have any questions or need further assistance, please don't hesitate to contact our support team.
                </p>
              </div>
              <div class="footer">
                <p>Need help? <a href="mailto:support@rubertogo.com">Contact Support</a></p>
                <p>Ruberto Go, Inc. | All rights reserved &copy; ${new Date().getFullYear()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      send_to: user.email,
      sent_from: "info@rubertogo.com",
      attachment: {
        filename: `contract_${bookingId}.pdf`,
        content: pdfBuffer,
      },
    });
    
    return pdfURL;
  } catch (error) {
    console.error('Error generating contract PDF:', error);
    throw new Error('Failed to generate contract PDF');
  }
};

module.exports = { createContractPDF };
