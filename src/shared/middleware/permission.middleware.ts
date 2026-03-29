import { Request, Response, NextFunction } from 'express';

export const permissionMiddleware = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};
