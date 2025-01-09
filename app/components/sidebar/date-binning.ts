import { format, isAfter, isThisWeek, isThisYear, isToday, isYesterday, subDays } from 'date-fns';
import type { ChatHistoryItem } from '~/lib/persistence';

type Bin = { category: string; items: ChatHistoryItem[] };

export function binDates(_list: ChatHistoryItem[]) {
  const list = _list.toSorted((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const binLookup: Record<string, Bin> = {};
  const bins: Array<Bin> = [];

  list.forEach((item) => {
    const category = dateCategory(new Date(item.timestamp));

    if (!(category in binLookup)) {
      const bin = {
        category,
        items: [item],
      };

      binLookup[category] = bin;

      bins.push(bin);
    } else {
      binLookup[category].items.push(item);
    }
  });

  return bins;
}

function dateCategory(date: Date) {
  if (isToday(date)) {
    return 'Aujourd\'hui';
  }

  if (isYesterday(date)) {
    return 'Hier';
  }

  if (isThisWeek(date)) {
    // e.g., "Lundi"
    const dayName = format(date, 'eeee');
    // Traduire les jours de la semaine
    const days: { [key: string]: string } = {
      'Monday': 'Lundi',
      'Tuesday': 'Mardi',
      'Wednesday': 'Mercredi',
      'Thursday': 'Jeudi',
      'Friday': 'Vendredi',
      'Saturday': 'Samedi',
      'Sunday': 'Dimanche'
    };
    return days[dayName] || dayName;
  }

  const thirtyDaysAgo = subDays(new Date(), 30);

  if (isAfter(date, thirtyDaysAgo)) {
    return '30 derniers jours';
  }

  if (isThisYear(date)) {
    // e.g., "Juillet"
    const monthName = format(date, 'MMMM');
    // Traduire les mois
    const months: { [key: string]: string } = {
      'January': 'Janvier',
      'February': 'Février',
      'March': 'Mars',
      'April': 'Avril',
      'May': 'Mai',
      'June': 'Juin',
      'July': 'Juillet',
      'August': 'Août',
      'September': 'Septembre',
      'October': 'Octobre',
      'November': 'Novembre',
      'December': 'Décembre'
    };
    return months[monthName] || monthName;
  }

  // e.g., "Juillet 2023"
  const monthAndYear = format(date, 'MMMM yyyy');
  const [month, year] = monthAndYear.split(' ');
  const months: { [key: string]: string } = {
    'January': 'Janvier',
    'February': 'Février',
    'March': 'Mars',
    'April': 'Avril',
    'May': 'Mai',
    'June': 'Juin',
    'July': 'Juillet',
    'August': 'Août',
    'September': 'Septembre',
    'October': 'Octobre',
    'November': 'Novembre',
    'December': 'Décembre'
  };
  return `${months[month] || month} ${year}`;
}
