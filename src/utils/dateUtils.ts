export const formatDate = (dateString: string, showWeekday: boolean = false) => {
  const datum = new Date(dateString).toLocaleDateString('de-DE', {
    ...(showWeekday && { weekday: 'long' }),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return datum;
};