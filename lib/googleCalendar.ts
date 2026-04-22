export interface CalendarEventParams {
  title:           string;
  description:     string;
  startTime:       Date;
  endTime:         Date;
  attendeeEmails:  string[];
}

export interface CalendarEventResult {
  eventId:  string;
  meetLink: string | null;
  htmlLink: string;
}

/** Create a Google Calendar event with an auto-generated Meet link. */
export async function createCalendarEvent(
  accessToken: string,
  params: CalendarEventParams
): Promise<CalendarEventResult> {
  const body = {
    summary:     params.title,
    description: params.description,
    start: { dateTime: params.startTime.toISOString(), timeZone: "UTC" },
    end:   { dateTime: params.endTime.toISOString(),   timeZone: "UTC" },
    attendees: params.attendeeEmails.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `coffeechat-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Calendar event creation failed: ${await res.text()}`);

  const data = await res.json();
  return {
    eventId:  data.id,
    meetLink: data.conferenceData?.entryPoints?.[0]?.uri ?? null,
    htmlLink: data.htmlLink,
  };
}

/** Build an "Add to Google Calendar" URL — no auth required. */
export function buildAddToGCalUrl(params: {
  title:     string;
  startTime: Date;
  endTime:   Date;
  details:   string;
  location?: string;
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const q = new URLSearchParams({
    action:  "TEMPLATE",
    text:    params.title,
    dates:   `${fmt(params.startTime)}/${fmt(params.endTime)}`,
    details: params.details,
    ...(params.location ? { location: params.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** Generate an ICS file string — universally compatible. */
export function buildICSContent(params: {
  uid:         string;
  title:       string;
  startTime:   Date;
  endTime:     Date;
  description: string;
  location?:   string;
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CoffeeChat//EN",
    "BEGIN:VEVENT",
    `UID:${params.uid}@coffeechat`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(params.startTime)}`,
    `DTEND:${fmt(params.endTime)}`,
    `SUMMARY:${params.title}`,
    `DESCRIPTION:${params.description.replace(/\n/g, "\\n")}`,
    ...(params.location ? [`LOCATION:${params.location}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
