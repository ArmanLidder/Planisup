import { Request, Response, Router } from "express";
import { Service } from "typedi";
import { Logger } from "@app/services/logger.service/logger.service";
import { ChatModel, convertToChat } from "@app/models/chat.model/chat.model";
import { IMessage } from "@app/models/chat.model/chat.model";

@Service()
export class ChatController {
  public router: Router;

  constructor(private logger: Logger) {
    this.configureRouter();
  }

  private configureRouter(): void {
    this.router = Router();

    this.router.get("/:id", async (req: Request, res: Response) => {
        this.logger.info("Fetching message for study-plan");
        const id = req.params.id;
        try {
            const chat = await ChatModel.findById(id);
            return res.status(200).json(convertToChat(chat));
        } catch (e) {
            this.logger.error(`Error fetching messages: ${e}`);
            return res.status(500).json({ error: "Internal server error", details: e });
        }
    });

    this.router.post("/:id", async (req: Request, res: Response) => {
        this.logger.info("Handle message reception");
        const id = req.params.id;
        const message: IMessage = req.body;
        console.log("message", message)
        try {
            const updatedChat = await ChatModel.findOneAndUpdate(
                { _id: id },
                { $push: { messages: message } },
                { new: true },
            );
            return res.status(200).json(updatedChat);
        } catch (e) {
            this.logger.error(`Error handling message reception: ${e}`);
            return res.status(500).json({ error: "Internal server error", details: e });
        }
    });
  }
}
