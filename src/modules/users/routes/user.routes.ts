import { Router } from 'express';

export const userRoutes = Router();

userRoutes.get('/', (req, res) => {
  res.json({ message: 'Users endpoint' });
});
