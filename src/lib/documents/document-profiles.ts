/**
 * Static "what you'll typically need to apply" reference data.
 *
 * Ported from Nevora's `src/data/requiredDocuments.js` (`DOCUMENT_PROFILES`)
 * — see TRANSFER_NOTES.md. Deliberately NOT a full port: Nevora's version
 * is wired into a roadmap/journey system (`REQUIRED_DOCS_BY_GOAL_TYPE`,
 * per-step tracking, file upload to Storage) that has no equivalent here —
 * this project is a university/programme picker, not a journey planner.
 * What's kept is only the generic, standalone reference content: what a
 * document is, roughly what it costs and takes, and common mistakes —
 * shown as a static "typical requirements" list on a programme page, with
 * no database table, no per-user tracking, and no file upload.
 *
 * Trimmed from Nevora's 12 keys to the 8 that were listed under its
 * `study_abroad` journey type (`passport`, `photo`, `diploma`,
 * `translation`, `apostille`, `language_cert`, `financial_proof`,
 * `insurance`) — `visa`, `lease`, `employment_letter`, and `license` were
 * for its `moving`/`work` journey types, which don't apply here.
 *
 * Costs/timings are Nevora's own baseline EUR estimates (no
 * per-destination or per-programme personalization) — shown as rough
 * guidance, not a quote.
 */

export type DocumentCategory =
  | "identity"
  | "education"
  | "language"
  | "financial";

export interface DocumentProfile {
  key: string;
  label: string;
  icon: string;
  category: DocumentCategory;
  /** Rough baseline cost in EUR. */
  estimatedCost: number;
  /** Days to prepare/gather before submitting. */
  prepDays: number;
  /** Typical processing/turnaround time once submitted. */
  processingDays: number;
  /** How long it stays valid once issued, or null if it doesn't expire. */
  expiryMonths: number | null;
  issuingAuthority: string;
  /** Other document keys this typically depends on having first. */
  dependsOn: string[];
  why: string;
  whereToGet: string;
  commonMistakes: string[];
  tips: string[];
}

export const DOCUMENT_PROFILES: DocumentProfile[] = [
  {
    key: "passport",
    label: "Passport",
    icon: "🛂",
    category: "identity",
    estimatedCost: 60,
    prepDays: 3,
    processingDays: 21,
    expiryMonths: 120,
    issuingAuthority: "National passport office / Ministry of Interior",
    dependsOn: [],
    why: "Almost every other document (visa, financial proof, enrollment) is built on top of your passport — it's the one identity document everything else references.",
    whereToGet:
      "Your national passport office, usually by appointment; some countries also allow renewal by mail.",
    commonMistakes: [
      "Applying too close to the target date without accounting for appointment backlogs",
      "Not checking the minimum remaining validity many countries require (often 6 months past your stay)",
    ],
    tips: [
      "Book the appointment as early as possible — slots fill up weeks in advance",
      "Order extra passport photos at the same time — you'll likely need them again",
    ],
  },
  {
    key: "photo",
    label: "Biometric photo",
    icon: "📷",
    category: "identity",
    estimatedCost: 15,
    prepDays: 1,
    processingDays: 0,
    expiryMonths: 6,
    issuingAuthority: "Any photo studio meeting the destination's biometric photo spec",
    dependsOn: [],
    why: "Enrollment and permit applications almost always require recent biometric-spec photos, not just any photo.",
    whereToGet:
      "A photo studio or self-service photo booth — many print shops offer application-photo-spec printing directly.",
    commonMistakes: [
      "Reusing an old photo that no longer meets the specific size/background spec required",
    ],
    tips: [
      "Check the exact size/background requirements before the photo session, not after",
      "Get a few extra prints — you'll likely need the same spec more than once",
    ],
  },
  {
    key: "diploma",
    label: "Diploma / transcript",
    icon: "🎓",
    category: "education",
    estimatedCost: 0,
    prepDays: 1,
    processingDays: 14,
    expiryMonths: null,
    issuingAuthority: "The school/university that issued it (for an official duplicate/transcript)",
    dependsOn: [],
    why: "It's the primary proof of your prior education level — admissions and credential recognition both key off it.",
    whereToGet:
      "Your own records, or a certified duplicate from the issuing institution's registrar/records office if the original is lost.",
    commonMistakes: [
      "Only having a scan when the destination university explicitly requires the physical original or a certified copy",
    ],
    tips: [
      "Order a couple of certified copies up front — translation and apostille both typically consume one",
    ],
  },
  {
    key: "translation",
    label: "Certified translation",
    icon: "🌐",
    category: "education",
    estimatedCost: 80,
    prepDays: 3,
    processingDays: 7,
    expiryMonths: null,
    issuingAuthority: "A certified/sworn translator recognized in the destination country",
    dependsOn: ["diploma"],
    why: "Admissions offices generally can't accept a document in a language they don't officially work in — a certified translation is what makes your diploma legible to them.",
    whereToGet:
      "A certified or sworn translator, ideally one specifically recognized by the destination country.",
    commonMistakes: [
      "Using a non-certified translator the destination institution won't accept",
      "Translating before the apostille is applied, when the destination requires the apostille itself translated too",
    ],
    tips: [
      "Confirm with the receiving institution whether they need the apostille translated as well, before ordering the translation",
    ],
  },
  {
    key: "apostille",
    label: "Apostille",
    icon: "📜",
    category: "education",
    estimatedCost: 50,
    prepDays: 2,
    processingDays: 10,
    expiryMonths: null,
    issuingAuthority:
      "The apostille-issuing authority in the document's country of origin (often the Ministry of Foreign Affairs or a designated court)",
    dependsOn: ["diploma"],
    why: "It's the official confirmation that a foreign document is genuine — required by many countries before they'll accept a foreign diploma at all.",
    whereToGet:
      "The designated apostille authority in the country that issued the original document — not the destination country.",
    commonMistakes: [
      "Assuming every country requires an apostille — some use a different legalization chain, or none at all",
      "Apostilling a copy instead of the original where the original is required",
    ],
    tips: [
      "Check whether the destination country is part of the Hague Apostille Convention before assuming this step is needed",
    ],
  },
  {
    key: "language_cert",
    label: "Language certificate",
    icon: "🗣️",
    category: "language",
    estimatedCost: 220,
    prepDays: 30,
    processingDays: 21,
    expiryMonths: 24,
    issuingAuthority: "The relevant language-exam board (e.g. the exam's official test center network)",
    dependsOn: [],
    why: "It's the standardized, internationally recognized proof of your language level that admissions offices actually accept — self-assessment isn't enough.",
    whereToGet:
      "An official test center for the specific exam the destination programme requires.",
    commonMistakes: [
      "Booking the wrong specific exam variant for the programme's requirement",
      "Leaving too little runway between the exam date and the results being needed",
    ],
    tips: [
      "Book the exam slot early — popular test centers fill up months in advance",
      "Double-check which exact exam/level the programme requires before registering",
    ],
  },
  {
    key: "financial_proof",
    label: "Proof of funds",
    icon: "💳",
    category: "financial",
    estimatedCost: 30,
    prepDays: 5,
    processingDays: 5,
    expiryMonths: 3,
    issuingAuthority: "Your bank (an official bank statement or letter)",
    dependsOn: [],
    why: "Authorities want to see you can actually cover tuition and living costs before approving anything.",
    whereToGet:
      "Your bank, as an official statement or balance confirmation letter — informal screenshots are rarely accepted.",
    commonMistakes: [
      "Submitting a statement that's already too old by the time the application is reviewed",
      "Not meeting the specific minimum balance the destination publishes",
    ],
    tips: [
      "Request the statement as close to submission time as practical, since most authorities expect it to be recent",
    ],
  },
  {
    key: "insurance",
    label: "Health insurance",
    icon: "🩺",
    category: "financial",
    estimatedCost: 400,
    prepDays: 3,
    processingDays: 2,
    expiryMonths: 12,
    issuingAuthority: "A licensed health-insurance provider covering the destination country",
    dependsOn: [],
    why: "Most enrollments and permits require proof of valid health coverage before they'll even process the rest of the application.",
    whereToGet:
      "A licensed insurer offering coverage valid in the destination — some destinations require a specific minimum coverage amount.",
    commonMistakes: [
      "Buying a policy that doesn't meet the destination's specific minimum coverage requirement",
      "Letting the policy start date not line up with the actual arrival date",
    ],
    tips: [
      "Match the policy's start date to your actual arrival date, not the application date, to avoid a coverage gap",
    ],
  },
];
