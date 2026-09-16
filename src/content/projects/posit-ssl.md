---
title: 'Self-signed TLS for Posit Team on Rocky Linux'
summary: 'HTTPS across a co-located Posit Connect, Workbench and Package Manager deployment on Rocky Linux, using a self-signed certificate with a proper SAN, shared safely between three service users.'
sector: 'Internal data-science platform'
role: 'Platform Engineer'
status: completed
stack:
  - Rocky Linux
  - OpenSSL
  - Posit Connect
  - Posit Workbench
  - Posit Package Manager
  - SELinux
tags: [security, posit, linux]
problem: 'Three Posit services on one internal server were running over plain HTTP. No public certificate authority could issue a certificate: the host had no public domain and no internet-facing port 80 or 443.'
approach: 'A self-signed certificate with a Subject Alternative Name, one private key shared through a dedicated Linux group with correct directory permissions, each product configured for HTTPS, and the certificate trusted on macOS, Windows and Linux clients.'
outcome: 'All three products serve HTTPS on the internal hostname with no certificate warnings, verified with curl and in the browser, with SELinux still enforcing.'
metrics:
  - { value: '3', label: 'services moved to HTTPS' }
  - { value: '0', label: 'certificate warnings after client trust' }
  - { value: '1', label: 'private key, group-scoped' }
coverAlt: ''
featured: true
order: 1
---

## Overview

This project delivered HTTPS for a single-server, co-located deployment of **Posit Connect**, **Posit Workbench** and **Posit Package Manager** on Rocky Linux: an internal environment without a publicly trusted CA or an internet-facing port 80 or 443 for automated certificate issuance (for example Let's Encrypt).

The solution was a self-signed certificate with a proper **Subject Alternative Name (SAN)**, shared securely across all three services via a dedicated Linux group, with correct file permissions, SELinux compatibility, and client-side trust configuration across macOS, Windows and Linux.

## Problem

Modern browsers reject certificates that only carry a Common Name without a matching SAN, so a naive self-signed certificate would still produce warnings. Each Posit product runs as its own service user and needs to read the same private key, and changing ownership per product breaks the others. Package Manager also requires distinct HTTP and HTTPS ports, and SELinux must keep enforcing throughout.

## Approach

### Phase 1: name resolution

Clients must resolve `<VM_HOSTNAME>` to `<VM_IP>`, through DNS or a hosts entry on each client machine:

```
<VM_IP>   <VM_HOSTNAME>
```

On the server itself, confirm the hostname is set correctly:

```bash
sudo hostnamectl set-hostname <VM_HOSTNAME>
```

### Phase 2: a self-signed certificate with a SAN

An OpenSSL configuration file adds the SAN that browsers require:

```bash
cat <<EOF | sudo tee /etc/ssl/<VM_HOSTNAME>-openssl.cnf
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = <VM_HOSTNAME>

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = <VM_HOSTNAME>
EOF
```

```bash
sudo mkdir -p /etc/ssl/private /etc/ssl/certs

sudo openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout /etc/ssl/private/<VM_HOSTNAME>.key \
  -out /etc/ssl/certs/<VM_HOSTNAME>.crt \
  -config /etc/ssl/<VM_HOSTNAME>-openssl.cnf \
  -extensions v3_req
```

### Phase 3: one key, shared through a dedicated group

Rather than changing ownership per product, a shared group gives every service user read access without breaking the others. Confirm the actual service user and group for each product first (`systemctl show <service-name> -p User -p Group`).

```bash
sudo groupadd -f posit-ssl
sudo usermod -aG posit-ssl rstudio-connect
sudo usermod -aG posit-ssl rstudio-pm
sudo usermod -aG posit-ssl rstudio-server
```

Permissions on both the key **and its parent directory** matter. A common pitfall is fixing the file but leaving the directory non-traversable for the group:

```bash
sudo chown root:posit-ssl /etc/ssl/private/<VM_HOSTNAME>.key
sudo chmod 640 /etc/ssl/private/<VM_HOSTNAME>.key
sudo chmod 750 /etc/ssl/private
sudo chgrp posit-ssl /etc/ssl/private
sudo chmod 644 /etc/ssl/certs/<VM_HOSTNAME>.crt
```

Group membership changes take effect when the affected service restarts.

### Phase 4: Posit Connect

`/etc/rstudio-connect/rstudio-connect.gcfg`:

```ini
[Server]
Address = https://<VM_HOSTNAME>:<CONNECT_PORT>

[HTTPS]
Listen = :<CONNECT_PORT>
Certificate = /etc/ssl/certs/<VM_HOSTNAME>.crt
Key = /etc/ssl/private/<VM_HOSTNAME>.key
Permanent = t
```

```bash
sudo systemctl restart rstudio-connect
```

### Phase 5: Posit Workbench

`/etc/rstudio/rserver.conf`:

```ini
www-port=<WORKBENCH_PORT>
ssl-enabled=1
ssl-certificate=/etc/ssl/certs/<VM_HOSTNAME>.crt
ssl-certificate-key=/etc/ssl/private/<VM_HOSTNAME>.key
ssl-protocols=TLSv1.2 TLSv1.3
```

```bash
sudo rstudio-server restart
```

If the OS flags the certificate as untrusted at the system level:

```bash
sudo cp /etc/ssl/certs/<VM_HOSTNAME>.crt /etc/pki/ca-trust/source/anchors/
sudo update-ca-trust extract
sudo rstudio-server restart
```

### Phase 6: Posit Package Manager

`/etc/rstudio-pm/rstudio-pm.gcfg`. Package Manager requires **distinct** HTTP and HTTPS ports; reusing the same port causes a fatal startup error:

```ini
[Server]
Address = https://<VM_HOSTNAME>:<PACKAGE_MANAGER_PORT>

[HTTP]
Listen = :<PACKAGE_MANAGER_HTTP_PORT>

[HTTPS]
Listen = :<PACKAGE_MANAGER_PORT>
Certificate = /etc/ssl/certs/<VM_HOSTNAME>.crt
Key = /etc/ssl/private/<VM_HOSTNAME>.key
```

```bash
sudo rspm check-config
sudo systemctl restart rstudio-pm
```

### Phase 7: trust on client machines

```bash
scp <user>@<VM_HOSTNAME>:/etc/ssl/certs/<VM_HOSTNAME>.crt ~/Desktop/
```

- **macOS:** Keychain Access, System keychain, drag in the certificate, set to Always Trust.
- **Windows:** double-click the `.crt`, Install Certificate, Local Machine, Trusted Root Certification Authorities.
- **Linux:**
  ```bash
  sudo cp <VM_HOSTNAME>.crt /etc/pki/ca-trust/source/anchors/
  sudo update-ca-trust extract
  ```

Fully quit and reopen the browser after trusting the certificate; trust decisions are often cached per session.

## Outcome

```bash
curl -vk https://<VM_HOSTNAME>:<CONNECT_PORT>
curl -vk https://<VM_HOSTNAME>:<WORKBENCH_PORT>
curl -vk https://<VM_HOSTNAME>:<PACKAGE_MANAGER_PORT>
```

Browsing to each URL by **hostname** (not IP, since the SAN only covers the hostname) confirmed a secure connection with no browser warnings across all three services.

## Technical notes

### Troubleshooting reference

| Symptom                                                       | Likely cause                                                               | Fix                                                                                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Can't open ".../key" for writing, No such file or directory` | Target directory does not exist                                            | `sudo mkdir -p /etc/ssl/private /etc/ssl/certs`                                                                                  |
| `HTTP.Listen and HTTPS.Listen using same value`               | Both sections configured on the same port                                  | Assign HTTP a separate port                                                                                                      |
| `open ".../key": permission denied`                           | Service user lacks read access, or the parent directory is not traversable | Verify group membership (`id <service-user>`); confirm `640 root:posit-ssl` on the key and `750 root:posit-ssl` on the directory |
| `Self-signed certificate is not in the system CA store`       | OS-level trust store missing the certificate                               | `sudo cp <cert> /etc/pki/ca-trust/source/anchors/ && sudo update-ca-trust extract`                                               |
| Browser still shows "Not Secure"                              | Certificate not trusted on the client, browsing by IP, or a stale session  | Re-check trust settings, use the hostname, restart the browser                                                                   |
| SELinux denials (`ausearch -m avc`)                           | Policy blocking non-standard certificate paths                             | Relabel with `semanage fcontext` and `restorecon`; confirm the mode with `getenforce`                                            |

### Scaling this approach

For environments with many client machines, a lightweight **internal CA** removes the need to trust a certificate per client: only the CA's root certificate needs distributing once. If the server later gains a public domain and open ports 80 and 443, this setup can be swapped for **Let's Encrypt** with minimal changes: only the certificate and key source changes, the Posit configuration blocks stay the same.
