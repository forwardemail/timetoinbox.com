# How Forward Email Measures Time to Inbox

> Forward Email publishes live delivery times to mailboxes at major email providers, and the code that measures them is public on GitHub. This page explains what that code does, step by step.

Source: https://timetoinbox.com/forward-email-time-to-inbox/

## How the monitor works in short

Forward Email's monitor sends two test emails to a mailbox at each tested provider, one directly and one through a forwarding address, and records how many milliseconds pass until each message shows up over IMAP. The latest results and a 24-hour chart are on the [Forward Email time to inbox page](https://forwardemail.net/tti).

Forward Email describes it on that page as "our own open-source monitor" that "sends test emails to inboxes at major email providers and records how long each one takes to arrive," and adds that its engineers "get an alert when a delivery takes longer than 10 seconds."

The numbers change every few minutes, so this site does not copy them. Open the live page for current values.

## Which providers are tested

The monitor's configuration ([config/index.js](https://github.com/forwardemail/forwardemail.net/blob/master/config/index.js)) defines test mailboxes for Forward Email, Gmail, Outlook/Hotmail, Apple iCloud, Fastmail and Yahoo/AOL. A provider is only tested when credentials for its test mailbox are set, and code comments say Outlook and Fastmail were taken out of rotation. The live page lists Forward Email, Gmail, Apple iCloud and Yahoo/AOL.

## How a test run works

The steps below follow [jobs/tti.js](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js) and [helpers/get-message.js](https://github.com/forwardemail/forwardemail.net/blob/master/helpers/get-message.js).

1. **Decide whether to run.** Every minute the job looks at the latest saved result. If that result is less than 5 minutes old and every provider was under 10 seconds, it waits. Otherwise it takes a lock in Redis so only one server runs the test, and starts a new run.
2. **Build two messages per provider.** One goes straight to the provider's test mailbox ("Direct"). The other goes to a forwarding address that delivers into the same mailbox ("Forward"). Each message gets a random Message-ID and random subject and body text.
3. **Record the start time and sign.** The job takes the current time, uses it as the Date header, and signs the message with DKIM.
4. **Deliver.** The message is sent on port 25 straight to the mail server for the recipient's domain, using the same delivery helper that Forward Email's MX servers use to forward mail. If that fails, the job falls back to Forward Email's own SMTP service.
5. **Poll the inbox.** Two IMAP connections per provider stay open, so the direct and forwarded messages can be watched at the same time. The poller sends a NOOP to get fresh mailbox state, reads the Message-ID header of every message in the inbox, and repeats without a pause until it finds the test message or one minute passes.
6. **Record the arrival time.** When the message is found, the job takes the current time on its own clock. The code comments explain that provider timestamps, Received headers and the envelope date are not used, because of clock differences between servers.
7. **Save and clean up.** The job stores the direct and forwarding times for each provider (a message not found within one minute is stored as 0), then deletes all messages in each test inbox. Saved results expire after 30 days.
8. **Alert.** If any provider took 10 seconds or longer, or a message never arrived, the job emails Forward Email's alerts address with every provider's numbers, at most once every 30 minutes.

## Where the results are shown

- The [time to inbox page](https://forwardemail.net/tti) shows the latest direct and forwarding time for each provider and a chart of the past 24 hours.
- The Forward Email home page and pricing page show a summary. That summary uses the most recent result from the past 24 hours in which every provider was under 10 seconds ([helpers/get-latest-tti.js](https://github.com/forwardemail/forwardemail.net/blob/master/helpers/get-latest-tti.js)).

Because the home page summary skips runs with a slow provider, the dedicated TTI page is the place to see every recent result.

## How to read the numbers

- **Direct** is the time from Forward Email's server to the provider's inbox. It reflects how fast that provider accepts and files mail from Forward Email.
- **Forwarding** includes the extra trip through a forwarding address. Compare it with Direct to see what a forward costs for each provider.
- Times include the full SMTP transaction and the provider's own processing, because the clock runs until the message is visible over IMAP.
- The numbers describe mail sent by Forward Email's servers. Mail from your own server can be faster or slower, depending on the [factors that affect delivery speed](https://timetoinbox.com/what-affects-email-delivery-speed/).

## Other published TTI data

Postmark publishes time to inbox for its own sending on its [TTI page](https://tti.postmarkapp.com/). In its blog, Postmark says the checks run every five minutes against major mailbox providers ([Postmark blog](https://postmarkapp.com/blog/why-we-removed-inbox-delivery-tests-from-our-status-page)). Postmark and Forward Email measure their own sending with different setups, so their numbers are not a direct comparison.

## Run a similar monitor yourself

The same method works for any sender. See [how to measure time to inbox](https://timetoinbox.com/how-to-measure-time-to-inbox/) for a short Node.js example that sends a test message and polls IMAP until it arrives.

## Sources for this page

- [Forward Email: Time to Inbox (live results)](https://forwardemail.net/tti)
- [forwardemail.net: jobs/tti.js](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js)
- [forwardemail.net: helpers/get-message.js](https://github.com/forwardemail/forwardemail.net/blob/master/helpers/get-message.js)
- [forwardemail.net: helpers/get-latest-tti.js](https://github.com/forwardemail/forwardemail.net/blob/master/helpers/get-latest-tti.js)
- [forwardemail.net: config/index.js](https://github.com/forwardemail/forwardemail.net/blob/master/config/index.js)
- [Postmark: why we removed inbox delivery tests from our status page](https://postmarkapp.com/blog/why-we-removed-inbox-delivery-tests-from-our-status-page)

## Try the service behind the numbers

Forward Email is open-source email hosting and forwarding. You can start with free forwarding by adding MX and TXT records to your domain, or self-host it with Docker.

[Get started with Forward Email](https://forwardemail.net)

[Self-host Forward Email](https://forwardemail.net/self-hosted)
