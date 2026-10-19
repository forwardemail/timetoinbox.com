# Time to Inbox (TTI): How Fast Email Reaches the Inbox

> Time to inbox is the time between sending an email and its arrival in the recipient's inbox. These guides explain what it measures, how to measure it yourself, and what slows delivery down.

Source: https://timetoinbox.com/

## What is time to inbox?

Time to inbox (TTI) is the number of seconds between the moment an email is sent and the moment it lands in the recipient's inbox. A healthy TTI is a few seconds. Minutes or hours usually point to a queue, a retry, or a filter on the way.

Postmark, which publishes TTI for its own sending, defines it as "the length of time it takes from when an email is sent from a client until it is logged as delivered" ([Postmark TTI page](https://tti.postmarkapp.com/)). Forward Email measures the same thing by sending test messages to real mailboxes and timing how long each one takes to show up over IMAP.

TTI matters most for email that someone is waiting for:

- password reset links and sign-in links
- one-time codes for two-factor authentication
- account verification and order confirmation emails
- monitoring alerts and incident notifications
- replies in a live conversation or support thread

[Read the full definition of time to inbox](https://timetoinbox.com/what-is-time-to-inbox/), including how it differs from delivery rate and inbox placement.

*Where the seconds go between send and inbox.*

## Time to inbox guides

- **[What is time to inbox](https://timetoinbox.com/what-is-time-to-inbox/)**: The definition, where the clock starts and stops, and how TTI compares with delivery rate, inbox placement and bounce rate.
- **[How to measure TTI](https://timetoinbox.com/how-to-measure-time-to-inbox/)**: Read delays from Received headers, or set up seed mailboxes and a script that sends a test email and polls IMAP until it arrives.
- **[What slows email down](https://timetoinbox.com/what-affects-email-delivery-speed/)**: Greylisting, retry queues, SPF, DKIM and DMARC, sender reputation, rate limits, forwarding hops and mail apps that fetch on a schedule.
- **[Forward Email's TTI monitor](https://timetoinbox.com/forward-email-time-to-inbox/)**: How Forward Email measures direct and forwarded delivery times to Gmail, Apple iCloud, Yahoo/AOL and its own mailboxes, with public source code.
- **[Time to inbox FAQ](https://timetoinbox.com/faq/)**: Short answers about normal delivery times, delayed verification emails, greylisting, and why one provider can be slower than another.
- **[About TimeToInbox](https://timetoinbox.com/about/)**: Who runs this site, how to report a mistake, where the source code lives, and what data the site collects (none).

## Common causes of slow delivery, with numbers

Most delays come from a temporary rejection followed by a retry. The retry schedule of the sending server then decides how long the message waits. These figures come from standards and published configuration defaults.

*Delay sources and their documented timings*

| Cause | Documented timing | Source |
| --- | --- | --- |
| Retry after a temporary failure (any SMTP sender) | Retry interval "SHOULD be at least 30 minutes"; give up after at least 4 to 5 days | [RFC 5321, section 4.5.4.1](https://www.rfc-editor.org/rfc/rfc5321#section-4.5.4.1) |
| Postfix deferred queue | Retries between 300 seconds and 4000 seconds apart; queue scanned every 300 seconds; message returned after 5 days | [Postfix postconf(5)](https://www.postfix.org/postconf.5.html#minimal_backoff_time) |
| Greylisting at Forward Email | First message from a new sender is deferred with a 450 code until 5 minutes have passed | [Forward Email FAQ](https://forwardemail.net/faq#do-you-have-a-greylist) |
| Forward Email TTI alert threshold | Engineers are emailed when a test delivery takes 10 seconds or longer, or does not arrive | [jobs/tti.js](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js) |

A message that is greylisted by the receiver and then retried on a 30 minute schedule arrives about 30 minutes late, even though nothing is wrong with it. See [what affects email delivery speed](https://timetoinbox.com/what-affects-email-delivery-speed/) for each cause and what you can change.

## Forward Email publishes its time to inbox

Forward Email runs a monitor that sends test emails to mailboxes at major email providers and records how long each one takes to arrive. The results are public on the [Forward Email time to inbox page](https://forwardemail.net/tti), with a 24-hour chart, and the code that produces them is [public on GitHub](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js).

Each run measures two paths per provider: a direct message, and a message sent through a forwarding address that ends up in the same mailbox. The numbers change with every test run, so this site links to the live page instead of copying values that would go stale.

[Read how the Forward Email TTI monitor works](https://timetoinbox.com/forward-email-time-to-inbox/)

## Email from the team that publishes its TTI

Forward Email is open-source email hosting and forwarding with IMAP, POP3, SMTP, CalDAV and CardDAV support. Its free plan forwards email for your domain once you add MX and TXT DNS records, with no account needed.

[Get started with Forward Email](https://forwardemail.net)

[View live TTI results](https://forwardemail.net/tti)
