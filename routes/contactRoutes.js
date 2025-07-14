const express = require('express');
const router = express.Router();
const controller = require('../controllers/contactController');

router.post('/', controller.create);
router.get('/', controller.getAll);
router.get('/status/:status', controller.getByStatus);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.delete);

module.exports = router; 