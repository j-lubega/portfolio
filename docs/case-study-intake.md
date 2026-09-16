# Case-study intake

One form per project, about 20 minutes each. The site needs the answers to fill the frontmatter (`problem`, `approach`, `outcome`, `metrics`, `client` or `sector`, `period`) and to turn the technical write-ups into case studies a buyer can read in two minutes.

The three existing write-ups (TLS for Posit Team, Linux hardening and SELinux, enterprise builds) are already on the site with draft summaries written from their text. Please correct those first, then add any new projects.

## The form

```
Title (working):
Client or sector (say "confidential, <sector>" if needed):
Your role and who else was involved:
Timeframe (month/year to month/year):
The situation: what existed before, what was failing or missing (3 to 5 sentences):
What you did, in order (5 to 8 bullets, name the tools):
Stack (list):
Outcome: what changed, with a number if at all possible (uptime, hours saved, servers migrated, time to provision):
One thing that went wrong or surprised you, and what you changed because of it:
Anything you cannot say publicly (names, IPs, screenshots):
Can we show a diagram of the architecture? (yes / redacted / no)
```

## What happens with the answers

- Title, situation, what you did and outcome become the `summary`, `problem`, `approach` and `outcome` fields (each 40 to 320 characters, so they fit the card and the "At a glance" panel).
- Numbers become `metrics` (one to four of them; the first one shows on the project card).
- Client or sector, role and timeframe fill the metadata row under the title.
- The full detail goes into the Markdown body under Overview, Problem, Approach, Outcome and Technical notes.
- A cover photograph is chosen per project in Phase 10; if you have a real diagram, it can replace the photo.

## Questions on the three existing projects

1. **TLS for Posit Team**: which organization or sector, and roughly when?
2. **Linux hardening and SELinux**: was this at Posit PBC (2022 to 2026) or Dominion Energy (2019 to 2022)? Any number worth stating (hosts, patch cycles, denials resolved)?
3. **Enterprise builds**: was this Dominion Energy? Over what period? Is "400+ physical servers and 2,000+ VMs" the whole estate or your own builds?
