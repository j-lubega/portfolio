---
layout: ../../layouts/ProjectLayout.astro
title: 'Self-Signed SSL/TLS for Posit Team on Rocky Linux'
description: 'Designed and implemented HTTPS across a co-located Posit Connect, Workbench, and Package Manager deployment using a self-signed certificate with proper SAN support — completed and verified working.'
stack:
  ['Rocky Linux', 'OpenSSL', 'Posit Connect', 'Posit Workbench', 'Posit Package Manager', 'SELinux']
heroImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=2400&q=90'
---

## Overview

This project delivered HTTPS for a single-server, co-located deployment of **Posit Connect**, **Posit Workbench**, and **Posit Package Manager** on Rocky Linux — an internal environment without a publicly trusted CA or internet-facing port 80/443 available for automated certificate issuance (e.g., Let's Encrypt).

The solution: a self-signed certificate with a proper **Subject Alternative Name (SAN)**, shared securely across all three services via a dedicated Linux group, with correct file permissions, SELinux compatibility, and client-side trust configuration across macOS, Windows, and Linux.

**Outcome:** All three Posit products were successfully configured to serve HTTPS, verified via `curl` and browser checks showing a secure connection with no certificate warnings on client machines.

---

## Prerequisites

- SSH and `sudo` access to the Linux server
- Posit Connect, Workbench, and Package Manager already installed and running over HTTP
- A resolvable hostname for the server (DNS entry or `/etc/hosts` entry on client machines)

## Phase 1 — Ensure Name Resolution

Clients must be able to resolve `<VM_HOSTNAME>` to `<VM_IP>`.

```
<VM_IP>   <VM_HOSTNAME>
```

Confirm the hostname is set correctly on the server:

```bash
sudo hostnamectl set-hostname <VM_HOSTNAME>
```

## Phase 2 — Generate a Self-Signed Certificate with SAN

Modern browsers reject certificates that only specify a Common Name (CN) without a matching SAN. An OpenSSL config file addresses this:

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

## Phase 3 — Share the Certificate Across Services via a Dedicated Group

Each Posit product runs as its own service user and needs read access to the same private key. Rather than changing ownership per product, a shared group avoids breaking the others:

```bash
sudo groupadd -f posit-ssl
sudo usermod -aG posit-ssl rstudio-connect
sudo usermod -aG posit-ssl rstudio-pm
sudo usermod -aG posit-ssl rstudio-server
```

Permissions on both the key **and its parent directory** matter — a common pitfall is fixing the file but leaving the directory non-traversable for the group:

```bash
sudo chown root:posit-ssl /etc/ssl/private/<VM_HOSTNAME>.key
sudo chmod 640 /etc/ssl/private/<VM_HOSTNAME>.key
sudo chmod 750 /etc/ssl/private
sudo chgrp posit-ssl /etc/ssl/private
sudo chmod 644 /etc/ssl/certs/<VM_HOSTNAME>.crt
```

Group membership changes require an affected service restart to take effect.

## Phase 4 — Configure Posit Connect

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

## Phase 5 — Configure Posit Workbench

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

## Phase 6 — Configure Posit Package Manager

`/etc/rstudio-pm/rstudio-pm.gcfg`. Package Manager requires **distinct** HTTP and HTTPS ports — reusing the same port causes a fatal startup error:

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

## Phase 7 — Trust the Certificate on Client Machines

```bash
scp <user>@<VM_HOSTNAME>:/etc/ssl/certs/<VM_HOSTNAME>.crt ~/Desktop/
```

- **macOS:** Keychain Access → System keychain → drag in cert → set to Always Trust
- **Windows:** Double-click `.crt` → Install Certificate → Local Machine → Trusted Root Certification Authorities
- **Linux:**
  ```bash
  sudo cp <VM_HOSTNAME>.crt /etc/pki/ca-trust/source/anchors/
  sudo update-ca-trust extract
  ```

Fully quit and reopen the browser after trusting the certificate.

## Phase 8 — Verification

```bash
curl -vk https://<VM_HOSTNAME>:<CONNECT_PORT>
curl -vk https://<VM_HOSTNAME>:<WORKBENCH_PORT>
curl -vk https://<VM_HOSTNAME>:<PACKAGE_MANAGER_PORT>
```

Browsing to each URL by **hostname** (not IP — the SAN only covers the hostname) confirmed a secure connection with no browser warnings across all three services.

---

## Troubleshooting Reference

| Symptom                                                       | Likely Cause                                                          | Fix                                                                                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Can't open ".../key" for writing, No such file or directory` | Target directory doesn't exist                                        | `sudo mkdir -p /etc/ssl/private /etc/ssl/certs`                                                                                  |
| `HTTP.Listen and HTTPS.Listen using same value`               | Both sections configured on the same port                             | Assign HTTP a separate port                                                                                                      |
| `open ".../key": permission denied`                           | Service user lacks read access, or parent directory isn't traversable | Verify group membership (`id <service-user>`); confirm `640 root:posit-ssl` on the key and `750 root:posit-ssl` on the directory |
| `Self-signed certificate is not in the system CA store`       | OS-level trust store missing the cert                                 | `sudo cp <cert> /etc/pki/ca-trust/source/anchors/ && sudo update-ca-trust extract`                                               |
| Browser still shows "Not Secure"                              | Cert not trusted on the client, browsing by IP, or stale session      | Re-check trust settings, use hostname, restart browser                                                                           |
| SELinux denials (`ausearch -m avc`)                           | Policy blocking non-standard cert paths                               | Relabel with `semanage fcontext` + `restorecon`, confirm mode with `getenforce`                                                  |

## Scaling Notes

For environments with many client machines, standing up a lightweight **internal CA** removes the need to manually trust a certificate per client — only the CA's root certificate needs distributing once. If the server later gains a public domain and open port 80/443, this setup can be swapped for **Let's Encrypt** with minimal changes — only the certificate/key source changes; the Posit configuration blocks stay the same.
