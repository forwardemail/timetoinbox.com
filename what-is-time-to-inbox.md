# What Is Time to Inbox (TTI)?

> Time to inbox is the time it takes for an email to go from the sender to the recipient's inbox. It is a speed metric: it tells you how long delivery took, not whether the message was opened.

Source: https://timetoinbox.com/what-is-time-to-inbox/

## Time to inbox definition

Time to inbox (TTI) is the elapsed time between sending an email and the moment the message is stored in the recipient's inbox, where the recipient can read it. It is usually measured in seconds.

Postmark, an email delivery service that publishes TTI for its own sending, puts it this way: "Time to Inbox (TTI) is the length of time it takes from when an email is sent from a client until it is logged as delivered" ([Postmark TTI page](https://tti.postmarkapp.com/)). Postmark chose this metric over "time to delivery" or "time to acceptance" because those do not include delays caused by mailbox provider issues or throttling ([Postmark blog](https://postmarkapp.com/blog/delivery-performance-and-transparency)).

Forward Email uses the same idea in its public monitor: it sends a test message, then checks the recipient's mailbox over IMAP until the message appears, and records the difference ([how the Forward Email monitor works](https://timetoinbox.com/forward-email-time-to-inbox/)).

## Where the clock starts and stops

The clock starts when the message leaves the sender. In practice that is the moment your application hands the message to an SMTP server or calls a sending API.

The clock stops when the message is in the recipient's mailbox and can be read over IMAP, POP3 or webmail. Between those two points the message can wait in several places:

1. **The sending server's queue.** The server looks up the recipient domain's MX records and connects to the receiving server. If that attempt fails with a temporary error, the message waits for a retry.
2. **The receiving server.** It checks the sender (greylisting, rate limits, blocklists), the authentication results (SPF, DKIM, DMARC) and the content (spam and virus scanning). Any of these can defer the message.
3. **Forwarding hops.** If the address forwards to another mailbox, the message is sent again from the forwarding server to the final provider, which adds a second trip through steps 1 and 2.
4. **Mailbox storage.** The receiving system files the message in the inbox or in another folder such as spam.

The time a mail app takes to show the message is usually left out, because it depends on the reader's device. Apps that use push or the IMAP IDLE command ([RFC 2177](https://www.rfc-editor.org/rfc/rfc2177)) show new mail as it arrives. Apps that check for mail on a schedule show it on the next check.

## Time to inbox compared with other email metrics

TTI answers "how long did it take?". The other common deliverability metrics answer "did it arrive?" and "where did it land?".

*Email delivery metrics and what each one measures*

| Metric | What it measures | What it does not show |
| --- | --- | --- |
| Time to inbox (TTI) | Seconds from send until the message is in the recipient's mailbox | Whether the message landed in the inbox or the spam folder, unless the test checks the folder |
| Time to acceptance | Seconds until the receiving server accepts the message with a 250 reply | Delays inside the receiving provider after it accepts the message |
| Delivery rate | Share of messages accepted by receiving servers | Speed, and whether accepted mail reached the inbox |
| Inbox placement rate | Share of messages that land in the inbox instead of spam or another tab | Speed |
| Bounce rate | Share of messages rejected, as hard (permanent) or soft (temporary) bounces | Messages that are delayed but still delivered |
| Spam complaint rate | Share of delivered messages that recipients mark as spam | Speed and placement of messages nobody reported |

A sender can have a high delivery rate and a poor TTI at the same time. Greylisted mail, for example, is accepted in the end, so it counts as delivered, but it can arrive many minutes late.

## Direct and forwarded time to inbox

Direct TTI covers a message sent straight to the recipient's provider. Forwarded TTI covers a message sent to an address that forwards it to another mailbox, for example a custom domain address that forwards to Gmail. The forwarded path has an extra SMTP hop, so it gives the receiving provider a second chance to defer the message. Forward Email publishes both numbers for each provider it tests on its [live TTI page](https://forwardemail.net/tti).

## What is a good time to inbox?

There is no standard target. Healthy delivery between well-configured servers usually takes a few seconds, and anything that involves a retry takes minutes. As a reference point, Forward Email's monitor emails its engineers when a test message takes 10 seconds or longer to arrive, or does not arrive within the one-minute polling window ([jobs/tti.js](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js)).

The right threshold for you depends on the message. A sign-in code that expires quickly needs a tighter limit than a weekly report.

## Why time to inbox matters

- **Sign-in and password reset emails.** The person is waiting on the screen, and many links and codes expire after a short time.
- **Two-factor codes by email.** A late code can expire before it arrives, which forces a resend and adds another wait.
- **Receipts and order confirmations.** When they arrive late, people contact support to ask whether the order went through.
- **Alerts and incident notices.** Monitoring email loses its value if it arrives after someone has already noticed the problem.
- **Conversations.** Slow delivery breaks the flow of a support thread or a mailing list discussion. RFC 6647 notes that greylisting delays can be costly when delivery is time critical.

Next, see [how to measure time to inbox yourself](https://timetoinbox.com/how-to-measure-time-to-inbox/) or [what affects email delivery speed](https://timetoinbox.com/what-affects-email-delivery-speed/).

## Sources for this page

- [Postmark: Time to Inbox](https://tti.postmarkapp.com/)
- [Postmark: delivery performance and transparency](https://postmarkapp.com/blog/delivery-performance-and-transparency)
- [Forward Email: Time to Inbox](https://forwardemail.net/tti)
- [RFC 2177: IMAP4 IDLE command](https://www.rfc-editor.org/rfc/rfc2177)
- [RFC 6647: Email Greylisting, An Applicability Statement for SMTP](https://www.rfc-editor.org/rfc/rfc6647)
