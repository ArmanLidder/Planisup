import fs from "fs";
import axios from "axios";


function extractDataFromJson() {
  const rawData = fs.readFileSync("programs.json", "utf-8");
  return JSON.parse(rawData);
}

// Define interfaces to help TypeScript understand the types
interface TransformedCourse {
  sigle: string;
  titre: string;
  nom_departement: string;
  prerequis: string[];
  corequis: string[];
  credits: string;
  listPlanTriennal: { annee: string; trimestre: string; jourSoir: string }[];
  description: string;
}

interface TransformedSection {
  title_section: string;
  courses: TransformedCourse[];
}

interface TransformedModule {
  title: string;
  texte_module: string[];
  cours: TransformedSection[];
  sous_modules: any[];
}

interface TransformedProgram {
  degree: string;
  departement: string | null;
  type: string[];
  name: string;
  link: string;
  description: string;
  modules: TransformedModule[];
}

// --- Transform raw data into your interface shape ---
export async function loadPrograms(): Promise<TransformedProgram[]> {
  // Fetch and prepare course data
  const { courseMap, triennalMap } = await enrichCourseData();
  const programKeywords = createMap();

  const rawPrograms = extractDataFromJson();

  const transformedPrograms: TransformedProgram[] = rawPrograms.map((p: any): TransformedProgram => ({
    degree: p.degree,
    departement: findKeyByValue(p.degree, programKeywords),
    type: extractProgramTypes(p.degree),
    name: p.name,
    link: p.link,
    description: p.description,
    modules: (p.modules || []).map((m: any): TransformedModule => ({
      title: m.title,
      texte_module: m.texte_module || [],
      cours: (m.tableau || []).map((t: any): TransformedSection => ({
        title_section: t.title_section,
        courses: (t.courses || []).map((c: any): TransformedCourse => {
          const courseData = courseMap.get(c.sigle);
          const triennalData = triennalMap.get(c.sigle);
          
          return {
            sigle: c.sigle || "",
            titre: c.titre || (courseData?.titre || ""),
            nom_departement: courseData?.departement || "",
            prerequis: courseData ? parsePrerequisites(courseData.prealable) : [],
            corequis: courseData ? parseCorequisites(courseData.corequis) : [],
            credits: c.credits || (courseData?.nombreCredit?.toString() || ""),
            listPlanTriennal: triennalData ? createPlanTriennalList(triennalData) : [],
            description: courseData?.descriptionCours || "",
          };
        }),
      })),
      sous_modules: m.sous_modules || [],
    })),
  }));

  console.log("Transformation complete.", transformedPrograms);

  return transformedPrograms;
}

function createMap(){
    // Create the Map
    const programKeywords = new Map();
    
    // Add keys with array values
    programKeywords.set("Développement durable", [
      "Diplôme d'études supérieures spécialisées (DESS) en Développement durable",
      "Option Conception et fabrication durables",
      "Option Économie circulaire",
      "Option Énergie et développement durable",
      "Option Génie de l'environnement",
      "Option Procédés et environnement",
      "Option Résilience organisationnelle",
      "Maîtrise professionnelle (ou DESS) modulaire en Génie civil",
      "Option Génie de l'environnement",
      "Maîtrise professionnelle (ou DESS) modulaire en Génie industriel",
      "Option Économie circulaire",
      "Option Résilience organisationnelle",
      "Maîtrise professionnelle (ou DESS) modulaire en Génie mécanique",
      "Option Conception et fabrication durables",
      "Maîtrise professionnelle modulaire en génie chimique",
      "Option Énergie et développement durable",
      "Option Procédés et environnement"
    ]);
    
    programKeywords.set("Ergonomie et ergonomie du logiciel", [
      "Diplôme d'études supérieures spécialisées (DESS) en Ergonomie",
      "Diplôme d'études supérieures spécialisées (DESS) en utilisabilité et expérience utilisateur (UX)"
    ]);
    
    programKeywords.set("Génie aérospatial", [
      "Maîtrise professionnelle en Génie aérospatial",
      "Maîtrise recherche en Génie aérospatial"
    ]);
    
    programKeywords.set("Génie biomédical", [
      "Diplôme d'études supérieures spécialisées (DESS) en Génie biomédical (Programme conjoint)",
      "Maîtrise professionnelle en Génie biomédical (Programme conjoint)",
      "Maîtrise recherche en Génie biomédical (Programme conjoint)",
      "Doctorat en Génie biomédical (Programme conjoint)"
    ]);
    
    programKeywords.set("Génie chimique", [
      "Diplôme d'études supérieures spécialisées (DESS) en Génie chimique",
      "Maîtrise professionnelle en Génie chimique",
      "Maîtrise professionnelle modulaire en génie chimique",
      "Option Énergie et développement durable",
      "Option Procédés et environnement",
      "Maîtrise recherche en Génie chimique",
      "Doctorat en Génie chimique"
    ]);
    
    programKeywords.set("Génie civil", [
      "Diplôme d'études supérieures spécialisées (DESS) en Génie civil",
      "Maîtrise professionnelle en Génie civil",
      "Maîtrise professionnelle (ou DESS) modulaire en Génie civil",
      "Option Génie de l'environnement",
      "Option Gestion des projets d'ingénierie civile",
      "Maîtrise recherche en Génie civil",
      "Doctorat en Génie civil"
    ]);
    
    programKeywords.set("Génie des matériaux", [
      "Diplôme d'études supérieures spécialisées (DESS) en Génie des matériaux",
      "Maîtrise professionnelle en Génie des matériaux",
      "Maîtrise recherche en Génie des matériaux",
      "Doctorat en Génie des matériaux"
    ]);
    
    programKeywords.set("Génie électrique", [
      "Diplôme d'études supérieures spécialisées (DESS) en Génie électrique",
      "Maîtrise professionnelle en Génie électrique",
      "Maîtrise recherche en Génie électrique",
      "Doctorat en Génie électrique"
    ]);
    
    programKeywords.set("Génie énergétique et nucléaire", [
      "Maîtrise professionnelle en Génie énergétique",
      "Maîtrise recherche en Génie énergétique",
      "Option Génie nucléaire",
      "Maîtrise professionnelle (ou DESS) modulaire en Génie énergétique",
      "Option Efficacité énergétique dans les bâtiments",
      "Option Énergie hydroélectrique",
      "Option Énergies renouvelables",
      "Option Systèmes et réseaux énergétiques intelligents",
      "Maîtrise recherche en Génie énergétique",
      "Doctorat en Génie énergétique"
    ]);
    
    programKeywords.set("Génie industriel", [
      "Diplôme d'études supérieures spécialisées (DESS) en Génie industriel",
      "Diplôme d'études supérieures spécialisées (DESS) en gestion des systèmes et projets complexes d'intérêt public",
      "Maîtrise professionnelle en Génie industriel",
      "Maîtrise professionnelle (ou DESS) modulaire en Génie industriel",
      "Option Économie circulaire",
      "Option Ergonomie",
      "Option Gestion de la technologie et de l'innovation",
      "Option Gestion de projets technologiques",
      "Option Ingénierie des systèmes de santé",
      "Option Logistique",
      "Option Production à valeur ajoutée",
      "Option Résilience organisationnelle",
      "Option Valorisation de données industrielles",
      "Maîtrise recherche en Génie industriel",
      "Doctorat en Génie industriel"
    ]);
    
    programKeywords.set("Génie informatique et génie logiciel", [
      "Diplôme d'études supérieures spécialisées (DESS) en Génie informatique",
      "Diplôme d'études supérieures spécialisées (DESS) en Génie informatique",
      "Option Génie logiciel",
      "Maîtrise professionnelle en Génie informatique",
      "Maîtrise professionnelle (ou DESS) modulaire en Génie informatique",
      "Option Cybersécurité",
      "Option Ingénierie et analytique des données",
      "Option Intelligence artificielle en divertissement numérique interactif",
      "Option Réseautique",
      "Maîtrise professionnelle en Génie informatique",
      "Option Génie logiciel",
      "Maîtrise recherche en Génie informatique",
      "Option Génie logiciel",
      "Maîtrise recherche en Génie informatique",
      "Doctorat en Génie informatique"
    ]);
    
    programKeywords.set("Génie mécanique", [
      "Diplôme d'études supérieures spécialisées (DESS) en Génie mécanique",
      "Maîtrise professionnelle en Génie mécanique",
      "Maîtrise professionnelle (ou DESS) modulaire en Génie mécanique",
      "Option Conception et fabrication durables",
      "Option Mécanique numérique",
      "Maîtrise recherche en Génie mécanique",
      "Doctorat en Génie mécanique"
    ]);
    
    programKeywords.set("Génie minéral", [
      "Diplôme d'études supérieures spécialisées (DESS) en Génie minéral",
      "Maîtrise professionnelle en Génie minéral",
      "Maîtrise recherche en Génie minéral",
      "Doctorat en Génie minéral"
    ]);
    
    programKeywords.set("Génie physique", [
      "Diplôme d'études supérieures spécialisées (DESS) en Génie physique",
      "Maîtrise professionnelle en Génie physique",
      "Maîtrise recherche en génie physique",
      "Doctorat en Génie physique"
    ]);
    
    programKeywords.set("Mathématiques", [
      "Diplôme d'études supérieures spécialisées (DESS) en Mathématique de l'ingénieur",
      "Maîtrise recherche en Mathématiques appliquées",
      "Doctorat en Mathématiques",
      "Option Mathématiques de l'ingénieur"
    ]);
    
    programKeywords.set("Technologie", [
      "Diplôme d'études supérieures spécialisées (DESS) en Technologie"
    ]);

    return programKeywords;
}


function findKeyByValue(search: string, programKeywords: any): string | null {
  for (const [key, values] of programKeywords.entries()) {
    if (values.includes(search)) {
      return key;
    }
  }
  return null;
}

function extractProgramTypes(degree: string): string[] {
  if (!degree) return [];
  
  const types: string[] = [];
  const lowerDegree = degree.toLowerCase();

  if (lowerDegree.includes('dess') || lowerDegree.includes('diplôme d\'études supérieures spécialisées')) {
    types.push('DESS');
  }

  if (lowerDegree.includes('maîtrise')) {
    types.push('Maîtrise');
  }
  
  if (lowerDegree.includes('doctorat')) {
    types.push('Doctorat');
  }

  if (types.length === 0 && lowerDegree.startsWith('option')) {
    return [];
  }
  
  return types;
}

async function fetchCoursesFromUrl(): Promise<RawCourse[]> {
    try {
        const response = await axios.get('https://dossieretudiant.polymtl.ca/WebEtudiant7/jsonwebservice/annuairecours');
        return response.data as RawCourse[];
    } catch (error: any) {
        console.error(`Failed to fetch courses from URL: ${error.message}`);
        throw error;
    }
}

async function fetchTriennalFromUrl(): Promise<planTriennal[]> {
    try {
        const response = await axios.get('https://dossieretudiant.polymtl.ca/WebEtudiant7/jsonwebservice/plantriennal');
        return response.data as planTriennal[];
    } catch (error: any) {
        console.error(`Failed to fetch plan triennal from URL: ${error.message}`);
        throw error;
    }
}

async function enrichCourseData() {
    console.log("Fetching course data from APIs...");
    const [rawCourses, triennalData] = await Promise.all([
        fetchCoursesFromUrl(),
        fetchTriennalFromUrl()
    ]);

    const courseMap = new Map<string, RawCourse>();
    const triennalMap = new Map<string, planTriennal>();

    rawCourses.forEach(course => {
        courseMap.set(course.sigle, course);
    });

    triennalData.forEach(triennal => {
        triennalMap.set(triennal.sigle, triennal);
    });

    return { courseMap, triennalMap };
}

function parsePrerequisites(prealable: string): string[] {
    if (!prealable || prealable.trim() === '') return [];
    
    return prealable
        .split(/[,;]/)
        .map(prereq => prereq.trim())
        .filter(prereq => prereq !== '' && prereq.length > 0);
}

function parseCorequisites(corequis: string): string[] {
    if (!corequis || corequis.trim() === '') return [];
    
    return corequis
        .split(/[,;]/)
        .map(coreq => coreq.trim())
        .filter(coreq => coreq !== '' && coreq.length > 0);
}

function createPlanTriennalList(triennal: planTriennal): { annee: string; trimestre: string; jourSoir: string }[] {
    if (!triennal.listPlanTriennal) return [];
    return triennal.listPlanTriennal;
}

interface RawCourse {
    sigle: string;
    titre: string;
    secteurEnseignement: string;
    nombreCredit: number;
    triplet: string;
    indHorsFact: string;
    urlCours: string;
    indPlanTriAut: string;
    indPlanTriHiv: string;
    indPlanTriEte: string;
    descriptionCours: string;
    noteParticuliere: string;
    prealable: string;
    corequis: string;
    departement: string;
    responsable: string;
}

interface planTriennal {
    sigle: string;
    titre: string;
    codeDepartement: string;
    nomDepartement: string;
    nbCredits: number;
    codeSecteur: string;
    listPlanTriennal?: { annee: string; trimestre: string; jourSoir: string }[];
}