const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const categoryRoutes = require('./routes/categoryRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const concernRoutes = require('./routes/concernRoutes');
const specialProductRoutes = require('./routes/specialProductRoutes');
const blogRoutes = require('./routes/blogRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const discountServiceRoutes = require('./routes/discountServiceRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-country']
}));

// Use this for local MongoDB
// mongoose.connect('mongodb://localhost:27017/dermatech', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

// Use this for MongoDB Atlas cloud connection
mongoose.connect('mongodb+srv://rohit:6POhY7Io7VIpHsdy@derma.56g6nhr.mongodb.net/?retryWrites=true&w=majority&appName=Derma', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use('/api/categories', categoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/concerns', concernRoutes);
app.use('/api/specialproducts', specialProductRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/discountservices', discountServiceRoutes);
app.use('/api/contacts', contactRoutes);

app.listen(8000, () => {
  console.log('Server running on port 8000');
});
