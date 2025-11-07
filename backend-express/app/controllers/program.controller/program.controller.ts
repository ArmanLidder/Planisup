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

      if (Object.prototype.hasOwnProperty.call(req.body, "coordonatorId") && payload.coordonatorId === null) {
        delete payload.coordonatorId;
      }

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
          message: "La validation du programme a échoué.",
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

      const updateDoc: any = { $set: payload };
      if (Object.prototype.hasOwnProperty.call(req.body, "coordonatorId")) {
        if (payload.coordonatorId === null) {
          updateDoc.$unset = { ...(updateDoc.$unset || {}), coordonatorId: "" };
          delete updateDoc.$set.coordonatorId;
        }
      }

      const updated = await ProgramModel.findByIdAndUpdate(
        id,
        updateDoc,
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
        const fieldErrors: Record<string, string> = {};
        if (err.errors && typeof err.errors === "object") {
          for (const [key, value] of Object.entries(err.errors)) {
            fieldErrors[key] = (value as any)?.message || "Valeur invalide.";
          }
        }
        return res.status(400).json({
          error: "ValidationError",
          message: "La validation du programme a échoué.",
          details: Object.keys(fieldErrors).length > 0 ? fieldErrors : err.message,
        });
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

    const hasCoordonatorField = Object.prototype.hasOwnProperty.call(input, "coordonatorId");
    if (hasCoordonatorField) {
      if (typeof p.coordonatorId === "string") {
        const trimmed = p.coordonatorId.trim();
        p.coordonatorId = trimmed.length > 0 ? trimmed : null;
      } else if (p.coordonatorId == null) {
        p.coordonatorId = null;
      } else {
        const coerced = String(p.coordonatorId).trim();
        p.coordonatorId = coerced.length > 0 ? coerced : null;
      }
    } else {
      delete p.coordonatorId;
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
        s.courses = Array.isArray(s.courses) ? s.courses : [];
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
    if (!_program || typeof _program !== "object") return;

    type Scope = "module" | "submodule" | "section";
    const errors: Record<string, { message: string }> = {};
    const addError = (path: string, message: string) => {
      if (!errors[path]) {
        errors[path] = { message };
      }
    };

    const requirePositiveNumber = (value: any, path: string, label: string): number | null => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        addError(path, `La règle ${label} nécessite une valeur numérique.`);
        return null;
      }
      if (value < 0) {
        addError(path, `La règle ${label} doit être 0 ou plus.`);
        return null;
      }
      return value;
    };

    const validateRuleSet = (rules: any[], path: string, scope: Scope) => {
      if (!Array.isArray(rules) || rules.length === 0) return;

      const seenTypes = new Set<string>();
      let minValue: number | null = null;
      let maxValue: number | null = null;
      let hasCreditsExact = false;
      let hasCreditsMinimum = false;
      let hasCreditsMaximum = false;

      rules.forEach((rule, index) => {
        const basePath = `${path}[${index}]`;

        if (!rule || typeof rule.type !== "string" || !rule.type.trim()) {
          addError(`${basePath}.type`, "Le type de règle est requis.");
          return;
        }

        const type = rule.type.trim();

        if (seenTypes.has(type)) {
          addError(path, `La règle '${type}' est dupliquée et n'est pas permise.`);
        } else {
          seenTypes.add(type);
        }

        const hasValue = rule.value !== undefined && rule.value !== null;

        if (type === "director_approval") {
          if (scope !== "section") {
            addError(basePath, "La règle 'director_approval' est permise uniquement sur les sections.");
          }
          if (hasValue) {
            addError(basePath, "La règle 'director_approval' ne peut pas avoir de valeur.");
          }
          return;
        }

        if (type === "exclusive_submodules") {
          if (scope !== "module") {
            addError(basePath, "La règle 'exclusive_submodules' est permise uniquement sur les modules.");
          }
          if (hasValue) {
            addError(basePath, "La règle 'exclusive_submodules' ne peut pas avoir de valeur.");
          }
          return;
        }

        if (type === "credits_exact") {
          if (hasCreditsMinimum || hasCreditsMaximum) {
            addError(
              basePath,
              "La règle 'crédits exacts' ne peut pas être combinée avec des règles de crédits minimum ou maximum."
            );
            return;
          }
          hasCreditsExact = true;
          requirePositiveNumber(rule.value, `${basePath}.value`, "credits_exact");
          return;
        }

        if (type === "credits_minimum") {
          if (hasCreditsExact) {
            addError(
              basePath,
              "La règle 'crédits minimum' ne peut pas être combinée avec une règle de crédits exacts."
            );
            return;
          }
          const value = requirePositiveNumber(rule.value, `${basePath}.value`, "credits_minimum");
          if (value !== null) {
            minValue = value;
          }
          hasCreditsMinimum = true;
          return;
        }

        if (type === "credits_maximum") {
          if (hasCreditsExact) {
            addError(
              basePath,
              "La règle 'crédits maximum' ne peut pas être combinée avec une règle de crédits exacts."
            );
            return;
          }
          const value = requirePositiveNumber(rule.value, `${basePath}.value`, "credits_maximum");
          if (value !== null) {
            maxValue = value;
          }
          hasCreditsMaximum = true;
          return;
        }
      });

      if (minValue !== null && maxValue !== null && maxValue <= minValue) {
        addError(path, "La règle 'credits_maximum' doit être supérieure à 'credits_minimum'.");
      }
    };

    const validateSection = (section: any, path: string) => {
      validateRuleSet(section?.rules ?? [], `${path}.rules`, "section");
      const courses = Array.isArray(section?.courses) ? section.courses : [];
      courses.forEach((course: any, idx: number) => {
        const creditsPath = `${path}.courses[${idx}].credits`;
        if (typeof course?.credits !== "number" || !Number.isFinite(course.credits)) {
          addError(creditsPath, "Les crédits doivent être un nombre positif.");
        } else if (course.credits <= 0) {
          addError(creditsPath, "Les crédits doivent être supérieurs à 0.");
        }
      });
    };

    const modules = Array.isArray(_program.modules) ? _program.modules : [];
    modules.forEach((module: any, moduleIndex: number) => {
      const modulePath = `modules[${moduleIndex}]`;
      validateRuleSet(module?.rules ?? [], `${modulePath}.rules`, "module");

      const sections = Array.isArray(module?.courses) ? module.courses : [];
      sections.forEach((section: any, sectionIndex: number) => {
        validateSection(section, `${modulePath}.courses[${sectionIndex}]`);
      });

      const subModules = Array.isArray(module?.subModules) ? module.subModules : [];
      subModules.forEach((subModule: any, subModuleIndex: number) => {
        const subPath = `${modulePath}.subModules[${subModuleIndex}]`;
        validateRuleSet(subModule?.rules ?? [], `${subPath}.rules`, "submodule");

        const subSections = Array.isArray(subModule?.courses) ? subModule.courses : [];
        subSections.forEach((section: any, sectionIndex: number) => {
          validateSection(section, `${subPath}.courses[${sectionIndex}]`);
        });
      });
    });

    if (Object.keys(errors).length > 0) {
      const validationError: any = new Error("La validation du programme a échoué.");
      validationError.name = "ValidationError";
      validationError.errors = errors;
      throw validationError;
    }
  }
}
