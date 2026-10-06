// Homepage announcement banner. Date visibility is evaluated at build time.
// Change `id` for each new announcement; it keys the "dismissed" state in visitors' localStorage.
// Leave a date empty to skip that bound.
const announcement = {
  id: "kubecon-na-2026",
  text: "Join us at KubeCon + CloudNativeCon North America on Nov 9-12 🎉",
  link: "https://events.linuxfoundation.org/kubecon-cloudnativecon-north-america/register/?utm_source=kuadrant&utm_medium=ribbon-banner&utm_campaign=KubeCon-CloudNativeCon-NA-2026&utm_content=hero",
  startDate: "2026-10-06",
  endDate: "2026-11-12",
};

const now = new Date();
const afterStart = !announcement.startDate || now >= new Date(announcement.startDate);
const beforeEnd = !announcement.endDate || now <= new Date(`${announcement.endDate}T23:59:59Z`);

module.exports = {
  ...announcement,
  visible: afterStart && beforeEnd,
};
