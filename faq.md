# Time to Inbox FAQ

> Short answers to common questions about how long email takes to arrive and why it is sometimes late. Each answer links to a longer guide or a primary source.

Source: https://timetoinbox.com/faq/

## What is time to inbox (TTI)?

Time to inbox is the time between sending an email and its arrival in the recipient's inbox, usually measured in seconds. It measures delivery speed, not whether the message was opened. See [what is time to inbox](https://timetoinbox.com/what-is-time-to-inbox/).

## How long should an email take to arrive?

Between well-configured servers, delivery usually takes a few seconds. There is no official target. Forward Email alerts its own engineers when a test message takes 10 seconds or longer. A delay of several minutes or more usually means a server deferred the message and the sender retried it later.

## Why is my password reset or verification email late?

The most common reasons are greylisting at the recipient's provider, rate limiting of the sender, failed SPF or DKIM checks, or a mail app that only checks for new mail every few minutes. Check the spam folder and webmail first. If the message is there, read its Received headers to see which hop held it. See [what affects email delivery speed](https://timetoinbox.com/what-affects-email-delivery-speed/).

## What is greylisting and how long does it delay email?

Greylisting is when a receiving server temporarily rejects mail from a sender it has not seen before, with a 4xx reply, and accepts it when the sender retries ([RFC 6647](https://www.rfc-editor.org/rfc/rfc6647)). The delay equals the sender's retry interval. Forward Email's greylist requires 5 minutes to pass ([Forward Email FAQ](https://forwardemail.net/faq#do-you-have-a-greylist)), Postfix retries deferred mail after at least 300 seconds by default, and RFC 5321 suggests waiting at least 30 minutes.

## Do SPF, DKIM and DMARC affect how fast email arrives?

Yes, indirectly. Gmail requires SPF or DKIM for all senders and SPF, DKIM and DMARC for senders of more than 5,000 messages a day, and says following them helps prevent Gmail from limiting sending rates, blocking messages or marking messages as spam ([Google sender guidelines](https://support.google.com/a/answer/81126)). A DNS error during an SPF check can also lead to a temporary 451 rejection and a retry ([RFC 7208](https://www.rfc-editor.org/rfc/rfc7208#section-8.6)).

## How do I measure time to inbox?

Send a test email with a unique Message-ID to a mailbox you control, poll it over IMAP until the message appears, and subtract the send time from the arrival time using one clock. For a single message you already have, compare the timestamps in its Received headers. See [how to measure time to inbox](https://timetoinbox.com/how-to-measure-time-to-inbox/).

## Is time to inbox the same as deliverability?

No. Deliverability usually means whether mail is accepted and lands in the inbox instead of spam. Time to inbox measures how long that takes. A greylisted message counts as delivered but can arrive many minutes late.

## Why can forwarded email be slower than direct email?

A forwarded message is delivered twice: once to the forwarding server and again to the final mailbox. The second delivery can be greylisted, rate limited or deferred on its own. Forward Email publishes direct and forwarded times side by side on its [live TTI page](https://forwardemail.net/tti).

## Why does email show up in webmail before my phone?

The message is already in the mailbox, but the app on your phone has not checked yet. Apps that use push or IMAP IDLE show new mail right away, and apps that fetch on a schedule show it on the next fetch. This delay happens on the reader's device, not on the delivery path.

## Where can I see Forward Email's time to inbox?

On the [Forward Email time to inbox page](https://forwardemail.net/tti). It shows the latest direct and forwarding delivery times for each tested provider and a chart of the past 24 hours. [This guide explains how those numbers are measured](https://timetoinbox.com/forward-email-time-to-inbox/).

## Is the Forward Email TTI monitor code public?

Yes. The monitor is [jobs/tti.js](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js) in the forwardemail.net repository on GitHub, and the IMAP polling logic is in [helpers/get-message.js](https://github.com/forwardemail/forwardemail.net/blob/master/helpers/get-message.js).

## Does TimeToInbox use cookies or tracking?

No. This site is static HTML and CSS with no JavaScript, cookies, analytics or third-party requests. It is hosted on GitHub Pages and served through Cloudflare, which processes visitor IP addresses. Read the [privacy policy](https://timetoinbox.com/privacy/).
