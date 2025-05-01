import express from 'express';
const router = express.Router();

// Sample asset routes
router.get('/', (req, res) => {
  res.send('Get all assets');
});

router.get('/:id', (req, res) => {
  res.send(`Get asset with ID: ${req.params.id}`);
});

router.post('/', (req, res) => {
  res.send('Create a new asset');
});

router.put('/:id', (req, res) => {
  res.send(`Update asset with ID: ${req.params.id}`);
});

router.delete('/:id', (req, res) => {
  res.send(`Delete asset with ID: ${req.params.id}`);
});

export default router;
