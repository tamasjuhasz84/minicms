import * as submissionService from "../services/submissionService.js";
import { loadContent } from "../services/contentService.js";
import { z } from "zod";

export async function getSubmissions(req, res) {
  try {
    const rows = await submissionService.getAllSubmissions();
    res.json(rows);
  } catch (err) {
    console.error("Lekérdezési hiba:", err);
    res.status(500).json({ error: "Lekérdezési hiba" });
  }
}

export async function submitForm(req, res) {
  try {
    const structure = await loadContent();
    const schemaShape = {};

    const isEmpty = (val) => val === "" || val === null || val === undefined;

    for (const field of structure.form) {
      if (field.type === "divider") {
        continue;
      }
      const isRequired = field.required === true;
      let base;

      switch (field.type) {
        case "text":
          base = z.string();
          break;

        case "rating":
          base = z.preprocess((val) => {
            const num = Number(val);
            return isNaN(num) ? undefined : num;
          }, z.number().int().min(1).max(5));
          break;

        case "select":
          base = z.string();
          break;

        case "email":
          base = z.string().email(`${field.label} nem érvényes email.`);
          break;

        case "number":
          base = z.preprocess(
            (val) => {
              if (isEmpty(val)) return undefined;
              const num = Number(val);
              return isNaN(num) ? undefined : num;
            },
            isRequired ? z.number() : z.number().optional(),
          );
          break;

        case "checkbox":
        case "switch":
          base = z.preprocess(
            (val) => (val === "true" ? true : val === "false" ? false : val),
            z.boolean(),
          );

          break;

        case "file":
          base = z.string(); // fájl elérési út mentése stringként (pl. "/data/uploads/fajl.pdf")
          if (isRequired) {
            base = base.refine((val) => !isEmpty(val), {
              message: `${field.label} kötelező fájl.`,
            });
          }
          break;

        case "tel":
          base = z.string().regex(/^[0-9+ ]{6,20}$/, `${field.label} nem érvényes telefonszám.`);
          break;

        default:
          base = z.any();
      }

      if (!isRequired) {
        base = base.optional();
      }

      if (isRequired && !["file"].includes(field.type)) {
        base = base.refine((val) => !isEmpty(val), {
          message: `${field.label} kötelező.`,
        });
      }

      const minVal = field.validations?.min;
      if (minVal !== undefined && minVal !== null && minVal !== "") {
        base = base.refine(
          (val) => {
            if (!isRequired && isEmpty(val)) return true;
            if (field.type === "number") return val >= minVal;
            if (typeof val === "string") return val.length >= minVal;
            return true;
          },
          {
            message:
              field.type === "number"
                ? `${field.label} minimum értéke ${minVal}.`
                : `${field.label} minimum ${minVal} karakter.`,
          },
        );
      }

      const maxVal = field.validations?.max;
      if (maxVal !== undefined && maxVal !== null && maxVal !== "") {
        base = base.refine(
          (val) => {
            if (!isRequired && isEmpty(val)) return true;
            if (field.type === "number") return val <= maxVal;
            if (typeof val === "string") return val.length <= maxVal;
            return true;
          },
          {
            message:
              field.type === "number"
                ? `${field.label} maximum értéke ${maxVal}.`
                : `${field.label} maximum ${maxVal} karakter.`,
          },
        );
      }

      if (field.validations?.regex) {
        base = base.refine(
          (val) => {
            if (!isRequired && isEmpty(val)) return true;
            if (typeof val !== "string") return true;
            return new RegExp(field.validations.regex).test(val);
          },
          {
            message: `${field.label} formátuma hibás.`,
          },
        );
      }

      schemaShape[field.name] = base;
    }

    const formData = { ...req.body };

    // Fájlok hozzáadása a beküldött adathoz
    if (req.files) {
      for (const file of req.files) {
        const fieldName = file.fieldname;
        const fileSizeLimit = 5 * 1024 * 1024; // 5 MB

        if (file.size > fileSizeLimit) {
          return res.status(400).json({
            success: false,
            error: "Validációs hiba",
            details: {
              [fieldName]: [`${file.originalname} túl nagy fájl. Maximum 5MB.`],
            },
          });
        }

        formData[fieldName] = `/data/uploads/${file.filename}`;
      }
    }

    const validator = z.object(schemaShape);
    const parsed = validator.safeParse(formData);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Validációs hiba",
        details: parsed.error.flatten(),
      });
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "ismeretlen";

    await submissionService.addSubmission(parsed.data, ip);
    res.json({ success: true, message: "Mentés sikeres." });
  } catch (err) {
    console.error("Mentési hiba:", err);
    res.status(500).json({ success: false, message: "Mentési hiba." });
  }
}

export async function deleteSubmissionById(req, res) {
  try {
    const deleted = await submissionService.deleteSubmission(req.params.id);
    if (deleted === 0) return res.status(404).json({ error: "Nem található a beküldés" });
    res.json({ success: true, message: `Törölve: ${req.params.id}` });
  } catch (err) {
    console.error("Törlési hiba:", err);
    res.status(500).json({ error: "Törlési hiba" });
  }
}

export async function deleteAll(req, res) {
  try {
    await submissionService.deleteAllSubmissions();
    res.json({ success: true, message: "Összes beküldés törölve." });
  } catch (err) {
    console.error("Tömeges törlési hiba:", err);
    res.status(500).json({ error: "Nem sikerült törölni az összes beküldést" });
  }
}
