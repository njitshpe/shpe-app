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
    default: ['transparent', 'rgba(228, 0, 236, 0.81)', 'rgba(246, 168, 0, 0.9)'], // Standard Dark
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
        description: "Getting ready to start the spring semester off on the right foot. We have some social events to get you right into the swing of things.",
        image: 'https://images.unsplash.com/photo-1509845350455-fb0c36048db1?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    1: {
        title: 'February',
        description: 'Career fair season is upon us. Polish that resume, practice your pitch, and land that summer internship.',
        image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?q=80&w=2672&auto=format&fit=crop',
    },
    2: {
        title: 'March',
        description: 'Elections are coming up. Consider running for a position or get ready to vote for your next executive board.',
        image: 'https://images.unsplash.com/photo-1557053503-4333dd49d97f?q=80&w=2669&auto=format&fit=crop',
    },
    3: {
        title: 'April',
        description: 'Wrapping up the academic year. Join us for our end -of-year banquet and de-stress events before finals.',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1770&auto=format&fit=crop',
    },
    4: {
        title: 'May',
        description: 'Good luck on finals! Congratulations to our graduating seniors, and have a great summer!',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1770&auto=format&fit=crop',
    },
    5: {
        title: 'June',
        description: 'Summer vibes are here. Stay connected and keep learning even while you recharge.',
        image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?q=80&w=1770&auto=format&fit=crop', // Summer / Sun
    },
    6: {
        title: 'July',
        description: 'Heat waves and cool code. Perfect time to work on personal projects and skills.',
        image: 'https://images.unsplash.com/photo-1596464716127-f9a87595ca58?q=80&w=2835&auto=format&fit=crop', // Summer Tech
    },
    7: {
        title: 'August',
        description: 'Back to school! Welcome new members and let\'s start this semester strong.',
        image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1770&auto=format&fit=crop', // School / Campus
    },
    8: {
        title: 'September',
        description: 'Fall into rhythm. Join our General Body Meetings and find your community.',
        image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2668&auto=format&fit=crop', // Autumn / Leaves
    },
    9: {
        title: 'October',
        description: 'Spooky season is here! Don\'t get ghosted by recruiters—prepare for the National Convention.',
        image: 'https://images.unsplash.com/photo-1508182314998-a27943f63f5f?q=80&w=2669&auto=format&fit=crop', // Fall / Halloween
    },
    10: {
        title: 'November',
        description: 'Giving thanks and giving back. Join us for community service and gratitude.',
        image: 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?q=80&w=2576&auto=format&fit=crop', // Cozy / Thanksgiving
    },
    11: {
        title: 'December',
        description: 'Wrapping up the year with holiday cheer. Good luck on finals and enjoy the break!',
        image: 'https://images.unsplash.com/photo-1482517967863-00e15c9b8043?q=80&w=2668&auto=format&fit=crop', // Holiday / Winter
    },
};
