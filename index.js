import "dotenv/config";

import { format } from "date-fns";

import fetch from "node-fetch";

import twilio from "twilio";
const twilioClient = twilio(process.env.TWILIO_KEY, process.env.TWILIO_SECRET);

const STATS_URL = `https://www.nytimes.com/svc/crosswords/v3/${process.env.SUBSCRIBER_ID}/stats-and-streaks.json?date_start=2014-01-01&start_on_monday=true`;

const STREAK_OFFSET = process.env.STREAK_OFFSET;

const poller = async () => {
    try {
        const response = await fetch(STATS_URL);

        // Debugging: Log HTTP Status Code and Response Text
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

        // if the puzzle isn't done and it's past noon, text to yell at me
        if (!done && new Date().getHours() > 12) {
            console.log("Call me maybe");

            try {
                await twilioClient.messages.create({
                    body: "Finish the crossword!",
                    to: process.env.TWILIO_TO,
                    from: process.env.TWILIO_FROM,
                });
            } catch (e) {
                console.error("Could not notify administrator");
                console.error(e);
            }
        }
    } catch (e) {
        console.log(`Failed to run check due to ${e}`);
    }
};

poller();
setInterval(poller, 60 * 60 * 1000);
