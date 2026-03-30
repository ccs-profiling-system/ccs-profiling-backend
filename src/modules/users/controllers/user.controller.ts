import { Request, Response } from 'express';

export class UserController {
  async getUsers(_req: Request, res: Response) {
    res.json({ message: 'Get users' });
  }
}
