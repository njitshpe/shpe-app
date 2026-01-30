export type CommitteeId =
    | 'external-vp'
    | 'internal-vp'
    | 'treasurer'
    | 'secretary'
    | 'public-relations'
    | 'marketing'
    | 'event-coordinator'
    | 'outreach'
    | 'pre-college'
    | 'membership'
    | 'shpetinas'
    | 'internshpe'
    | 'webmaster';

export interface CommitteeInfo {
    id: CommitteeId;
    title: string;
    shortTitle: string;
    description: string;
    image: string;
    icon: string;
    color: string;
}

export const COMMITTEE_DATA: Record<CommitteeId, CommitteeInfo> = {
    'external-vp': {
        id: 'external-vp',
        title: 'External Vice President',
        shortTitle: 'External VP',
        description: 'Establish and maintain relationships with external corporate partners and organizations. Organize any external corporate documents, send emails to professionals on a frequent basis, and attend in-person/virtual meetings to discuss unique ways to partner with corporate.',
        image: 'https://images.unsplash.com/photo-1594581979864-36977b15d0dc?q=80&w=1556&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'globe-outline',
        color: '#5E5CE6',
    },
    'internal-vp': {
        id: 'internal-vp',
        title: 'Internal Vice President',
        shortTitle: 'Internal VP',
        description: 'Establish and maintain relationships with internal NJIT colleges, departments, and student organizations for sponsorships and collaborations through emails and in-person/virtual meetings.',
        image: 'https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'people-outline',
        color: '#FF9F0A',
    },
    'treasurer': {
        id: 'treasurer',
        title: 'Treasurer',
        shortTitle: 'Treasurer',
        description: 'Track income, expenses, reimbursements by maintaining accurate financial records and documents, help with fundraising events, help with researching and applying for grants.',
        image: 'https://images.unsplash.com/photo-1534469650761-fce6cc26ac0d?q=80&w=1771&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'cash-outline',
        color: '#30D158',
    },
    'secretary': {
        id: 'secretary',
        title: 'Secretary',
        shortTitle: 'Secretary',
        description: "Assist in maintaining inventory of the office materials, supplies, and merchandise. Help to organize the office when needed. Committed to attending SHPE events to help take attendance. Come to the SHPE office during the Secretary's office hours to be creative and learn how we send out the biweekly newsletter!",
        image: 'https://images.unsplash.com/photo-1702628772145-f788e5a9ec42?q=80&w=1748&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'document-text-outline',
        color: '#BF5AF2',
    },
    'public-relations': {
        id: 'public-relations',
        title: 'Public Relations',
        shortTitle: 'Public Relations',
        description: "Promoting SHPE's mission and vision, events, and achievements to students, faculty, and the broader community. Maintain and oversee our social media accounts across various platforms, taking pictures during events, collaborate with marketing team, and more.",
        image: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'chatbubbles-outline',
        color: '#FF375F',
    },
    'marketing': {
        id: 'marketing',
        title: 'Marketing',
        shortTitle: 'Marketing',
        description: 'Creating promotional material, designing SHPE merchandise, helping maintain NJIT SHPE website.',
        image: 'https://images.unsplash.com/photo-1764096534686-68091ce5ab45?q=80&w=2231&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'megaphone-outline',
        color: '#FF6482',
    },
    'event-coordinator': {
        id: 'event-coordinator',
        title: 'Event Coordinator',
        shortTitle: 'Event Coordinator',
        description: 'Plan, coordinate, and manage events for NJIT SHPE. Help with making google forms and or taking attendance for our events. Help either set up and or clean up the rooms we used for events. Buy any last-min supplies we may need (you will get reimbursed for any money or gas spent for NJIT SHPE).',
        image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'calendar-outline',
        color: '#0A84FF',
    },
    'outreach': {
        id: 'outreach',
        title: 'Outreach',
        shortTitle: 'Outreach',
        description: 'Help plan and coordinate volunteering events, help make google forms and research anyone in our community who wants to help.',
        image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'hand-left-outline',
        color: '#32D74B',
    },
    'pre-college': {
        id: 'pre-college',
        title: 'Pre-College',
        shortTitle: 'Pre-College',
        description: 'Sending weekly emails to other organizations about our upcoming DDC event, taking meeting notes, keeping track in an organized manner of any forms and sign in sheets.',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'school-outline',
        color: '#FFD60A',
    },
    'membership': {
        id: 'membership',
        title: 'Membership Development',
        shortTitle: 'Membership Dev',
        description: 'Oversee attendance and feedback forms for NJIT SHPE tutoring program. Help make presentations, help with outreach for first years seminar, help EOP cohort meetings and any events to promote SHPE.',
        image: 'https://images.unsplash.com/photo-1499540633125-484965b60031?q=80&w=1771&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'person-add-outline',
        color: '#AC8E68',
    },
    'shpetinas': {
        id: 'shpetinas',
        title: 'SHPEtinas',
        shortTitle: 'SHPEtinas',
        description: 'SHPEtinas is committed to creating an inclusive and empowering environment where women and Latinas in STEM can thrive, lead, and inspire. We believe in fostering a supportive community that celebrates achievements, addresses challenges, and creates pathways for success in engineering and technology fields.',
        image: 'https://www.shpenjit.org/_next/image?url=%2Fimages%2Fevents%2FSHPEtina%2FSHPEtinas.JPG&w=3840&q=75',
        icon: 'flower-outline',
        color: '#FF6B9D',
    },
    'internshpe': {
        id: 'internshpe',
        title: 'InternSHPE',
        shortTitle: 'InternSHPE',
        description: "InternSHPE provides hands-on opportunities to develop technical skills, build professional networks, and gain valuable industry experience while contributing to our chapter's mission.",
        image: 'https://www.shpenjit.org/_next/image?url=%2Fimages%2Fevents%2FHow-to%2Finterview10%3A18.JPG&w=3840&q=75',
        icon: 'briefcase-outline',
        color: '#00CED1',
    },
    'webmaster': {
        id: 'webmaster',
        title: 'Webmaster',
        shortTitle: 'Webmaster',
        description: 'Maintain and develop the NJIT SHPE website and mobile application. Work with the latest web technologies to create an engaging digital presence for the organization.',
        image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=2106&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'code-slash-outline',
        color: '#64D2FF',
    },
};

export const getCommitteeInfo = (committeeId: CommitteeId): CommitteeInfo => {
    return COMMITTEE_DATA[committeeId];
};
