---
title: 'Linux server hardening and SELinux operations'
summary: 'Hardened enterprise Linux servers running Posit Team: baselines, controlled patching, reduced exposure, and SELinux kept enforcing in production with denials diagnosed rather than switched off.'
sector: 'Enterprise Linux estate supporting data-science platforms'
role: 'Senior Linux Engineer'
status: completed
stack:
  - RHEL
  - Rocky Linux
  - SELinux
  - systemd
  - firewalld
  - Posit Team
tags: [linux, security, posit]
problem: 'Critical applications, including Posit Team, ran on enterprise Linux hosts where patching, service changes and SELinux policy had to coexist without either weakening the security posture or leaving services failing under enforcement.'
approach: 'Baseline every host, patch through controlled windows with post-patch validation, reduce exposure with firewalld and least privilege, and treat SELinux as part of the service lifecycle: permissive only as a short diagnostic window, fixes as labels, booleans or narrow local modules.'
outcome: 'Routine patching and service management with SELinux enforcement available for production. Posit Team services could be diagnosed, labeled and allowed through intentional policy changes rather than ad hoc security exceptions.'
metrics:
  - { value: 'enforcing', label: 'SELinux mode kept in production' }
  - { value: '3', label: 'operating modes handled deliberately' }
  - { value: '0', label: 'broad allow rules installed' }
coverAlt: ''
featured: true
order: 2
---

## Overview

This project focused on hardening and operating enterprise Linux servers that supported critical applications, including Posit Team workloads. The work combined patch management, service administration, access controls, system validation and SELinux operations across **enforcing**, **permissive** and **disabled** modes.

The goal was not simply to make services start. It was to make them run predictably while preserving a defensible security posture and a clear path for diagnosing policy denials.

## Problem

Enterprise Linux hosts that carry production applications accumulate two kinds of pressure. Patching and service changes must happen on schedule without surprising the applications, and SELinux denials must be resolved without the easy answer of turning enforcement off. Posit Team in particular stores data and certificates in paths that a default policy does not always expect.

## Approach

### Hardening and operations workflow

1. **Establish a baseline:** record OS versions, enabled services, listening ports, users, packages, mounts, firewall rules and the current SELinux status.
2. **Patch deliberately:** apply security updates through controlled maintenance windows, check dependencies, restart affected services, and validate after patching.
3. **Reduce exposure:** disable unnecessary services, restrict access with firewalld and least-privilege accounts, review file ownership and permissions, and verify systemd service behavior.
4. **Validate recovery:** check logs, health endpoints, service dependencies, disk space, certificates, and rollback or recovery steps after each change.

### SELinux operating modes

SELinux was managed as part of the service lifecycle rather than treated as an obstacle. The current mode is checked with:

```bash
getenforce
sestatus
```

**Permissive mode for diagnosis.** Permissive mode logs policy violations without blocking them. It is useful for a short, controlled troubleshooting window when a service fails under enforcement:

```bash
sudo setenforce 0
getenforce
```

After reproducing the issue, review the AVC events and return the host to enforcement:

```bash
sudo ausearch -m AVC -ts recent
sudo setenforce 1
getenforce
```

Permissive mode was treated as a temporary diagnostic state, not as the production fix.

**Disabled mode for controlled rebuilds.** Disabled mode prevents SELinux from loading and requires a reboot. It was reserved for controlled maintenance or rebuild scenarios where the operating requirement was understood and the security tradeoff approved:

```ini
# /etc/selinux/config
SELINUX=disabled
```

```bash
sudo reboot
getenforce
```

On supported systems the safer pattern is to keep SELinux enforcing and resolve the policy or labeling issue. Where disabled mode was used temporarily, the host was returned to enforcing after the underlying service or policy issue was addressed.

### Allowing Posit Team services under enforcement

For Posit Connect, Workbench and Package Manager, the denial logs identified the blocked operation; the fix was then the underlying file context, boolean, port label, or a narrowly scoped local policy.

Typical verification and investigation commands:

```bash
sudo ausearch -m AVC -ts recent
sudo journalctl -u rstudio-connect -u rstudio-server -u rstudio-pm
ls -Z /path/to/certificate-or-service-data
```

When files lived in a non-standard location, a persistent context was assigned and restored:

```bash
sudo semanage fcontext -a -t <expected_type> '/path/to/data(/.*)?'
sudo restorecon -Rv /path/to/data
```

Where a documented SELinux boolean was relevant, only the required boolean was enabled:

```bash
getsebool -a | grep <related_keyword>
sudo setsebool -P <boolean_name> on
```

For a denial with no existing policy rule, the generated suggestion was reviewed and a small, auditable local module created only when the access was expected and justified:

```bash
sudo ausearch -m AVC -ts recent | audit2allow -w
sudo ausearch -m AVC -ts recent | audit2allow -M posit-local
sudo semodule -i posit-local.pp
```

Generated rules were reviewed before installation. Broad `allow` rules and permanently disabling SELinux were avoided because they hide misconfiguration and weaken the host.

## Outcome

The resulting operating model supported routine patching and service management while keeping SELinux enforcement available for production. Posit Team services could be diagnosed, labeled and allowed to run through intentional policy changes rather than ad hoc security exceptions.

## Technical notes

- `ausearch -m AVC -ts recent` and `journalctl -u <service>` together answer most "why did it fail under enforcement" questions in minutes.
- `ls -Z` on the data path is the first check for Posit products installed outside default locations.
- Local modules created with `audit2allow -M` are versioned alongside the rest of the host configuration, so the reason for each rule survives the person who wrote it.
