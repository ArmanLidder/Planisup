import { Request, Response, Router } from "express";
import { Service } from "typedi";
import { Logger } from "@app/services/logger.service/logger.service";
import { ChatModel, convertToChat } from "@app/models/chat.model/chat.model";
import { StudyPlanModel } from "@app/models/study-plan.model/study-plan.model";
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
        const id = req.params.studyPlanId;
        try {
            const chat = await ChatModel.findById(id);
            return res.status(200).json(convertToChat(chat));
        } catch (e) {
            this.logger.error(`Error fetching messages: ${e}`);
            return res.status(500).json({ error: "Internal server error", details: e });
        }
    });

    this.router.post("/:studyPlanId", async (req: Request, res: Response) => {
        this.logger.info("Handle message reception");
        const id = req.params.studyPlanId;
        const message: IMessage = req.body;

        try {
            const studyPlan = await StudyPlanModel.findById(id);
            if (!studyPlan) {
                return res.status(404).json({ error: "Study plan not found" });
            }

            if (!studyPlan.chatId) {
                return res.status(400).json({ error: "No chatId linked to this study plan" });
            }

            const updatedChat = await ChatModel.findOneAndUpdate(
                { _id: studyPlan.chatId },
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
