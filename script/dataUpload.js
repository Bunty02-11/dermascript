const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const mongoose = require('mongoose');
const Service = require('../models/Service');
const Concern = require('../models/Concern');
const Special = require('../models/SpecialProduct');

const CATEGORY_ID = '686b6eca7b2aa04f9d6eced1'; // Replace with your category ID

const extractData = (text, fileName) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  let serviceName = lines[0] || 'Unknown';

  // If the filename contains a '+', replace ' with ' or 'with' (case-insensitive) in the name with '+'
  if (fileName.includes('+')) {
    serviceName = serviceName.replace(/\s*with\s*/i, ' + ');
  }

  console.log('Service Name:', serviceName);

  const data = {
    name: serviceName,
    category: CATEGORY_ID,
    meta_title: '',
    meta_description: '',
    heading: '',
    introduction: '',
    content: [],
    faqs: []
  };

  let i = 0;

  // Skip the name line
  i++;

  // Find and set meta_title
  while (i < lines.length && !lines[i].toLowerCase().startsWith('meta title')) i++;
  if (i < lines.length && lines[i].toLowerCase().startsWith('meta title')) {
    data.meta_title = lines[++i] || '';
    i++;
  }

  // Find and set meta_description
  while (i < lines.length && !lines[i].toLowerCase().startsWith('meta description')) i++;
  if (i < lines.length && lines[i].toLowerCase().startsWith('meta description')) {
    data.meta_description = lines[++i] || '';
    i++;
  }

  // Set heading
  while (i < lines.length && !lines[i]) i++;
  if (i < lines.length) {
    data.heading = lines[i];
    i++;
  }

  // Set introduction
  while (i < lines.length && !lines[i]) i++;
  if (i < lines.length) {
    data.introduction = lines[i];
    i++;
  }

  // Parse content (title/body pairs) until 'faqs'
  while (i < lines.length && lines[i].toLowerCase() !== 'faqs') {
    const title = lines[i];
    const body = lines[i + 1] && lines[i + 1].toLowerCase() !== 'faqs' ? lines[i + 1] : '';
    if (
      title &&
      title !== data.heading &&
      title !== data.introduction &&
      title.toLowerCase() !== 'meta title:' &&
      title.toLowerCase() !== 'meta description:'
    ) {
      data.content.push({ title, body });
    }
    i += body ? 2 : 1;
  }

  // Parse faqs
  while (i < lines.length && lines[i].toLowerCase() !== 'faqs') i++;
  if (i < lines.length && lines[i].toLowerCase() === 'faqs') i++;
  while (i < lines.length) {
    const question = lines[i];
    const answer = lines[i + 1] || '';
    if (question && question.endsWith('?')) {
      data.faqs.push({ question, answer });
      i += 2;
    } else {
      i++;
    }
  }

  return data;
};

const normalizeName = (name) =>
  name
    .replace(/\s*with\s*/gi, ' + ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const getFileNameWithoutExtension = (filePath) => {
  const fileName = path.basename(filePath);
  return fileName.replace(/\.docx$/i, '');
};

const processDocxFile = async (filePath, models) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const data = extractData(result.value, path.basename(filePath));

    const fileNameWithoutExt = getFileNameWithoutExtension(filePath);
    const normalizedFileName = normalizeName(fileNameWithoutExt);
    console.log(`🔍 Looking for document with normalized filename: "${normalizedFileName}"`);

    let matchedModel = null;
    let matchedDoc = null;

    // Search through all models to find a match
    for (const model of models) {
      const allDocs = await model.find({});
      const match = allDocs.find(doc => {
        const docName = normalizeName(doc.name);
        return docName === normalizedFileName;
      });
      
      if (match) {
        matchedModel = model;
        matchedDoc = match;
        break;
      }
    }

    if (!matchedDoc) {
      console.log(`⚠ [${path.basename(filePath)}] No matching document found in any collection with normalized filename: "${normalizedFileName}"`);
      return;
    }

    const updated = await matchedModel.findByIdAndUpdate(
      matchedDoc._id,
      {
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        heading: data.heading,
        introduction: data.introduction,
        content: data.content,
        faqs: data.faqs
      },
      { new: true }
    );

    if (updated) {
      console.log(`✅ [${path.basename(filePath)}] ${matchedModel.modelName} updated successfully:`, updated._id);
    } else {
      console.log(`⚠ [${path.basename(filePath)}] Failed to update ${matchedModel.modelName}:`, matchedDoc._id);
    }
  } catch (err) {
    console.error(`❌ [${path.basename(filePath)}] Error:`, err);
  }
};

const run = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://rohit:6POhY7Io7VIpHsdy@derma.56g6nhr.mongodb.net/?retryWrites=true&w=majority&appName=Derma', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const servicesDir = path.join(__dirname, 'services');
    if (!fs.existsSync(servicesDir)) {
      console.log('No "services" directory found.');
      return;
    }

    const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.docx'));
    if (files.length === 0) {
      console.log('No .docx files found in the services directory.');
      return;
    }

    // All models to search through
    const models = [Service, Concern, Special];

    for (const file of files) {
      const filePath = path.join(servicesDir, file);
      await processDocxFile(filePath, models);
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err);
    mongoose.connection.close();
  }
};

run();