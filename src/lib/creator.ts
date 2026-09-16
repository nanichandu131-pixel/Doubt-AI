export type CreatorCardMode = 'concise' | 'detailed';

export interface CreatorEducation {
  period: string;
  title: string;
  institution: string;
  result?: string;
}

export interface CreatorProject {
  title: string;
  subtitle: string;
  bullets: string[];
}

export interface CreatorSkillGroup {
  name: string;
  skills: string[];
}

export interface CreatorProfile {
  name: string;
  role: string;
  location: string;
  email: string;
  phone: string;
  phoneHref: string;
  linkedinUrl: string;
  linkedinLabel: string;
  githubUrl: string;
  githubLabel: string;
  imagePath: string;
  summary: string;
  summaryShort: string;
  skills: CreatorSkillGroup[];
  project: CreatorProject;
  education: CreatorEducation[];
  certifications: string[];
  strengths: string[];
}

export const CREATOR: CreatorProfile = {
  name: 'Nellore Chandu',
  role: 'Creator & Developer of Doubt AI',
  location: 'Nellore, Andhra Pradesh',
  email: 'nanichandu131@gmail.com',
  phone: '+91-8143041991',
  phoneHref: 'tel:+918143041991',
  linkedinUrl: 'https://linkedin.com/in/chandu-nani-629058420',
  linkedinLabel: 'linkedin.com/in/chandu-nani-629058420',
  githubUrl: 'https://github.com/nanichandu131-pixel',
  githubLabel: 'github.com/nanichandu131-pixel',
  imagePath: '/images/creator/nellore-chandu.jpg',
  summary:
    'Motivated and detail-oriented Computer Science Engineering student with a solid grounding in front-end development and core web technologies. Proficient in HTML, CSS, and JavaScript, with foundational exposure to React, Java, and Python. Proven ability to translate product concepts into functional interfaces through self-directed projects and hackathon collaboration. Eager to contribute technical skills, disciplined problem-solving, and adaptability to an entry-level software developer role or technical internship.',
  summaryShort:
    'A Computer Science Engineering student and front-end developer who created Doubt AI to make learning more interactive and accessible.',
  skills: [
    { name: 'Programming Languages', skills: ['JavaScript', 'Java (Basics)', 'Python (Basics)'] },
    { name: 'Web Technologies', skills: ['HTML5', 'CSS3', 'React.js (Foundational)'] },
    { name: 'Tools & Platforms', skills: ['Git', 'GitHub', 'VS Code'] },
    {
      name: 'Core Competencies',
      skills: ['Responsive Web Design', 'DOM Manipulation', 'UI/UX Layouts', 'Cross-Browser Compatibility'],
    },
  ],
  project: {
    title: 'All-in-One E-Commerce Web App',
    subtitle: 'Personal Project',
    bullets: [
      'Built a unified shopping platform interface designed to aggregate and simplify browsing across multiple digital storefronts in a single hub.',
      'Developed a responsive, mobile-first front-end using HTML5, CSS3, and JavaScript to ensure fast load times and seamless navigation.',
      'Implemented modular search and filter logic, reducing user steps required to discover relevant products.',
      'Utilized Git and GitHub for version control, maintaining structured feature branches and clean documentation.',
    ],
  },
  education: [
    {
      period: '2024 – 2028',
      title: 'Bachelor of Technology (B.Tech) – Computer Science & Engineering',
      institution: 'Visvodaya Institute of Technology and Science (VITS), Kavali',
      result: 'Pursuing',
    },
    {
      period: '2021 – 2023',
      title: 'Intermediate (Class XII)',
      institution: 'SV Junior College, Tirupati',
      result: '8.2 CGPA',
    },
    {
      period: 'Completed 2021',
      title: 'Secondary School Certificate (Class X)',
      institution: 'Bhagwan Sri Venkateswara Swamy Vidyalaya (BSVS Vidyalaya)',
      result: '8.7 GPA',
    },
  ],
  certifications: [
    'JavaScript & Modern Web Development – Coursework credential focusing on ES6+ fundamentals, DOM manipulation, and responsive web workflows.',
    'HTML5 & CSS3 Design Certification – Practical training on accessible layouts, semantic markup, and mobile-friendly styling.',
    'College Technical Hackathon – Collaborated within a team under timed conditions to engineer and present a functional prototype.',
    'Technical Workshops – Completed foundational workshops on software engineering practices and contemporary web stacks.',
  ],
  strengths: [
    'Fast learner who rapidly picks up modern frameworks, libraries, and developer tools.',
    'Clear communicator with strong teamwork instincts and collaborative problem-solving ability.',
    'Consistent focus on writing clean, readable code and building intuitive user interfaces.',
  ],
};

const ROLE_WORDS = /\b(creator|developer|maker|author|founder)\b/;
const CREATOR_VERB = /\b(creat\w*|develop\w*|made\b|make\w*|built\b|build\w*|wrote\b|programm\w*|code\w*)\b/;
const SELF_SUBJECT =
  /\b(you|this|it|the\s+app|this\s+app|the\s+application|this\s+application|the\s+chatbot|this\s+chatbot|the\s+bot|this\s+bot|the\s+ai|this\s+ai|this\s+assistant|the\s+assistant|the\s+website|this\s+website|doubt\s*ais?|doubtais?)\b/;
const WHO_ASKER = /\b(who|whom)\b/;

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Detects whether a user message is asking about who created Doubt AI / the person
 * behind it. Handles common phrasings ("Who created you?", "Who built Doubt AI?",
 * "Who is your developer?", "Tell me about your creator", "Who is behind this app?",
 * a direct mention of "Nellore Chandu", ...) without flagging ordinary study questions
 * like "Who created the universe?".
 */
export function isCreatorQuestion(rawText: string): boolean {
  const text = normalize(rawText);
  if (!text) return false;

  // Direct name mention.
  if (/nellore\s+chandu|\bchandu\b/.test(text)) return true;

  // "<possessive> <role>" e.g. "your creator", "its developer", "who is your founder".
  if (/(your|its|the|our|his|her)\s+(creator|developer|maker|author|founder)\b/.test(text)) return true;

  // "the <role> of <this app>".
  if (/(creator|developer|maker|author|founder)\s+of\s+(this\s+)?(app|application|chatbot|bot|ai|assistant|website|doubt\s*ai)\b/.test(text)) return true;

  // "who is behind ...".
  if (WHO_ASKER.test(text) && /\bbehind\b/.test(text) && SELF_SUBJECT.test(text)) return true;

  // "tell me about ..." referring to the creator or the person behind the app.
  if (/tell\s+me\s+(more\s+)?about\b/.test(text) && /\b(creator|developer|maker|author|founder|behind|person|student)\b/.test(text)) return true;

  // "... about the creator/developer ...".
  if (/\babout\b/.test(text) && ROLE_WORDS.test(text)) return true;

  // "who created/made/built/developed ..." with a self/app subject.
  if (WHO_ASKER.test(text) && CREATOR_VERB.test(text) && SELF_SUBJECT.test(text)) return true;

  // "... created/developed/built by whom/who".
  if (CREATOR_VERB.test(text) && /\bby\s+(whom|who)\b/.test(text)) return true;

  // Identity questions about the assistant itself.
  if (/\b(who|what)\s+are\s+you\b/.test(text)) return true;

  return false;
}

/** Picks how rich the creator card should be based on how much the user asked for. */
export function getCreatorMode(rawText: string): CreatorCardMode {
  const text = normalize(rawText);
  if (/tell\s+me\s+(more\s+)?about|more\s+about|\bdetails?\b|\bfull\s+(profile|bio|story)\b|\bintroduce\b/.test(text)) {
    return 'detailed';
  }
  if (/\babout\b/.test(text) && /\b(nellore\s+chandu|chandu|creator|developer|maker|author|founder)\b/.test(text)) {
    return 'detailed';
  }
  return 'concise';
}

/** The short assistant text streamed before the creator card is shown. */
export function getCreatorIntro(mode: CreatorCardMode): string {
  return mode === 'detailed'
    ? 'Sure! This is **Nellore Chandu**, the creator and developer of Doubt AI. Here\u2019s his full profile:'
    : '**Nellore Chandu** is the creator and developer of Doubt AI.';
}