// Homepage announcement banner — holds one announcement at a time.
//
// To publish a new announcement, edit the object below in place (don't duplicate it):
//   - id:        new unique slug. Keys the "dismissed" flag in visitors' localStorage,
//                so a new id re-shows the banner to people who closed the previous one.
//   - text/link: the new content.
//   - startDate/endDate (YYYY-MM-DD): visibility window, evaluated at build time.
//                Leave either empty ("") to skip that bound. The banner disappears on
//                the first deploy after endDate.
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
