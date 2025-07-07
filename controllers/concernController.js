const Concern = require('../models/Concern');

exports.create = async (req, res) => {
  try {
    const concern = await Concern.create(req.body);
    res.status(201).json(concern);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  const concerns = await Concern.find().populate('category');
  res.json(concerns);
};

exports.getOne = async (req, res) => {
  const concern = await Concern.findById(req.params.id).populate('category');
  if (!concern) return res.status(404).json({ error: 'Not found' });
  res.json(concern);
};

exports.update = async (req, res) => {
  const concern = await Concern.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category');
  if (!concern) return res.status(404).json({ error: 'Not found' });
  res.json(concern);
};

exports.delete = async (req, res) => {
  const concern = await Concern.findByIdAndDelete(req.params.id);
  if (!concern) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
};