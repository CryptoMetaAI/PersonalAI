import { ISubNav } from '../SubNav/SubNav';

const NAV_LINKS: ISubNav[] = [
  { label: 'Home', href: '/' },
  {
    label: 'ChatBot',
    href: '/chatbot',
    children: [
      {
        label: 'KOL',
        href: '/chatbot/kol',
        logo: 'wizard',
      },
      {
        label: 'VIP',
        href: '/chatbot/vip',
        logo: 'documentation',
      },
    ],
  },
];

export default NAV_LINKS;
