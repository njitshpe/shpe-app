/**
 * Universities and Colleges in NJ, NY, and PA
 * Used for searchable selection in guest onboarding flow
 */
export const UNIVERSITIES = [
  // New Jersey - Major Universities
  'Rutgers University - New Brunswick',
  'Rutgers University - Newark',
  'Rutgers University - Camden',
  'Princeton University',
  'Stevens Institute of Technology',
  'Montclair State University',
  'Rowan University',
  'The College of New Jersey (TCNJ)',
  'Seton Hall University',
  'Fairleigh Dickinson University',
  'Rider University',
  'Kean University',
  'William Paterson University',
  'Stockton University',

  // New Jersey - Community Colleges
  'Bergen Community College',
  'Essex County College',
  'Hudson County Community College',
  'Passaic County Community College',
  'Union County College',

  // New York - Major Universities
  'Columbia University',
  'Cornell University',
  'New York University (NYU)',
  'Stony Brook University',
  'University at Buffalo (SUNY)',
  'Binghamton University (SUNY)',
  'Rensselaer Polytechnic Institute (RPI)',
  'Rochester Institute of Technology (RIT)',
  'Syracuse University',
  'Fordham University',
  'Hofstra University',
  'Pace University',
  'The City College of New York (CCNY)',
  'Cooper Union',

  // Pennsylvania - Major Universities
  'University of Pennsylvania',
  'Carnegie Mellon University',
  'Pennsylvania State University',
  'Drexel University',
  'Temple University',
  'Villanova University',
  'Lehigh University',
  'University of Pittsburgh',
  'Swarthmore College',
  'Haverford College',
  'Bryn Mawr College',
  'Lafayette College',

  // Other
  'Other',
] as const;

export type University = typeof UNIVERSITIES[number];
