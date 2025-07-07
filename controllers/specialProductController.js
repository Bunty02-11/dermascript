const SpecialProduct = require('../models/SpecialProduct');

exports.create = async (req, res) => {
  try {
    const product = await SpecialProduct.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  const products = await SpecialProduct.find().populate('category');
  res.json(products);
};

exports.getOne = async (req, res) => {
  const product = await SpecialProduct.findById(req.params.id).populate('category');
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
};

exports.update = async (req, res) => {
  const product = await SpecialProduct.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category');
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
};

exports.delete = async (req, res) => {
  const product = await SpecialProduct.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
};