/**
 * Committee Join Forms Configuration
 *
 * Each committee has a custom questionnaire that users fill out when requesting to join.
 * The answers are stored as JSON in the committee_members.application column.
 */

export interface JoinFormQuestion {
  key: string;           // Unique key used as the JSON field name in application
  label: string;         // Display label for the question
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'number';
  required?: boolean;    // Whether the field is required
  options?: string[];    // Options for select/multiselect types
  maxLen?: number;       // Maximum character length for text/textarea
  placeholder?: string;  // Placeholder text
}

export interface JoinFormConfig {
  title: string;
  description?: string;
  questions: JoinFormQuestion[];
}

// Common questions used across all committees
const COMMON_QUESTIONS: JoinFormQuestion[] = [
  {
    key: 'ucid',
    label: 'UCID',
    type: 'text',
    required: true,
    placeholder: 'e.g., abc123',
    maxLen: 8,
  },
  {
    key: 'phone',
    label: 'Phone Number',
    type: 'number',
    required: true,
    placeholder: 'e.g., 1234567890',
    maxLen: 20,
  },
  {
    key: 'volunteer_experience',
    label: 'Please tell us about other organizations where you have volunteered or served as a board member (current or past)',
    type: 'textarea',
    required: true,
    maxLen: 1000,
    placeholder: 'Describe your volunteer and leadership experience...',
  },
  {
    key: 'shpe_history',
    label: 'What is your history with SHPE?',
    type: 'textarea',
    required: true,
    maxLen: 1000,
    placeholder: 'Tell us about your involvement with SHPE...',
  },
];

export const COMMITTEE_JOIN_FORMS: Record<string, JoinFormConfig> = {
  marketing: {
    title: 'Marketing Committee Application',
    description: 'Help create promotional materials and design SHPE merchandise.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'experience',
        label: 'Do you have any marketing or social media experience?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'Describe your marketing experience...',
      },
      {
        key: 'tools',
        label: 'Which design/editing tools are you familiar with?',
        type: 'multiselect',
        options: ['Canva', 'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'CapCut', 'Premiere Pro', 'Other'],
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  webmaster: {
    title: 'Webmaster Committee Application',
    description: 'Maintain and develop the NJIT SHPE website and mobile app.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'stack',
        label: 'What technologies are you comfortable with?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'e.g., React, TypeScript, Node.js, Python...',
      },
      {
        key: 'github',
        label: 'GitHub Username',
        type: 'text',
        required: true,
        placeholder: 'Your GitHub username',
        maxLen: 50,
      },
      {
        key: 'projects',
        label: 'Link a project you\'ve worked on (optional)',
        type: 'text',
        placeholder: 'https://github.com/...',
        maxLen: 200,
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  'public-relations': {
    title: 'Public Relations Committee Application',
    description: 'Promote SHPE\'s mission, manage social media, and capture events.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'social_experience',
        label: 'Do you have experience managing social media accounts?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'Describe your social media experience...',
      },
      {
        key: 'photography',
        label: 'Do you have photography or videography experience?',
        type: 'textarea',
        maxLen: 500,
        placeholder: 'Describe your photography/video skills...',
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  'event-coordinator': {
    title: 'Event Coordinator Application',
    description: 'Plan, coordinate, and manage NJIT SHPE events.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'event_experience',
        label: 'Do you have experience planning or coordinating events?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'Describe any event planning experience...',
      },
      {
        key: 'flexibility',
        label: 'Are you able to help with event setup/cleanup and run last-minute errands?',
        type: 'select',
        required: true,
        options: ['Yes, I\'m flexible', 'Sometimes', 'Limited availability'],
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  'external-vp': {
    title: 'External VP Committee Application',
    description: 'Build relationships with corporate partners and external organizations.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'networking_experience',
        label: 'Do you have experience with professional networking or corporate outreach?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'Describe your networking experience...',
      },
      {
        key: 'communication_skills',
        label: 'How would you rate your professional communication skills?',
        type: 'select',
        required: true,
        options: ['Excellent', 'Good', 'Developing'],
      },
      {
        key: 'availability',
        label: 'What is your weekly availability for meetings (in-person or virtual)?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  'internal-vp': {
    title: 'Internal VP Committee Application',
    description: 'Build relationships with NJIT colleges, departments, and student organizations.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'campus_involvement',
        label: 'What other NJIT organizations or departments are you involved with?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'List your campus involvements...',
      },
      {
        key: 'collaboration_experience',
        label: 'Do you have experience organizing collaborations between organizations?',
        type: 'textarea',
        maxLen: 500,
        placeholder: 'Describe any collaboration experience...',
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  treasurer: {
    title: 'Treasurer Committee Application',
    description: 'Track finances, help with fundraising, and research grants.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'finance_experience',
        label: 'Do you have experience with financial record-keeping or budgeting?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'Describe your finance experience...',
      },
      {
        key: 'spreadsheet_skills',
        label: 'Are you comfortable working with spreadsheets (Excel/Google Sheets)?',
        type: 'select',
        required: true,
        options: ['Very comfortable', 'Somewhat comfortable', 'Learning'],
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  secretary: {
    title: 'Secretary Committee Application',
    description: 'Maintain inventory, help with attendance, and assist with newsletters.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'organization_skills',
        label: 'How would you describe your organizational skills?',
        type: 'textarea',
        required: true,
        maxLen: 500,
        placeholder: 'Describe how you stay organized...',
      },
      {
        key: 'office_hours',
        label: 'Can you commit to regular office hours in the SHPE office?',
        type: 'select',
        required: true,
        options: ['Yes, I can commit', 'Sometimes', 'Limited availability'],
      },
      {
        key: 'creative_interest',
        label: 'Are you interested in helping create the biweekly newsletter?',
        type: 'select',
        options: ['Very interested', 'Somewhat interested', 'Not really'],
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  outreach: {
    title: 'Outreach Committee Application',
    description: 'Plan and coordinate volunteering events for the community.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'volunteer_passion',
        label: 'Why are you passionate about community outreach?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'Tell us about your passion for helping others...',
      },
      {
        key: 'outreach_ideas',
        label: 'Do you have any ideas for outreach events or partnerships?',
        type: 'textarea',
        maxLen: 500,
        placeholder: 'Share any ideas you have...',
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  'pre-college': {
    title: 'Pre-College Committee Application',
    description: 'Coordinate DDC events and outreach to pre-college students.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'teaching_experience',
        label: 'Do you have experience working with or teaching younger students?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'Describe your experience with pre-college students...',
      },
      {
        key: 'stem_passion',
        label: 'Why do you want to help inspire the next generation of STEM students?',
        type: 'textarea',
        required: true,
        maxLen: 500,
        placeholder: 'Share your motivation...',
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  membership: {
    title: 'Membership Development Application',
    description: 'Oversee tutoring, first-year outreach, and member engagement.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'tutoring_experience',
        label: 'Do you have experience tutoring or mentoring other students?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'Describe your tutoring/mentoring experience...',
      },
      {
        key: 'subjects',
        label: 'What subjects are you comfortable helping others with?',
        type: 'text',
        maxLen: 300,
        placeholder: 'e.g., Calculus, Physics, Programming...',
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  shpetinas: {
    title: 'SHPEtinas Committee Application',
    description: 'Empower women and Latinas in STEM through community and support.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'empowerment_passion',
        label: 'Why do you want to be part of SHPEtinas?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'Share why this community matters to you...',
      },
      {
        key: 'event_ideas',
        label: 'Do you have ideas for events or initiatives to support women in STEM?',
        type: 'textarea',
        maxLen: 500,
        placeholder: 'Share any ideas you have...',
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },

  internshpe: {
    title: 'InternSHPE Application',
    description: 'Develop technical skills and gain hands-on industry experience.',
    questions: [
      ...COMMON_QUESTIONS,
      {
        key: 'career_goals',
        label: 'What are your career goals and how can InternSHPE help you achieve them?',
        type: 'textarea',
        required: true,
        maxLen: 800,
        placeholder: 'Describe your career aspirations...',
      },
      {
        key: 'skills_to_develop',
        label: 'What skills are you most interested in developing?',
        type: 'textarea',
        required: true,
        maxLen: 500,
        placeholder: 'List skills you want to learn or improve...',
      },
      {
        key: 'availability',
        label: 'What is your weekly availability?',
        type: 'text',
        required: true,
        placeholder: 'e.g., Mon/Wed 3-5pm, flexible weekends',
        maxLen: 200,
      },
    ],
  },
};

/**
 * Get the join form configuration for a committee
 * Falls back to a default form if no specific config exists
 */
export const getJoinFormConfig = (committeeSlug: string): JoinFormConfig => {
  return COMMITTEE_JOIN_FORMS[committeeSlug] || {
    title: 'Committee Application',
    questions: COMMON_QUESTIONS,
  };
};
