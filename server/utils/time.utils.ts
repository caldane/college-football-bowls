import { UserPanelWithTracks } from "../../common/models/IUserPanel";

export function formatDateTime(dateTime: string, type: 24 | 12) {
    return dateTime.startsWith("1899")
        ? new Date(dateTime).toLocaleTimeString("en", { timeZone: "PST", hour12: type === 12, hour: "2-digit", minute: "2-digit" })
        : dateTime;
}

const dayOrder: Record<string, number> = {
    "Thursday": 0,
    "Friday": 1,
    "Saturday": 2,
    "Sunday": 3,
};

export function parseTime(timeStr: string): number {
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (timeStr.toLowerCase().includes("midnight")) {
        hours = 0;      
        minutes = 0;  
    }

    if (period === "PM" && hours < 12) {
        hours += 12;
    }

    if (hours < 4) {
        // If the hour is less than 4, it is likely in the early morning of the next day
        hours += 24; // Adjust to next day
    }

    return hours * 60 + minutes; // return minutes since midnight
}

export function sortPanels(panels: UserPanelWithTracks[]) {
    return panels.sort(panelsSortDelegate);
}

export function panelsSortDelegate(a: UserPanelWithTracks, b: UserPanelWithTracks) {
    const dayDiff = dayOrder[a.programmingDay] - dayOrder[b.programmingDay];
    if (dayDiff !== 0) return dayDiff;

    return parseTime(a.startTime) - parseTime(b.startTime);
}