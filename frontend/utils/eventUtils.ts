import { Event } from '@/types/events';
import { SHPE_COLORS, NEON_COLORS } from '@/constants/colors';

// Gradient definitions (transparent -> semi-opaque -> opaque)
export const EVENT_GRADIENTS = {
    social: ['transparent', 'rgba(255, 95, 5, 0.4)', 'rgba(255, 95, 5, 0.95)'], // SHPE Orange
    workshop: ['transparent', 'rgba(0, 163, 224, 0.4)', 'rgba(0, 163, 224, 0.95)'], // SHPE Light Blue
    general: ['transparent', 'rgba(0, 40, 85, 0.4)', 'rgba(0, 40, 85, 0.95)'], // SHPE Dark Blue
    corporate: ['transparent', 'rgba(103, 58, 183, 0.4)', 'rgba(103, 58, 183, 0.95)'], // Purple
    default: ['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)'], // Standard Dark
};

export const getEventGradient = (event: Event): string[] => {
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

    return EVENT_GRADIENTS.default;
};
