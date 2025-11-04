import { Request, Response, Router } from "express";
import { Service } from "typedi";
import {
  ProgramModel,
  IProgram,
  convertToReduceProgram,
  convertToReducePrograms
} from "@app/models/program.model/program.model";
import { Logger } from "@app/services/logger.service/logger.service";
import { ReducedProgram } from "@common/program";


@Service()
export class ProgramController {
  public router: Router;

  constructor(private logger: Logger) {
    this.configureRouter();
  }

  private configureRouter(): void {
    this.router = Router();

    this.router.get("/query/:type", async (req: Request, res: Response) => {
      try {
        const type = req.params.type;
        this.logger.info(`Fetching ${type}' programs`);

        const programs = await ProgramModel.find({
          type: type,
        }).exec();

        const departements = [
          ...new Set(programs.map((program: IProgram) => program.department)),
        ];

        return res.status(200).json(departements);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500);
      }
    });

    this.router.get("/departements", async (req: Request, res: Response) => {
      try {
        this.logger.info(`Fetching all departments`);
        const departments = await ProgramModel.distinct('department');
        return res.status(200).json(departments);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500);
      }
    });

    this.router.get("/query/:type/:department", async (req, res) => {
      try {
        const { type, department } = req.params;
        this.logger.info(
          `Fetching programs for type=${type}, departement=${department}`
        );

        const programs = await ProgramModel.find({
          type: { $in: [type]},
          department: department,
        }).exec();
        const degrees = [...(programs.map((program: IProgram) => convertToReduceProgram(program) as ReducedProgram))];

        return res.status(200).json(degrees);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });

    this.router.get("/all", async (req, res) => {
      try {
        const programs = await ProgramModel.find().exec();
        return res.status(200).json(convertToReducePrograms(programs));
      } catch (error) {
        this.logger.warn(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });
    
    this.router.get("/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const program = await ProgramModel.findById(id).exec();

        if (!program) {
          return res.status(404).json({ error: "Program not found" });
        }

        return res.status(200).json(program);
      } catch (error) {
        this.logger.warn(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });

    this.router.post("/", this.createProgram);
    this.router.put("/:id", this.updateProgram);
    this.router.delete("/:id", this.deleteProgram);

  }

  private createProgram = async (req: Request, res: Response) => {
    try {
      const payload = this.normalizeProgramShape(req.body);
      this.validateProgramEmpty(payload);

      const created = await ProgramModel.create(payload);
      this.logger.info(`Program with ID : ${created._id} created successfully `);

      return res.status(201).json(created.toObject());
    } catch (err: any) {
      if (err?.name === "ValidationError") {
        const obj =  {
          message: err.message,
          fields: Object.keys(err.errors),
        }
        this.logger.warn(`Validation failed when saving program : ${obj}`);

        const fieldErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(err.errors)) {
          // value is a ValidatorError object
          fieldErrors[key] = (value as any).message || "Invalid value";
        }

        return res.status(400).json({
          error: "ValidationError",
          message: "Program validation failed.",
          details: fieldErrors,
        });
      }

      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  private updateProgram = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payload = this.normalizeProgramShape(req.body);
      this.validateProgramEmpty(payload);

      const updated = await ProgramModel.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true, runValidators: true },
      ).exec();

      if (!updated) {
        return res.status(404).json({ error: "Not Found" })
      }
      else {
        this.logger.info(`Program with ID : ${id} updated successfully `);
      }
      return res.status(200).json(updated.toObject());
    } catch (err: any) {
      this.logger.warn(err);
      if (err?.name === "ValidationError") {
        return res.status(400).json({ error: "ValidationError", details: err.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  private deleteProgram = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      this.logger.info(`Deleting program with ID: ${id}`);

      const deleted = await ProgramModel.findByIdAndDelete(id).exec();

      if (!deleted) {
        this.logger.warn(`Program with ID ${id} not found for deletion`);
        return res.status(404).json({ error: "Not Found", message: "Program not found." });
      }

      this.logger.info(`Program with ID: ${id} deleted successfully`);
      return res.status(200).json({ message: "Program deleted successfully.", id });
    } catch (err: any) {
      this.logger.error(`Failed to delete program with ID: ${req.params.id}`);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };


  private normalizeProgramShape(input: any): any {
    const p = { ...input };

    if (typeof p.type === "string") {
      p.type = p.type
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean); // remove empties
    } else if (Array.isArray(p.type)) {
      p.type = p.type.map((t: any) => String(t).trim()).filter(Boolean);
    } else {
      p.type = null;
    }

    p.modules = Array.isArray(p.modules) ? p.modules : [];

    for (const m of p.modules) {
      m.description = Array.isArray(m.description) ? m.description : (m.description ? [m.description] : []);
      m.courses    = Array.isArray(m.courses) ? m.courses : [];
      m.subModules = Array.isArray(m.subModules) ? m.subModules : [];
      m.rules      = Array.isArray(m.rules) ? m.rules : [];

      // normalize rules on module
      for (const r of m.rules) {
        if (r && typeof r.type === "string") r.type = r.type.trim();
        if (r && r.value != null) r.value = Number(r.value);
      }

      // sections under module
      for (const s of m.courses) {
        s.description = typeof s.description === "string" ? s.description : (s.description ?? "");
        s.courses = Array.isArray(s.courses) ? s.courses : [];  // (this ‘courses’ is actually a list of Course, your model allows it)
        s.rules = Array.isArray(s.rules) ? s.rules : [];
        for (const r of s.rules) {
          if (r && typeof r.type === "string") r.type = r.type.trim();
          if (r && r.value != null) r.value = Number(r.value);
        }

        for (const c of s.courses) {
            if (!Array.isArray(c.trimester)) {
                  c.trimester = [];
            }
        }
      }

      // submodules
      for (const sm of m.subModules) {
        sm.description = Array.isArray(sm.description) ? sm.description : (sm.description ? [sm.description] : []);
        sm.courses = Array.isArray(sm.courses) ? sm.courses : [];
        sm.rules = Array.isArray(sm.rules) ? sm.rules : [];
        for (const r of sm.rules) {
          if (r && typeof r.type === "string") r.type = r.type.trim();
          if (r && r.value != null) r.value = Number(r.value);
        }

        // sections under submodule
        for (const ss of sm.courses) {
          ss.description = typeof ss.description === "string" ? ss.description : (ss.description ?? "");
          ss.courses = Array.isArray(ss.courses) ? ss.courses : [];
          ss.rules = Array.isArray(ss.rules) ? ss.rules : [];
          for (const r of ss.rules) {
            if (r && typeof r.type === "string") r.type = r.type.trim();
            if (r && r.value != null) r.value = Number(r.value);
          }
            for (const c of ss.courses) {
                if (!Array.isArray(c.trimester)) {
                    c.trimester = [];
                }
            }
        }
      }
    }

    return p;
  }

  private validateProgramEmpty(_program: any): void {
    // - credit rules have positive numbers
    // - director_approval / exclusive_submodules have no value
    // - no duplicate rule types within a single rules array
    //etc...
  }
}
