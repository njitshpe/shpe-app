import { Event } from '@/types/events';
import { SHPE_COLORS, NEON_COLORS } from '@/constants/colors';

// Gradient definitions (transparent -> semi-opaque -> opaque)
export const EVENT_GRADIENTS = {
    social: ['transparent', 'rgba(255, 95, 5, 0.4)', 'rgba(255, 95, 5, 0.95)'], // SHPE Orange
    workshop: ['transparent', 'rgba(0, 163, 224, 0.4)', 'rgba(0, 163, 224, 0.95)'], // SHPE Light Blue
    general: ['transparent', 'rgba(0, 122, 255, 0.4)', 'rgba(0, 122, 255, 0.95)'], // System Blue (Brighter for Dark Mode)
    corporate: ['transparent', 'rgba(103, 58, 183, 0.4)', 'rgba(103, 58, 183, 0.95)'], // Purple
    volunteering: ['transparent', 'rgba(34, 197, 94, 0.4)', 'rgba(34, 197, 94, 0.95)'], // Green
    shpetinas: ['transparent', 'rgba(236, 72, 153, 0.4)', 'rgba(236, 72, 153, 0.95)'], // Pink
    default: ['transparent', 'rgba(236, 161, 0, 0.81)', 'rgba(246, 168, 0, 0.9)'], // Standard Dark
};

export const getEventGradient = (event: Event): string[] => {
    if (!event || !event.title) return EVENT_GRADIENTS.default;
    const text = `${event.title} ${event.tags?.join(' ') || ''}`.toLowerCase();

    if (text.match(/social|mixer|fun|party|game/)) {
        return EVENT_GRADIENTS.social;
    }
    if (text.match(/workshop|learn|study|tech|code|hack/)) {
        return EVENT_GRADIENTS.workshop;
    }
    if (text.match(/gbm|general|meeting|assembly/)) {
        return EVENT_GRADIENTS.general;
    }
    if (text.match(/corporate|company|resume|interview|career|fair/)) {
        return EVENT_GRADIENTS.corporate;
    }
    if (text.match(/volunteer|service|community|outreach/)) {
        return EVENT_GRADIENTS.volunteering;
    }
    if (text.match(/shpetinas|valentine|love|date/)) {
        return EVENT_GRADIENTS.shpetinas;
    }

    return EVENT_GRADIENTS.default;
};

export const MONTH_THEMES = {
    0: {
        title: 'January',
        description: "Getting ready to start the spring semester off on the right foot. We have some introductory and social events to get you right into the swing of things.",
        image: 'https://images.unsplash.com/photo-1509845350455-fb0c36048db1?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', //spain
    },
    1: {
        title: 'February',
        description: 'Valentine\'s themed events and the spring career fair. Polish that resume and practice your pitch 💼.',
        image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?q=80&w=2672&auto=format&fit=crop',
    },
    2: {
        title: 'March',
        description: 'Company hospitality suites to showcase opportunities, some fun events, and Latin Night to celebrate our culture.',
        image: 'https://images.unsplash.com/photo-1530999811698-221aa9eb1739?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Chichen Itza, Mexico
    },
    3: {
        title: 'April',
        description: 'Wrapping up the academic year. Join us for before finals.',
        image: 'https://images.unsplash.com/photo-1582642250536-419cfaaef741?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Cartagena, Colombia
    },
    4: {
        title: 'May',
        description: 'Good luck on finals! Congratulations to our graduating seniors, and have a great summer!',
        image: 'https://images.unsplash.com/photo-1592174887344-02ff9373ca55?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Havana, Cuba
    },
    5: {
        title: 'June',
        description: 'Enjoy the summer!',
        image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=2670&auto=format&fit=crop', // Rio de Janeiro, Brazil
    },
    6: {
        title: 'July',
        description: 'Enjoy the summer!',
        image: 'https://images.unsplash.com/photo-1512813498716-3e640fed3f39?q=80&w=2670&auto=format&fit=crop', // Buenos Aires, Argentina
    },
    7: {
        title: 'August',
        description: 'Enjoy the summer! Prepare for the fall semester.',
        image: 'https://images.unsplash.com/photo-1555109307-f7d9da25c244?q=80&w=2670&auto=format&fit=crop', // Barcelona, Spain
    },
    8: {
        title: 'September',
        description: 'Back to school! Welcome new members and returning members alike and let\'s start this semester strong.',
        image: 'https://images.unsplash.com/photo-1518659526054-e98e6e39f223?q=80&w=2670&auto=format&fit=crop', // Guatemala City, Guatemala
    },
    9: {
        title: 'October',
        description: 'Preparing for the national convention. Learn about hospitality suites, how to pitch yourself to recruiters, and much more.',
        image: 'https://images.unsplash.com/photo-1512813498716-3e640fed3f39?q=80&w=2670&auto=format&fit=crop', // Mexico City, Mexico
    },
    10: {
        title: 'November',
        description: 'Preparing for finals season. Join us for de-stress events before finals.',
        image: 'https://images.unsplash.com/photo-1531968455001-5c5272a41129?q=80&w=2670&auto=format&fit=crop', // San Juan, Puerto Rico
    },
    11: {
        title: 'December',
        description: 'Wrapping up the year with holiday cheer. Good luck on finals and enjoy the break!',
        image: 'https://images.unsplash.com/photo-1518659526054-e98e6e39f223?q=80&w=2670&auto=format&fit=crop', // Antigua, Guatemala
    },
};
