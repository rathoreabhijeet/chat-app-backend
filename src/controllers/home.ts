import { Request, Response } from "express";

/**
 * GET /
 * Home page.
 */
export let index = (req: Request, res: Response) => {
  res.status(200).send({
    msg: "Your api working successfully"
  });
};
