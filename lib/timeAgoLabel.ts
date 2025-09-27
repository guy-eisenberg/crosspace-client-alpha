export function timeAgoLabel(time: number) {
  const date = new Date(time);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes <= 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInMinutes < 60 * 24) {
    const hours = Math.floor(diffInMinutes / 60);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else {
    const days = Math.floor(diffInMinutes / (60 * 24));
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
}
