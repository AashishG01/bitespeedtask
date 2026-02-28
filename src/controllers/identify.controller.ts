import { Request, Response } from "express";
import { identifyService } from "../services/contact.service";
import { identifySchema } from "../validators/identify.validator";

export const identifyContact = async (req: Request, res: Response) => {
  try {
    const parsed = identifySchema.parse(req.body);

    const result = await identifyService(
      parsed.email,
      parsed.phoneNumber
    );
    

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};