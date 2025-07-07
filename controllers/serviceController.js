const Service = require('../models/Service');

exports.create = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  const services = await Service.find().populate('category');
  res.json(services);
};

exports.getOne = async (req, res) => {
  const service = await Service.findById(req.params.id).populate('category');
  if (!service) return res.status(404).json({ error: 'Not found' });
  res.json(service);
};

exports.update = async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category');
  if (!service) return res.status(404).json({ error: 'Not found' });
  res.json(service);
};

exports.delete = async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
};