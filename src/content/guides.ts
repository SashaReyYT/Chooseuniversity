/**
 * Editorial pillar-page content for the /guides section (SEO play).
 * Long-form lives here rather than in messages/*.json because it is
 * article copy, not UI chrome. Facts are conservative summaries of public
 * rules; every guide ends with the standard verify-official-sources note.
 */

export interface GuideSection {
  heading: string;
  /** Paragraphs under this heading. */
  body: string[];
}

export interface Guide {
  slug: string;
  countryCode: string;
  title: string;
  metaDescription: string;
  updated: string;
  sections: GuideSection[];
}

const en: Guide[] = [
  {
    slug: "study-in-czech-republic",
    countryCode: "CZ",
    title: "How to apply to Czech universities from Ukraine: full 2026 walkthrough",
    metaDescription:
      "Nostrification exemption for Ukrainians, English-taught programmes, realistic costs and the exact application timeline for studying in the Czech Republic.",
    updated: "2026-08-24",
    sections: [
      {
        heading: "Why the Czech Republic",
        body: [
          "The Czech Republic combines EU degrees, four-hour travel from most of Ukraine, and living costs roughly half of Western Europe. Charles University, Masaryk and CTU Prague all place inside global rankings while charging a fraction of Western tuition.",
          "For Ukrainian citizens there is a unique legal advantage: under the 2014 bilateral agreement, Ukrainian school certificates and diplomas are recognised in Czechia without nostrification — the procedure that applicants from most other countries must pass.",
        ],
      },
      {
        heading: "Recognition of your secondary education",
        body: [
          "Because of the mutual-recognition treaty you submit your original school certificate with an official translation; the university verifies it during admission. No regional-authority nostrification procedure applies to Ukrainian documents for study purposes.",
          "Bring both the certificate and the transcript with appendix. If names transliterate differently across documents, prepare a notarised statement.",
        ],
      },
      {
        heading: "Language of instruction",
        body: [
          "You have two routes. Czech-taught programmes at public universities are tuition-free for anyone regardless of citizenship — but require Czech at B2, usually gained through a paid one-year university preparatory course (60,000–80,000 CZK).",
          "English-taught programmes skip the language barrier entirely: expect IELTS 5.5–6.5 or an equivalent certificate, with annual tuition typically €2,000–6,000 for bachelor's and €3,000–8,000 for medicine at the lower-cost faculties.",
        ],
      },
      {
        heading: "Applications and timeline",
        body: [
          "You apply directly to each university — there is no central portal. Applications open in autumn and close between February and April for September intake; medical faculties close earlier.",
          "Typical sequence: December–January shortlist programmes, February–March submit applications and pay fees (500–1,000 CZK each), April–June sit entrance exams where required, July accept offer, then start the visa process immediately.",
        ],
      },
      {
        heading: "Visa and arrival",
        body: [
          "Non-EU students apply for a long-term (>90 days) residence permit for study at the Czech consulate in their home country. You will need the confirmation of acceptance, proof of accommodation, proof of finances and medical insurance; processing commonly takes 60 days, so book the consulate slot the week you receive your offer.",
          "After arrival you register your address within 30 days and collect the biometric residence card.",
        ],
      },
      {
        heading: "Realistic budget",
        body: [
          "Dormitory rooms run €150–420/month depending on city; food and transport add another €250–400. Total monthly budget lands around €550–900 outside Prague and €700–1,100 in the capital.",
          "Combine that with tuition and a first-year total of €4,500–10,000 covers the majority of English-taught bachelor's scenarios outside medicine.",
        ],
      },
    ],
  },
  {
    slug: "study-in-poland",
    countryCode: "PL",
    title: "Studying in Poland from Ukraine: admission, costs and paperwork",
    metaDescription:
      "NMT scores accepted directly, English programmes from €2,000/year, karta pobytu steps and honest living-cost numbers for Polish universities.",
    updated: "2026-08-24",
    sections: [
      {
        heading: "Direct recognition, zero bureaucracy",
        body: [
          "Poland recognises Ukrainian NMT-based school certificates directly — no apostille stack, no supplementary exams for the vast majority of universities. You apply with your certificate, transcript and language certificate.",
          "Each university runs its own recruitment portal (commonly called IRK locally), so you can hold several offers simultaneously before choosing one.",
        ],
      },
      {
        heading: "Tuition reality check",
        body: [
          "English-taught bachelor's programmes cluster at €2,000–4,500 per year, with computer science and business in Warsaw and Kraków at the upper end and regional universities below €2,500.",
          "Medical programmes are the outlier: €11,000–16,000 annually at the English divisions, offset by EU-recognised diplomas.",
        ],
      },
      {
        heading: "Karta pobytu — the residence card",
        body: [
          "Entry is visa-free for Ukrainians; after enrolment you legalise through a temporary residence card (karta pobytu) filed in Poland itself. The university issues an acceptance letter that anchors the application.",
          "File within the legal window after arrival and keep the stamped submission receipt — it protects you while the decision processes.",
        ],
      },
      {
        heading: "Budget without illusions",
        body: [
          "Warsaw and Kraków: €600–900/month including a dormitory or shared flat. Smaller cities like Łódź, Rzeszów or Zielona Góra comfortably fit €450–650.",
          "Add one-off costs: visa-free entry makes them small compared to Czechia or Germany — mostly translation and enrolment fees under €150 total.",
        ],
      },
    ],
  },
  {
    slug: "study-in-germany",
    countryCode: "DE",
    title: "German universities for Ukrainian students: the complete cost and admission map",
    metaDescription:
      "Tuition-free public universities, the blocked account explained, uni-assist vs direct applications and what German level you actually need.",
    updated: "2026-08-24",
    sections: [
      {
        heading: "The tuition myth, clarified",
        body: [
          "Public universities in most German states charge no tuition even to non-EU students — only a semester contribution of €150–400 that includes regional transport passes.",
          "Exceptions: Baden-Württemberg charges €1,500 per semester for non-EU students, and Bavaria allowed universities to introduce fees from 2024 (TU Munich among them). Always check the state, not just the university.",
        ],
      },
      {
        heading: "Language requirements are the real gate",
        body: [
          "Bachelor's programmes are overwhelmingly German-taught (B2–C1 certificates: TestDaF, DSD, Goethe). Plan a language year if starting from scratch.",
          "The master's landscape is different: hundreds of English-taught MSc programmes at TU9 universities require only IELTS 6.0–6.5, making Germany one of the cheapest elite-master destinations in the world.",
        ],
      },
      {
        heading: "uni-assist vs direct application",
        body: [
          "Many universities outsource document verification to uni-assist (€75 for the first application). Others accept direct applications through their own portals — always confirm on the programme page.",
          "Ukrainian school certificates qualify for bachelor's admission when combined with sufficient subject coverage; some programmes ask for Studienkolleg if curriculum gaps exist.",
        ],
      },
      {
        heading: "The blocked account (Sperrkonto)",
        body: [
          "For the student visa you must show roughly €11,900 held in a blocked account for twelve months, released monthly. Alternative: a scholarship or a German sponsor's formal obligation letter.",
          "Start the account early — opening and funding takes several weeks through providers like Fintiba or Expatrio.",
        ],
      },
      {
        heading: "Living costs by city tier",
        body: [
          "Munich and Frankfurt: €1,100–1,600/month. Berlin, Hamburg, Stuttgart: €950–1,300. Aachen, Karlsruhe, Dresden and eastern cities: €750–1,000 — student halls frequently undercut these figures.",
          "Semester transport tickets effectively eliminate commuting costs, a quiet subsidy worth €50–80 monthly.",
        ],
      },
    ],
  },
  {
    slug: "study-in-italy",
    countryCode: "IT",
    title: "Italy on a budget: Universitaly, income-based fees and DSU scholarships",
    metaDescription:
      "How Universitaly pre-enrolment works, CIMEA/DOV documents, income-based tuition from €400/year and Italy's generous regional scholarships.",
    updated: "2026-08-24",
    sections: [
      {
        heading: "Income-based tuition changes everything",
        body: [
          "Italian public universities calculate fees from family income (ISEE parificato). Low-income international students routinely pay €400–1,000 per year at the same institutions where wealthier peers pay €3,000+.",
          "On top sit DSU regional scholarships — covering accommodation, meals and a grant — awarded substantially on financial need. For motivated applicants Italy is the strongest cost-to-prestige ratio in Southern Europe.",
        ],
      },
      {
        heading: "Universitaly pre-enrolment",
        body: [
          "Every non-EU applicant registers on the national Universitaly portal, selects the programme, and the university validates the pre-enrolment — the step that unlocks the visa appointment.",
          "Deadlines cluster in spring for September intake; medical and design programmes test earlier.",
        ],
      },
      {
        heading: "Documents: CIMEA vs DOV",
        body: [
          "Your school certificate needs either a Declaration of Value (issued by the Italian consulate) or a CIMEA comparability statement — an independent online service that has become faster and more predictable than consular queues.",
          "Order the CIMEA statement two to three months ahead; it is accepted by virtually all universities.",
        ],
      },
      {
        heading: "Where the money goes",
        body: [
          "Milan and Rome: €800–1,300/month. Bologna and Turin: €700–1,000. Smaller university towns like Pavia, Perugia or Trento drop to €600–850 with heavy student-discount ecosystems.",
          "With DSU support the effective net cost for low-income students approaches zero beyond travel.",
        ],
      },
    ],
  },
  {
    slug: "study-in-netherlands",
    countryCode: "NL",
    title: "Dutch universities: Studielink, numerus fixus and the housing question",
    metaDescription:
      "One central application portal, English-first bachelor's programmes, real tuition numbers and the honest truth about finding a room.",
    updated: "2026-08-24",
    sections: [
      {
        heading: "One portal for everything",
        body: [
          "Studielink is the Netherlands' central application system — up to four active choices at once, with grades and documents flowing to universities automatically. Deadlines: 15 January for numerus-fixus programmes, 1 May for the rest.",
          "The Dutch system runs on English more than any other non-Anglo country: 2,000+ fully English-taught programmes, and daily life works without Dutch.",
        ],
      },
      {
        heading: "Numerus fixus — plan around capacity caps",
        body: [
          "Popular programmes (psychology, medicine, some AI tracks) carry a numerus fixus — a hard capacity cap with selection based on average grade and motivation. Apply by 15 January or wait a year.",
          "Non-selective alternatives in the same field usually exist at applied-science universities (hogescholen) with January intakes.",
        ],
      },
      {
        heading: "Statutory fees, honestly stated",
        body: [
          "Non-EU statutory tuition runs €10,000–22,000 per year for bachelor's, with technical universities at the upper band. Institutional scholarships (Amsterdam Merit, Holland Scholarship €5k) shave meaningful slices.",
          "EU-family students pay the dramatically lower statutory rate instead — relevant for mixed families.",
        ],
      },
      {
        heading: "The housing problem, addressed",
        body: [
          "The Netherlands' genuine bottleneck is rooms, not admission. Start hunting the day you apply: university housing offices allocate a limited international stock via lotteries, and private platforms (Room, Kamernet) move fast.",
          "Budget €400–900/month for a room depending on city, Amsterdam at the ceiling. Students who secure housing before arrival report radically smoother first semesters.",
        ],
      },
    ],
  },
  {
    slug: "study-in-spain",
    countryCode: "ES",
    title: "Spanish universities for Ukrainians: UNEDasiss, PCE exams and real costs",
    metaDescription:
      "Credential conversion through UNEDasiss, when PCE entrance exams matter, English programmes and Mediterranean living costs explained.",
    updated: "2026-08-24",
    sections: [
      {
        heading: "UNEDasiss — your credential gateway",
        body: [
          "Foreign credentials convert through UNEDasiss, the national service that equates your school certificate to Spanish bachillerato and optionally reports PCE entrance-exam scores.",
          "Processing takes weeks-to-months around peak season; start the application as soon as pre-university results exist.",
        ],
      },
      {
        heading: "Do you need PCE exams?",
        body: [
          "For high-demand public programmes (medicine, physiotherapy, psychology) PCE subject exams raise your competitive score materially.",
          "Many private universities and less saturated public programmes admit on credential conversion alone — check each programme's cut-off history (notas de corte) published openly every year.",
        ],
      },
      {
        heading: "Costs: Madrid premium, regions discount",
        body: [
          "Catalonia prices non-EU students highest (€2,500–6,000/year); Madrid follows; Andalusia, Valencia and inland regions stay near €1,500–3,000.",
          "Living: Madrid and Barcelona €900–1,300/month, Valencia and Seville €700–1,000, inland cities under €800.",
        ],
      },
      {
        heading: "Language strategy",
        body: [
          "Fully English bachelor's exist but concentrate in private universities (IE, Ramon Llull) and a handful of public double-degree tracks.",
          "The dominant route remains Spanish B1–B2 + DELE/Siele certificate, unlocking far wider catalogues at public prices — a language year pays for itself here.",
        ],
      },
    ],
  },
];

const uk: Guide[] = [
  {
    slug: "study-in-czech-republic",
    countryCode: "CZ",
    title: "Як вступити до чеських університетів з України: повний гайд 2026",
    metaDescription:
      "Звільнення від нострифікації для українців, англомовні програми, реальні витрати та точний таймлайн вступу до Чехії.",
    updated: "2026-08-24",
    sections: [
      {
        heading: "Чому саме Чехія",
        body: [
          "Чехія поєднує дипломи ЄС, чотиригодинний доїзд з більшої частини України та витрати вдвічі нижчі за Західну Європу. Карловий університет, Масарик і ЧВУ Прага стабільно у світових рейтингах при платі в рази меншій за західну.",
          "Для українців є унікальна юридична перевага: за дворічній угоді 2014 року українські шкільні атестати й дипломи визнаються у Чехії без нострифікації — процедури, яку проходять абітурієнти з більшості інших країн.",
        ],
      },
      {
        heading: "Визнання середньої освіти",
        body: [
          "Завдяки угоді про взаємне визнання ти подаєш оригінал атестата з офіційним перекладом — університет перевіряє його під час вступу. Нострифікація через крайові органи для українських документів із метою навчання не застосовується.",
          "Бери і атестат, і виписку з оцінами. Якщо транслітерація імені в документах різниться — приготуй нотаріальну заяву про збіг.",
        ],
      },
      {
        heading: "Мова навчання",
        body: [
          "Два шляхи. Програми чеською у державних ВНЗ безкоштовні для всіх незалежно від громадянства — але потребують чеську на рівні B2, яку зазвичай дає платний річний підготовчий курс при університеті (60 000–80 000 CZK).",
          "Англомовні програми знімають мовний барʼєр: очікуй IELTS 5.5–6.5 або еквівалент, річна плата типово €2 000–6 000 на бакалавраті та €3 000–8 000 на медицині у дешевших факультетах.",
        ],
      },
      {
        heading: "Подача і таймлайн",
        body: [
          "Ти подаєшся напряму в кожен університет — центрального порталу немає. Подача відкривається восени і закривається між лютим і квітнем на вересневий набір; медичні факультети закриваються раніше.",
          "Типова послідовність: грудень–січень шортлист програм, лютий–березень подача і оплата зборів (500–1 000 CZK за кожну), квітень–червень вступні іспити де потрібно, липень — прийняття оферу й одразу старт візового процесу.",
        ],
      },
      {
        heading: "Віза та прибуття",
        body: [
          "Неєвропейці подають на довгострокову (>90 днів) візу для навчання в консульстві ЧЕЇ вдома. Потрібні підтвердження про зарахування, житло, фінанси та страховка; розгляд триває близько 60 днів — бронюй слот у консульстві того ж тижня, коли отримав офер.",
          "Після прибуття протягом 30 днів реєструєш адресу та отримуєш біометричну картку перебування.",
        ],
      },
      {
        heading: "Реальний бюджет",
        body: [
          "Гуртожиток €150–420/міс залежно від міста; їжа і транспорт ще €250–400. Разом місячний бюджет ≈ €550–900 поза Прагою та €700–1 100 у столиці.",
          "Разом із платою перший рік у €4 500–10 000 покриває більшість англомовних бакалаврських сценаріїв поза медициною.",
        ],
      },
    ],
  },
  {
    slug: "study-in-poland",
    countryCode: "PL",
    title: "Навчання в Польщі для українців: вступ, витрати та документи",
    metaDescription:
      "Бали НМТ приймають напряму, англійські програми від €2 000/рік, кроки карти побиту й чесні цифри проживання.",
    updated: "2026-08-24",
    sections: [
      {
        heading: "Пряме визнання без бюрократії",
        body: [
          "Польща визнає українські атестати на основі НМТ напряму — без стосу апостилів і додаткових іспитів у переважної більшості ВНЗ. Подаєш атестат, виписку та мовний сертифікат.",
          "Кожен університет має власний рекрутинговий портал (локально — IRK), тож можна тримати кілька оферів одночасно і вже потім обирати.",
        ],
      },
      {
        heading: "Чесно про плату",
        body: [
          "Англомовний бакалаврат коштує €2 000–4 500/рік: CS і бізнес у Варшаві та Кракові — верхня межа, регіональні університети — нижче €2 500.",
          "Медицина — виняток: €11 000–16 000 на англійських відділеннях, компенсована ЄС-визнаним дипломом.",
        ],
      },
      {
        heading: "Карта побиту",
        body: [
          "Вʼїзд для українців безвізовий; після зарахування легалізуєшся тимчасовою картою побиту, подаючи вже в самій Польщі. Офер університету — основа заяви.",
          "Подай у межах законного терміну після прибуття і збери штамповану копію про прийом заяви — вона захищає тебе поки триває розгляд.",
        ],
      },
      {
        heading: "Бюджет без ілюзій",
        body: [
          "Варшава і Краків: €600–900/міс з гуртожитком або кімнатою. Менші міста на кшталт Лодзі, Жешува чи Зеленої Гури — комфортні €450–650.",
          "Одноразові витрати мізерні порівняно з Чехією чи Німеччиною: переклади та вступні збори сумарно до €150.",
        ],
      },
    ],
  },
  {
    slug: "study-in-germany",
    countryCode: "DE",
    title: "Німецькі ВНЗ для українців: повна карта витрат і вступу",
    metaDescription:
      "Безкоштовні державні ВНЗ, заблокований рахунок простою мовою, uni-assist проти прямої подачі і який реально потрібен німецький.",
    updated: "2026-08-24",
    sections: [
      {
        heading: "Міф про безкоштовність — уточнення",
        body: [
          "Державні ВНЗ більшості земель не беруть плату навіть з неєвропейців — лише семестровий внесок €150–400, що включає регіональний транспорт.",
          "Винятки: Баден-Вюртемберг — €1 500/семестр для неєвропейців, а Баварія з 2024 дозволила ВНЗ вводити плату (ТУ Мюнхен — серед них). Завжди перевіряй землю, а не лише університет.",
        ],
      },
      {
        heading: "Мова — справжній барʼєр",
        body: [
          "Бакалаврат майже повністю німецькомовний (B2–C1: TestDaF, Goethe, DSD). Плануй мовний рік, якщо стартуєш з нуля.",
          "Ландшафт магістратур інший: сотні англомовних MSc у ТУ9 потребують лише IELTS 6.0–6.5 — це робить Німеччину найдешевшим елітним магістрантом світу.",
        ],
      },
      {
        heading: "uni-assist чи пряма подача",
        body: [
          "Багато ВНЗ делегують перевірку документів uni-assist (€75 за першу подачу). Інші приймають напряму через власні портали — звіряй на сторінці програми.",
          "Український атестат дає право на бакалаврат при достатньому покритті предметів; окремі програми просять Studienkolleg за прогалин.",
        ],
      },
      {
        heading: "Заблокований рахунок (Sperrkonto)",
        body: [
          "Для візи треба показати ≈€11 900 на блокованому рахунку на 12 місяців зі щомісячним лімітом зняття. Альтернатива — стипендія або офіційне зобовʼязання спонсора.",
          "Відкривай завчасно: оформлення і поповнення через Fintiba/Expatrio тривають кілька тижнів.",
        ],
      },
      {
        heading: "Витрати за містами",
        body: [
          "Мюнхен і Франкфурт: €1 100–1 600/міс. Берлін, Гамбург, Штутгарт: €950–1 300. Ахен, Карлсруе, Дрезден і східні міста: €750–1 000 — гуртожитки часто пробивають ці цифри.",
          "Семестровий квиток фактично зводить транспорт до нуля — тиха субсидія на €50–80 щомісяця.",
        ],
      },
    ],
  },
];

/**
 * Locale-aware accessor. Ukrainian falls back to the English article when
 * no translation exists yet — better than a 404 from sitemap links.
 */
export function getGuides(locale: string): Guide[] {
  if (locale !== "uk") return en;
  const ukBySlug = new Map(uk.map((g) => [g.slug, g]));
  return en.map((g) => ukBySlug.get(g.slug) ?? g);
}

export function getGuide(
  locale: string,
  slug: string,
): Guide | undefined {
  return getGuides(locale).find((g) => g.slug === slug);
}

export const GUIDE_SLUGS = en.map((g) => g.slug);