const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const mongoose = require('mongoose');
const Service = require('../models/Service'); // Adjust the path if needed

const CATEGORY_ID = '686b6eca7b2aa04f9d6eced1'; // Replace with your category ID

const extractData = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const serviceName = lines[0] || 'Unknown';
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

const run = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://rohit:6POhY7Io7VIpHsdy@derma.56g6nhr.mongodb.net/?retryWrites=true&w=majority&appName=Derma', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Replace with the actual file name you want to search for
    const fileName = 'AcneFacial.docx'; 
    const filePath = path.join(__dirname, "AcneFacial.docx"); // File path for the document

    // Extract data from the docx file
    const result = await mammoth.extractRawText({ path: filePath });
    const data = extractData(result.value);

    // Update the existing service document by name (case-insensitive, trimmed)
    const updated = await Service.findOneAndUpdate(
      { name: { $regex: new RegExp('^' + data.name.trim() + '$', 'i') } }, // Only search by name, ignore category
      {
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        heading: data.heading,
        introduction: data.introduction,
        content: data.content,
        faqs: data.faqs
      },
      { new: true } // Return the updated document
    );

    if (updated) {
      console.log('✅ Service updated successfully:', updated._id);
    } else {
      console.log('⚠ No service found with name:', data.name);
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err);
    mongoose.connection.close();
  }
};

run();
