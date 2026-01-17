/**
 * NJIT Majors - Comprehensive list of undergraduate and graduate programs
 * Used for searchable selection in onboarding flows
 */
export const NJIT_MAJORS = [
  // Engineering
  'Biomedical Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Engineering',
  'Electrical Engineering',
  'Engineering Science',
  'Engineering Technology',
  'Environmental Engineering',
  'Industrial Engineering',
  'Manufacturing Engineering Technology',
  'Mechanical Engineering',
  'Mechanical Engineering Technology',

  // Computing & Technology
  'Computer Science',
  'Cybersecurity',
  'Data Science',
  'Information Systems',
  'Information Technology',
  'Web and Information Systems',

  // Architecture & Design
  'Architecture',
  'Digital Design',
  'Interior Design',

  // Science
  'Applied Mathematics',
  'Applied Physics',
  'Bioinformatics',
  'Biology',
  'Chemistry',
  'Computational Biology',
  'Environmental Science',
  'Mathematical Sciences',
  'Physics',

  // Business & Management
  'Business',
  'Business and Information Systems',
  'Management',

  // Humanities & Social Sciences
  'Communication and Media',
  'History',
  'Professional and Technical Communication',
  'Science, Technology and Society',

  // Undecided/Other
  'Undecided',
  'Other',
] as const;

export type NJITMajor = typeof NJIT_MAJORS[number];
