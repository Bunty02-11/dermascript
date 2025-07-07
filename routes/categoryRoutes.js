const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoryController');

router.post('/', controller.create);
router.get('/', controller.getAll);
router.get('/slug/:slug', controller.getBySlug); // Add this route before :id to avoid conflict
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
