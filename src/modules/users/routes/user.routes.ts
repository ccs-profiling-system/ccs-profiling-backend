import { Router } from 'express';

export const userRoutes = Router();

userRoutes.get('/', (_req, res) => {
  res.json({ message: 'Users endpoint' });
});
