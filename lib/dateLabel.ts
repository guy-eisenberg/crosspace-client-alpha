export function dateLabel(time: number) {
  const inputDate = new Date(time);
  const today = new Date();

  // Normalize to midnight (ignore hours/minutes/seconds)
  const normalize = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const inputDay = normalize(inputDate);
  const todayDay = normalize(today);

  const diffDays = Math.floor(
    (todayDay.getTime() - inputDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    const dd = String(inputDate.getDate()).padStart(2, "0");
    const mm = String(inputDate.getMonth() + 1).padStart(2, "0");
    const yyyy = inputDate.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }
}
