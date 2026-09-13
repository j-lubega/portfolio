---
layout: ../../layouts/ProjectLayout.astro
title: 'Linux Server Hardening & SELinux Operations'
description: 'Hardened enterprise Linux servers, managed patching and services, and supported Posit Team workloads across enforcing, permissive, and disabled SELinux modes.'
status: 'Completed & Operational'
stack: ['RHEL', 'Rocky Linux', 'SELinux', 'Systemd', 'Patching', 'Posit Team']
heroImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=2400&q=90'
---

## Overview

This project focused on hardening and operating enterprise Linux servers that supported critical applications, including Posit Team workloads. The work combined patch management, service administration, access controls, system validation, and SELinux operations across **enforcing**, **permissive**, and **disabled** modes.

The goal was not simply to make services start. It was to make them run predictably while preserving a defensible security posture and a clear path for diagnosing policy denials.

## Hardening and operations workflow

1. **Establish a baseline:** recorded OS versions, enabled services, listening ports, users, packages, mounts, firewall rules, and current SELinux status.
2. **Patch deliberately:** applied security updates through controlled maintenance windows, checked dependencies, restarted affected services, and performed post-patch validation.
3. **Reduce exposure:** disabled unnecessary services, restricted access with firewalld and least-privilege accounts, reviewed file ownership and permissions, and verified systemd service behavior.
4. **Validate recovery:** checked logs, health endpoints, service dependencies, disk space, certificates, and rollback or recovery steps after each change.

## SELinux operating modes

SELinux was managed as part of the service lifecycle rather than treated as an obstacle. The current mode was checked with:

```bash
getenforce
sestatus
```

### Permissive mode for diagnosis

Permissive mode logs policy violations without blocking them. It is useful for a short, controlled troubleshooting window when a service fails under enforcement:

```bash
sudo setenforce 0
getenforce
```

After reproducing the issue, I reviewed AVC events and returned the host to enforcement:

```bash
sudo ausearch -m AVC -ts recent
sudo setenforce 1
getenforce
```

Permissive mode was treated as temporary diagnostic state, not as the production fix.

### Disabled mode for controlled rebuilds

Disabled mode prevents SELinux from loading and requires a reboot. It was reserved for controlled maintenance or rebuild scenarios where the operating requirement was understood and the security tradeoff was approved:

```ini
# /etc/selinux/config
SELINUX=disabled
```

```bash
sudo reboot
getenforce
```

On supported systems, a safer operating pattern is to keep SELinux enforcing and resolve the policy or labeling issue. If disabled mode was used temporarily, the host was returned to enforcing after the underlying service or policy issue was addressed.

## Allowing Posit Team services under enforcement

For Posit Connect, Workbench, and Package Manager, I used the denial logs to identify the blocked operation, then fixed the underlying file context, boolean, port label, or narrowly scoped local policy.

Typical verification and investigation commands included:

```bash
sudo ausearch -m AVC -ts recent
sudo journalctl -u rstudio-connect -u rstudio-server -u rstudio-pm
ls -Z /path/to/certificate-or-service-data
```

When files were stored in a non-standard location, I assigned an appropriate persistent context and restored it:

```bash
sudo semanage fcontext -a -t <expected_type> '/path/to/data(/.*)?'
sudo restorecon -Rv /path/to/data
```

Where a documented SELinux boolean was relevant, I reviewed and enabled only the required boolean:

```bash
getsebool -a | grep <related_keyword>
sudo setsebool -P <boolean_name> on
```

For a denial with no existing policy rule, I reviewed the generated suggestion carefully and created a small, auditable local module only when the access was expected and justified:

```bash
sudo ausearch -m AVC -ts recent | audit2allow -w
sudo ausearch -m AVC -ts recent | audit2allow -M posit-local
sudo semodule -i posit-local.pp
```

Generated rules were reviewed before installation. Broad `allow` rules and permanently disabling SELinux were avoided because they can hide misconfiguration and weaken the host.

## Outcome

The resulting operating model supported routine patching and service management while keeping SELinux enforcement available for production. Posit Team services could be diagnosed, labeled, and allowed to run through intentional policy changes rather than ad hoc security exceptions.
