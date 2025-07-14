const DiscountService = require('../models/DiscountService');

exports.create = async (req, res) => {
  try {
    const discountService = await DiscountService.create(req.body);
    res.status(201).json(discountService);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const discountServices = await DiscountService.find().sort({ validUntil: 1 });
    res.json(discountServices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActive = async (req, res) => {
  try {
    const currentDate = new Date();
    const discountServices = await DiscountService.find({ 
      validUntil: { $gte: currentDate },
      active: true
    }).sort({ validUntil: 1 });
    res.json(discountServices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const discountService = await DiscountService.findById(req.params.id);
    if (!discountService) return res.status(404).json({ error: 'Discount service not found' });
    res.json(discountService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const discountService = await DiscountService.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!discountService) return res.status(404).json({ error: 'Discount service not found' });
    res.json(discountService);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const discountService = await DiscountService.findByIdAndDelete(req.params.id);
    if (!discountService) return res.status(404).json({ error: 'Discount service not found' });
    res.json({ message: 'Discount service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 