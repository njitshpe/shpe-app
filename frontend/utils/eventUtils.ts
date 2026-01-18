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
