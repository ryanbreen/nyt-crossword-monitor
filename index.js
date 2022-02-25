import 'dotenv/config';

import { format } from 'date-fns';

import fetch from 'node-fetch';

import twilio from 'twilio'
const twilioClient = twilio(process.env.TWILIO_KEY, process.env.TWILIO_SECRET);

const STATS_URL = `https://nyt-games-prd.appspot.com/svc/crosswords/v3/${process.env.SUBSCRIBER_ID}/stats-and-streaks.json?date_start=2014-01-01&start_on_monday=true`

const STREAK_START = process.env.STREAK_START;

const poller = async () => {

    try {
    const response = await fetch(STATS_URL);
    const stats = await response.json();

    const today = format(new Date(), 'yyyy-MM-dd');

    const now = new Date();
    const fullDaysSinceEpoch = Math.floor(now/8.64e7);

    const done = fullDaysSinceEpoch - stats.results.streaks.current_streak >= STREAK_START;

    console.log(`[${now}] Streak is at ${stats.results.streaks.current_streak} ${done ? '✅' : '😬' }`);

    // if the puzzle isn't done and it's past noon, text to yell at me
    if (!done && now.getHours() > 12) {
        console.log('Call me maybe');

        try {
            await twilioClient.messages.create({
                body: "Finish the crossword!",
                to: process.env.TWILIO_TO,
                from: process.env.TWILIO_FROM
            });
        } catch(e) {
            console.error('Could not notify administrator');
            console.error(e);
        }
    }
    } catch(e) {
        console.log(`Failed to run check due to ${e}`);
    }

}

poller();
setInterval(poller, 60*60*1000);