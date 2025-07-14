const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const mongoose = require('mongoose');
const Service = require('../models/Service');
const Concern = require('../models/Concern');
const Special = require('../models/SpecialProduct');

const CATEGORY_ID = '686b6eca7b2aa04f9d6eced1'; // Replace with your category ID

// Array to store documents not found in the database
const notFoundDocuments = [];

// Special name mappings for known mismatches
const specialNameMappings = {
  'mommy makeover': 'mami makeover',
  // Add more mappings as needed
};

const extractData = (text, fileName) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // Use the file name as the service name instead of extracting from content
  let serviceName = fileName.replace(/\.docx$/i, '');

  console.log('Service Name from file:', serviceName);

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

  // Debug: Print all lines for inspection
  console.log('Total lines in document:', lines.length);

  let i = 0;
  let contentStartIndex = 0;

  // First, look for meta title and meta description
  for (i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.toLowerCase().startsWith('meta title:')) {
      // Extract meta title (everything after "Meta Title:")
      data.meta_title = line.substring('meta title:'.length).trim();
      console.log('Found meta_title:', data.meta_title);
    } 
    else if (line.toLowerCase().startsWith('meta description:')) {
      // Extract meta description (everything after "Meta Description:")
      data.meta_description = line.substring('meta description:'.length).trim();
      console.log('Found meta_description:', data.meta_description);
      
      // Meta description is typically the last of the meta fields
      // The next non-empty line should be the heading
      contentStartIndex = i + 1;
      break;
    }
  }

  // Find heading and introduction
  // Heading is the first non-empty line after meta description
  // Introduction is the paragraph after the heading
  if (contentStartIndex > 0) {
    // Skip any empty lines
    while (contentStartIndex < lines.length && !lines[contentStartIndex]) {
      contentStartIndex++;
    }
    
    // First non-empty line after meta description is the heading
    if (contentStartIndex < lines.length) {
      data.heading = lines[contentStartIndex];
      console.log('Found heading:', data.heading);
      contentStartIndex++;
      
      // Skip any empty lines
      while (contentStartIndex < lines.length && !lines[contentStartIndex]) {
        contentStartIndex++;
      }
      
      // Next non-empty line is the introduction
      if (contentStartIndex < lines.length) {
        data.introduction = lines[contentStartIndex];
        console.log('Found introduction:', data.introduction);
        contentStartIndex++;
      }
    }
  }

  // Process content (title/body pairs) until 'faqs'
  i = contentStartIndex;
  while (i < lines.length) {
    // Check if we've reached the FAQs section
    if (lines[i] && lines[i].toLowerCase() === 'faqs') {
      i++;
      break;
    }
    
    // Skip empty lines
    if (!lines[i]) {
      i++;
      continue;
    }
    
    // Current line is a title
    const title = lines[i];
    i++;
    
    // Skip empty lines between title and body
    while (i < lines.length && !lines[i]) {
      i++;
    }
    
    // Next non-empty line is the body
    let body = '';
    if (i < lines.length && lines[i].toLowerCase() !== 'faqs') {
      body = lines[i];
      i++;
    }
    
    // Add to content if it's not a duplicate of heading/introduction
    if (title && title !== data.heading && title !== data.introduction) {
      data.content.push({ title, body });
      console.log('Found content item:', title);
    }
  }

  // Process FAQs
  while (i < lines.length) {
    // Skip empty lines
    if (!lines[i]) {
      i++;
      continue;
    }
    
    const question = lines[i];
    i++;
    
    // Skip empty lines between question and answer
    while (i < lines.length && !lines[i]) {
      i++;
    }
    
    let answer = '';
    if (i < lines.length) {
      answer = lines[i];
      i++;
    }
    
    if (question && question.endsWith('?')) {
      data.faqs.push({ question, answer });
      console.log('Found FAQ:', question);
    }
  }

  return data;
};

const normalizeName = (name) => {
  let normalized = name
    .replace(/\s*with\s*/gi, ' + ')
    .replace(/[\s\-_]+/g, ' ') // Replace hyphens, underscores and multiple spaces with a single space
    .trim()
    .toLowerCase();
  
  // Apply special mappings if they exist
  if (specialNameMappings[normalized]) {
    normalized = specialNameMappings[normalized];
  }
  
  return normalized;
};

// Calculate similarity between two strings (0-1 where 1 is exact match)
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // If either string contains the other, consider it highly similar
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }
  
  // Count matching words
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    if (word1.length <= 2) continue; // Skip very short words
    for (const word2 of words2) {
      if (word2.length <= 2) continue; // Skip very short words
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        break;
      }
    }
  }
  
  // Calculate similarity score
  const totalWords = Math.max(words1.length, words2.length);
  return totalWords > 0 ? matchCount / totalWords : 0;
};

const getFileNameWithoutExtension = (filePath) => {
  const fileName = path.basename(filePath);
  return fileName.replace(/\.docx$/i, '');
};

const processDocxFile = async (filePath, models) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const fileName = path.basename(filePath);
    const data = extractData(result.value, fileName);

    // Debug: Print extracted data
    console.log('Extracted data structure:', JSON.stringify({
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      heading: data.heading,
      introduction: data.introduction,
      content_count: data.content.length,
      faqs_count: data.faqs.length
    }, null, 2));

    const fileNameWithoutExt = getFileNameWithoutExtension(filePath);
    const normalizedFileName = normalizeName(fileNameWithoutExt);
    console.log(`🔍 Looking for document with normalized filename: "${normalizedFileName}"`);

    let matchedModel = null;
    let matchedDoc = null;
    let highestSimilarity = 0.7; // Threshold for similarity match

    // Search through all models to find a match based on file name
    for (const model of models) {
      const allDocs = await model.find({});
      
      // First try exact match
      let match = allDocs.find(doc => {
        const docName = normalizeName(doc.name);
        return docName === normalizedFileName;
      });
      
      // If no exact match, try similarity matching
      if (!match) {
        for (const doc of allDocs) {
          const docName = normalizeName(doc.name);
          const similarity = calculateSimilarity(docName, normalizedFileName);
          
          if (similarity > highestSimilarity) {
            match = doc;
            highestSimilarity = similarity;
            matchedModel = model;
          }
        }
      } else {
        matchedModel = model;
        matchedDoc = match;
        console.log(`✓ Found exact match in ${model.modelName}: "${match.name}"`);
        break;
      }
      
      if (match && !matchedDoc) {
        matchedDoc = match;
        console.log(`✓ Found similar match in ${model.modelName}: "${match.name}" (similarity: ${(highestSimilarity * 100).toFixed(1)}%)`);
      }
    }

    if (!matchedDoc) {
      console.log(`⚠ [${fileName}] No matching document found in any collection with normalized filename: "${normalizedFileName}"`);
      // Add to notFoundDocuments array
      notFoundDocuments.push({
        fileName: fileName,
        normalizedName: normalizedFileName,
        extractedData: data
      });
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
      console.log(`✅ [${fileName}] ${matchedModel.modelName} updated successfully:`, updated._id);
      console.log('Updated data:', {
        meta_title: updated.meta_title,
        meta_description: updated.meta_description,
        heading: updated.heading,
        introduction: updated.introduction
      });
    } else {
      console.log(`⚠ [${fileName}] Failed to update ${matchedModel.modelName}:`, matchedDoc._id);
    }
  } catch (err) {
    console.error(`❌ [${path.basename(filePath)}] Error:`, err);
  }
};

const saveNotFoundDocumentsToJson = () => {
  if (notFoundDocuments.length === 0) {
    console.log('All documents were found in the database. No JSON file created.');
    return;
  }
  
  const outputPath = path.join(__dirname, 'not_found_documents.json');
  fs.writeFileSync(outputPath, JSON.stringify(notFoundDocuments, null, 2), 'utf8');
  console.log(`📝 Created JSON file with ${notFoundDocuments.length} not found documents at: ${outputPath}`);
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

    // Save not found documents to JSON file
    saveNotFoundDocumentsToJson();

    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err);
    mongoose.connection.close();
  }
};

run();