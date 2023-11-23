import "dotenv/config";
import { format } from "date-fns";
import fetch from "node-fetch";

const STATS_URL = `https://www.nytimes.com/svc/crosswords/v3/${process.env.SUBSCRIBER_ID}/stats-and-streaks.json?date_start=2014-01-01&start_on_monday=true`;
const STREAK_OFFSET = process.env.STREAK_OFFSET;

const sendPagerDutyNotification = async () => {
    try {
        await fetch('https://events.pagerduty.com/v2/enqueue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payload: {
                    summary: "Finish the crossword!",
                    severity: "critical",
                    source: `Puzzle Reminder System`
                },
                routing_key: process.env.PAGERDUTY_KEY,
                event_action: "trigger"
            })
        });
    } catch (e) {
        console.error("Could not notify via PagerDuty");
        console.error(e);
    }
};

const poller = async () => {
    try {
        const response = await fetch(STATS_URL);

        if (!response.ok) {
            console.log(`Received a ${response.status} status`);
            const text = await response.text();
            console.log(`Response body: ${text}`);
            return;
        }

        const stats = await response.json();
        const today = format(new Date(), "yyyy-MM-dd");
        const done = stats.results.streaks.dates[STREAK_OFFSET][1] >= today;
        console.log(`[${new Date()}] Streak is at ${stats.results.streaks.current_streak} through ${stats.results.streaks.dates[STREAK_OFFSET][1]} ${done ? "✅" : "😬"}`);

        if (!done && new Date().getHours() > 12) {
            console.log("Call me maybe");
            await sendPagerDutyNotification();
        }
    } catch (e) {
        console.log(`Failed to run check due to ${e}`);
    }
};

poller();
setInterval(poller, 60 * 60 * 1000);
