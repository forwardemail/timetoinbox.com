# How to Measure Time to Inbox

> You can check one message by reading its Received headers, or measure TTI continuously with seed mailboxes and a small script that sends a test email and watches the inbox over IMAP.

Source: https://timetoinbox.com/how-to-measure-time-to-inbox/

## Quick answer

To measure time to inbox, send a test email with a unique Message-ID to a mailbox you control, poll that mailbox over IMAP until the message appears, and subtract the send time from the arrival time. Take both timestamps from the same clock.

For a one-off check of a message you already received, read its Received headers instead. They show when each server along the way handled the message.

## Method 1: read the Received headers of one message

Every SMTP server that handles a message adds a `Received:` line at the top of the headers, with a timestamp ([RFC 5321, section 4.4](https://www.rfc-editor.org/rfc/rfc5321#section-4.4)). Reading them from the bottom up shows the path of the message and the gap between hops.

1. Open the full headers. In Gmail, open the message menu and choose **Show original**. In Apple Mail, choose **View -> Message -> All Headers**. Most other apps have an option named "View source" or similar.
2. Find the lowest `Received:` line. That is the first server that accepted the message.
3. Compare its timestamp with the `Date:` header (the time the sender's app created the message) and with each `Received:` line above it.
4. A large gap between two lines tells you which hop held the message.

An example with made-up hosts and times, shortened for reading:

```text
Received: from mx.example.net by mailbox.example.net; Tue, 3 Mar 2026 10:07:02 +0000
Received: from smtp.example.com by mx.example.net; Tue, 3 Mar 2026 10:07:01 +0000
Received: from app.example.com by smtp.example.com; Tue, 3 Mar 2026 10:01:58 +0000
Date: Tue, 3 Mar 2026 10:01:57 +0000
```

Here the message left `smtp.example.com` about 5 minutes after it arrived there. A gap like this often means the receiving server deferred the first attempt (for example with greylisting) and the sender retried later.

The [Google Admin Toolbox Messageheader tool](https://toolbox.googleapps.com/apps/messageheader/) parses pasted headers and shows the delay at each hop.

**Limits of this method:** each timestamp comes from a different server's clock, so small differences can be clock skew. Forward Email's monitor code makes the same point and does not rely on Received headers or the Date header for this reason ([helpers/get-message.js](https://github.com/forwardemail/forwardemail.net/blob/master/helpers/get-message.js)). Headers also only show what happened before the final mailbox stored the message.

## Method 2: measure time to inbox with seed mailboxes

A seed mailbox is a mailbox you own at a provider your recipients use, such as Gmail, Outlook.com, Yahoo or iCloud. Sending regular test messages to seed mailboxes gives you a TTI series you can graph and alert on.

1. **Create a seed mailbox at each provider**: Open one account per provider you care about and turn on IMAP access. Most providers require an app password for IMAP. Use these accounts only for testing so the script can read and delete everything in them.
2. **Send from your real sending setup**: Send the test through the same server, domain, SPF, DKIM and DMARC setup your real mail uses. A test from a different server measures a different path.
3. **Give each test message a unique Message-ID**: Generate a random Message-ID for every test and record the time just before you send. The ID lets the script find this exact message among older tests.
4. **Poll the inbox over IMAP**: Keep an IMAP connection open, send a NOOP so the server reports new messages, and look for the Message-ID. Record the arrival time when it appears. Stop after a timeout, such as one minute, and count the message as late.
5. **Use one clock for both timestamps**: Take the send time and the arrival time from the machine running the script. Provider timestamps and Received headers come from other clocks and can be off by seconds.
6. **Repeat on a schedule and alert on outliers**: Run the test every few minutes, store the results, and alert when a delivery passes your threshold or never arrives. Delete old test messages so the inbox stays small.

## Example script (Node.js)

This short script follows the steps above for one seed mailbox. It uses the [Nodemailer](https://nodemailer.com/) and [ImapFlow](https://imapflow.com/) packages (`npm install nodemailer imapflow`) and reads credentials from environment variables. It is a starting point, not a production monitor.

```js
// tti-check.mjs: send one test email and time its arrival over IMAP
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';

const env = process.env;

const smtp = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
});

const imap = new ImapFlow({
  host: env.IMAP_HOST,
  port: 993,
  secure: true,
  auth: { user: env.IMAP_USER, pass: env.IMAP_PASS },
  logger: false
});

const id = `${randomUUID()}@${env.SMTP_USER.split('@')[1]}`;

await imap.connect();
await imap.mailboxOpen('INBOX');

const sentAt = Date.now();
await smtp.sendMail({
  from: env.SMTP_USER,
  to: env.IMAP_USER,
  subject: 'Time to inbox test',
  text: 'This is an automated time to inbox test.',
  messageId: `<${id}>`
});

let receivedAt = 0;
while (!receivedAt && Date.now() - sentAt < 60_000) {
  await imap.noop(); // ask the server to report new messages
  if (imap.mailbox.exists > 0) {
    for await (const msg of imap.fetch('1:*', { headers: ['message-id'] })) {
      if (msg.headers?.toString().includes(id)) receivedAt = Date.now();
    }
  }
  if (!receivedAt) await sleep(250);
}

await imap.logout();
console.log(receivedAt ? `TTI: ${(receivedAt - sentAt) / 1000}s` : 'Not received within 60s');
```

Run it from cron or a scheduler every few minutes and send the output to the system you already use for metrics. To compare providers, run one copy per seed mailbox.

For a complete, production example, read Forward Email's monitor, [jobs/tti.js](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js). It tests several providers in parallel, measures direct and forwarded delivery, keeps two IMAP connections open per provider, and emails its team when a delivery is slow. [This page explains how it works](https://timetoinbox.com/forward-email-time-to-inbox/).

## Tips for accurate results

- **Check the folder.** The example only watches the inbox. A message filed as spam never shows up there, so also watch the spam folder if you want to tell "slow" apart from "filtered".
- **Vary the content a little.** Forward Email's monitor generates random subject lines and body text for each test ([jobs/tti.js](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js)), so the messages do not look like exact duplicates.
- **Keep test volume low.** A test every few minutes per mailbox is enough to spot problems. Postmark runs its TTI checks every five minutes ([Postmark blog](https://postmarkapp.com/blog/why-we-removed-inbox-delivery-tests-from-our-status-page)).
- **Report the median and the slow tail.** One slow message can be a one-off retry. A rising median points to a lasting problem.

## Sources for this page

- [RFC 5321, section 4.4: trace information (Received headers)](https://www.rfc-editor.org/rfc/rfc5321#section-4.4)
- [Forward Email: jobs/tti.js](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js) and [helpers/get-message.js](https://github.com/forwardemail/forwardemail.net/blob/master/helpers/get-message.js)
- [Postmark: why we removed inbox delivery tests from our status page](https://postmarkapp.com/blog/why-we-removed-inbox-delivery-tests-from-our-status-page)
- [Google Admin Toolbox: Messageheader](https://toolbox.googleapps.com/apps/messageheader/)
