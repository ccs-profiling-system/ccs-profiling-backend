import { Request, Response, NextFunction } from 'express';

export const permissionMiddleware = (_permission: string) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
};
