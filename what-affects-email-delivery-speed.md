# What Affects Email Delivery Speed

> Most delayed email is not lost. A server along the way returned a temporary error, and the message waited in a queue until the sender tried again. This page covers the common causes and what you can change.

Source: https://timetoinbox.com/what-affects-email-delivery-speed/

## Quick answer

Email is usually delayed by a temporary rejection (a 4xx SMTP reply) followed by a wait in the sender's retry queue. Greylisting, rate limits, failed DNS lookups during SPF checks, and a poor or unknown sender reputation all cause temporary rejections. How long the message then waits depends on the sending server's retry schedule.

*Causes of slow email delivery at a glance*

| Cause | What happens | What you can do |
| --- | --- | --- |
| [Greylisting](https://timetoinbox.com/what-affects-email-delivery-speed/#greylisting) | First message from an unknown sender gets a 4xx reply and must be retried | Send from stable IP addresses and keep retry intervals short |
| [Retry queues](https://timetoinbox.com/what-affects-email-delivery-speed/#retry-queues) | Deferred mail waits minutes to hours before the next attempt | Check your server's backoff settings and queue size |
| [SPF, DKIM, DMARC](https://timetoinbox.com/what-affects-email-delivery-speed/#authentication) | Missing or failing authentication leads to deferral, spam filing or rejection | Publish SPF, sign with DKIM, publish DMARC |
| [Reputation and rate limits](https://timetoinbox.com/what-affects-email-delivery-speed/#reputation) | Receivers slow down unknown or high-volume senders | Warm up new IPs and domains, keep complaint rates low |
| [Your own sending volume](https://timetoinbox.com/what-affects-email-delivery-speed/#volume) | Large batches queue behind each other on your side | Send time-sensitive mail on its own stream |
| [Content scanning and size](https://timetoinbox.com/what-affects-email-delivery-speed/#content) | Large messages take longer to transfer and scan | Link to large files instead of attaching them |
| [Forwarding hops](https://timetoinbox.com/what-affects-email-delivery-speed/#forwarding) | Each forward is a new delivery that can be deferred again | Deliver straight to the final mailbox where possible |
| [Mail app fetch schedule](https://timetoinbox.com/what-affects-email-delivery-speed/#mail-apps) | The message is in the mailbox, but the app has not checked yet | Use push or IMAP IDLE |

## 1. Greylisting

Greylisting is an anti-spam technique where a receiving server temporarily rejects mail from a sender it does not know yet. RFC 6647 describes it as "rejecting mail from unfamiliar sources with a 'transient (soft) fail' (4xx) [SMTP] error code" ([RFC 6647](https://www.rfc-editor.org/rfc/rfc6647)). A real mail server retries and gets through. Many spam tools do not retry.

The delay you see is the time until the sender's next attempt. RFC 6647 notes that "some popular MTAs do not retry failed delivery attempts for an hour or more," and that senders with several outbound servers can be greylisted again when a retry comes from a different IP address.

Forward Email documents its own policy: the first message from a new sender (keyed by root domain or IP address) is rejected with a 450 code until 5 minutes have passed since the first attempt, the record is kept for 30 days, and senders on its allowlist skip greylisting ([Forward Email FAQ: Do you have a greylist](https://forwardemail.net/faq#do-you-have-a-greylist)).

**What you can do:** send from a small, stable set of IP addresses, set reverse DNS (PTR) for each one, and make sure your server retries within minutes rather than hours.

## 2. Retry queues after temporary failures

Any 4xx reply puts the message back in the sender's queue. RFC 5321 says "the retry interval SHOULD be at least 30 minutes" and that the give-up time "generally needs to be at least 4-5 days" ([RFC 5321, section 4.5.4.1](https://www.rfc-editor.org/rfc/rfc5321#section-4.5.4.1)).

Real servers are often faster. Postfix, for example, defaults to waiting at least 300 seconds and at most 4000 seconds between attempts for a deferred message, scans its deferred queue every 300 seconds, and returns a message as undeliverable after 5 days ([Postfix postconf(5)](https://www.postfix.org/postconf.5.html#minimal_backoff_time)).

So a single temporary failure on a default Postfix server adds at least about 5 minutes, and repeated failures stretch toward an hour between attempts.

**What you can do:** watch your deferred queue, read the 4xx replies in your logs to find the cause, and fix that cause rather than only shortening retry times.

## 3. SPF, DKIM and DMARC

Receiving servers check whether a message is authorized by the sender's domain. SPF lists the servers allowed to send for a domain, DKIM adds a signature that proves the domain sent the message, and DMARC tells receivers what to do when those checks fail.

Gmail requires every sender to set up SPF or DKIM, to have valid forward and reverse DNS for sending IPs, and to use TLS. Senders of more than 5,000 messages a day to Gmail also need SPF, DKIM and DMARC. Google says the guidelines help "prevent Gmail from limiting sending rates, blocking messages, or marking messages as spam" ([Google email sender guidelines](https://support.google.com/a/answer/81126)).

DNS problems during these checks can also delay mail. If an SPF check hits a temporary DNS error, RFC 7208 says the receiver can accept the message or temporarily reject it, and a rejection "SHOULD use an SMTP reply code of 451" ([RFC 7208, section 8.6](https://www.rfc-editor.org/rfc/rfc7208#section-8.6)). The message then waits for a retry.

**What you can do:** publish an SPF record that lists every service that sends for your domain, sign all mail with DKIM, publish a DMARC record, and use reliable DNS hosting. Forward Email has setup guides for [SPF](https://forwardemail.net/faq#how-do-i-set-up-spf-for-forward-email), [DKIM](https://forwardemail.net/faq#how-do-i-set-up-dkim-for-forward-email) and [DMARC](https://forwardemail.net/faq#how-do-i-set-up-dmarc-for-forward-email).

## 4. Sender reputation and rate limits

Mailbox providers limit how much mail they accept from each sender, and the limits are lower for senders they do not know or do not trust. Extra mail gets a temporary rejection and waits in the sender's queue.

Forward Email publishes its inbound limits as an example: senders that are not on its allowlist can deliver up to 1000 messages per day per sender and recipient domain into its mailboxes, with a burst limit of 50 messages per sender and domain per minute, while large providers such as gmail.com and allowlisted senders have higher limits ([Forward Email FAQ: Do you have rate limiting](https://forwardemail.net/faq#do-you-have-rate-limiting)).

**What you can do:** raise volume on new IP addresses and domains gradually, keep spam complaints low (Gmail asks senders to stay below 0.3%), and remove addresses that bounce.

## 5. Your own sending volume

Delays also start on your side. A newsletter to many recipients can fill your outbound queue, and a password reset sent at the same moment waits behind it. Sending services also slow down accounts that send unusual volumes. Forward Email, for example, slows outbound sending with a 421 reply when too many of an account's recent messages are still waiting in the queue ([Forward Email FAQ: outbound SMTP limits](https://forwardemail.net/faq#what-are-your-outbound-smtp-limits)).

**What you can do:** send transactional mail (sign-ins, resets, receipts) through a separate stream or server from bulk mail, so a large send cannot hold it up.

## 6. Content scanning and message size

Receiving servers scan messages for spam and malware before they file them. Bigger messages take longer to upload and to scan, and a message that looks suspicious can be held for more checks or filed as spam. Spam filing does not change the delivery time, but to the recipient it looks the same as a message that never came.

**What you can do:** keep transactional emails small and plain, and link to large files instead of attaching them.

## 7. Forwarding hops

When an address forwards to another mailbox, the forwarding server receives the message and then sends it again to the final provider. That second delivery can be greylisted, rate limited or deferred on its own. Forwarding can also break SPF, because the forwarding server is not listed in the original sender's SPF record. Forward Email re-seals forwarded messages with ARC, and rewrites the From header only when the sender's DMARC check did not pass and no DKIM signature aligns with the From header ([Forward Email FAQ: How do you handle email delivery issues](https://forwardemail.net/faq#how-do-you-handle-email-delivery-issues)).

Forward Email measures direct and forwarded delivery separately on its [live TTI page](https://forwardemail.net/tti), so you can see the cost of the extra hop for each provider.

## 8. Mail apps that check on a timer

Sometimes the message is already in the mailbox and the app has not shown it yet. Apps that use push notifications or the IMAP IDLE command ([RFC 2177](https://www.rfc-editor.org/rfc/rfc2177)) show new mail right away. Apps that fetch on a schedule, for example every 15 minutes, show it on the next fetch. Check webmail to tell this case apart from a real delivery delay.

## Sources for this page

- [RFC 5321: Simple Mail Transfer Protocol, section 4.5.4.1](https://www.rfc-editor.org/rfc/rfc5321#section-4.5.4.1)
- [RFC 6647: Email Greylisting](https://www.rfc-editor.org/rfc/rfc6647)
- [RFC 7208: Sender Policy Framework, section 8.6](https://www.rfc-editor.org/rfc/rfc7208#section-8.6)
- [Postfix configuration parameters](https://www.postfix.org/postconf.5.html#minimal_backoff_time)
- [Google: Email sender guidelines](https://support.google.com/a/answer/81126)
- [Forward Email FAQ](https://forwardemail.net/faq)
