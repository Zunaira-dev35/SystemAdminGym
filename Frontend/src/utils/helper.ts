export function capitalize(str: string) {
  if (typeof str !== 'string' || str.length === 0) return '-';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
export function toUpperCase(str: string): string {
  if (typeof str !== 'string' || str.length === 0) return '-';
  return str.toUpperCase();
}

export function formatTimeTo12Hour(timeString: string) {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(":").map(Number);

  if (isNaN(hours) || isNaN(minutes)) return "Invalid time";

  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // Convert 0 to 12
  const formattedMinutes = minutes.toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes} ${period}`;
}
export function formatDateToShortString(dateString?: string | null): string {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}


export const statusOptions = [
    { label: "All", value: "" },
    { label: "Requested", value: "requested" },
    { label: "Scheduled", value: "scheduled" },
    { label: "Booking", value: "booking" },
    { label: "Accepted", value: "accepted" },
    { label: "Started to Pickup", value: "started-to-pickup" },
    { label: "Pickup Arrived", value: "pickup-arrived" },
    { label: "In Progress", value: "in-progress" },
    { label: "Stop Over", value: "stop-over" },
    { label: "Destination Arrived", value: "destination-arrived" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Rejected", value: "rejected" },
    { label: "Unassigned", value: "unassigned" },
    { label: "Not Responded", value: "not-responded" }
];

export const isValidTimeRange = (start?: string, end?: string): boolean => {
  if (!start || !end) return true; // incomplete → let validation message handle it

  // Convert HH:mm:ss to minutes since midnight
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);

  // Same day only → end must be after start, no crossing midnight
  return endMin > startMin;
};