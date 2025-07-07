const Category = require('../models/Category');

exports.create = async (req, res) => {
  try {
    // Only pass req.body, let the model handle slug creation
    // Remove manual slug assignment and uniqueness check
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
};

exports.getOne = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Not found' });
  res.json(category);
};

// Get category by slug
exports.getBySlug = async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) return res.status(404).json({ error: 'Not found' });
  res.json(category);
};

exports.update = async (req, res) => {
  // Do not generate or update slug here, let the model handle it
  const updateData = { ...req.body };
  // Remove slugify and uniqueness check
  const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!category) return res.status(404).json({ error: 'Not found' });
  res.json(category);
};

exports.delete = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
};