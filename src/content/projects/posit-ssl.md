# Configuring Self-Signed SSL/TLS for Posit Connect, Workbench, and Package Manager on Rocky Linux

This guide documents how to configure HTTPS for a co-located Posit Connect, Posit Workbench, and Posit Package Manager installation on a single Rocky Linux server, using a self-signed certificate with a proper Subject Alternative Name (SAN). It's intended for internal/local deployments where a publicly trusted CA (e.g., Let's Encrypt) isn't reachable — for example, a VM without a public domain or internet-facing port 80/443.

## Prerequisites

- SSH and `sudo` access to the Linux server
- Posit Connect, Workbench, and Package Manager already installed and running over HTTP
- A resolvable hostname for the server (DNS entry or `/etc/hosts` entry on client machines)

## Placeholders used in this guide

| Placeholder                   | Description                                       | Example        |
| ----------------------------- | ------------------------------------------------- | -------------- |
| `<VM_HOSTNAME>`               | The hostname clients will use to reach the server | `posit-server` |
| `<VM_IP>`                     | The server's IP address                           | `192.168.1.50` |
| `<CONNECT_PORT>`              | Port for Posit Connect                            | `3939`         |
| `<WORKBENCH_PORT>`            | Port for Posit Workbench                          | `8787`         |
| `<PACKAGE_MANAGER_PORT>`      | HTTPS port for Package Manager                    | `4242`         |
| `<PACKAGE_MANAGER_HTTP_PORT>` | Fallback HTTP port for Package Manager            | `4243`         |

Replace these throughout with your actual values.

---

## Phase 1 — Ensure Name Resolution

Clients must be able to resolve `<VM_HOSTNAME>` to `<VM_IP>`.

On each client machine (e.g., add to `/etc/hosts` on macOS/Linux, or `C:\Windows\System32\drivers\etc\hosts` on Windows):

```
<VM_IP>   <VM_HOSTNAME>
```

On the server itself, confirm the hostname is set correctly:

```bash
sudo hostnamectl set-hostname <VM_HOSTNAME>
```

---

## Phase 2 — Generate a Self-Signed Certificate with SAN

Modern browsers reject certificates that only specify a Common Name (CN) without a matching Subject Alternative Name (SAN). Create an OpenSSL config file to include one.

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

Ensure the certificate directories exist:

```bash
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/ssl/certs
```

Generate the certificate and key:

```bash
sudo openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout /etc/ssl/private/<VM_HOSTNAME>.key \
  -out /etc/ssl/certs/<VM_HOSTNAME>.crt \
  -config /etc/ssl/<VM_HOSTNAME>-openssl.cnf \
  -extensions v3_req
```

---

## Phase 3 — Share the Certificate Across Services via a Dedicated Group

Each Posit product runs as its own service user and needs read access to the same private key. Rather than changing file ownership per product (which breaks the others), create a shared group.

```bash
sudo groupadd -f posit-ssl
sudo usermod -aG posit-ssl rstudio-connect
sudo usermod -aG posit-ssl rstudio-pm
sudo usermod -aG posit-ssl rstudio-server
```

> Confirm the actual service user/group for each product before assuming the names above — check with:
>
> ```bash
> systemctl show <service-name> -p User -p Group
> ```

Set ownership and permissions on both the key **and its parent directory** — a common pitfall is fixing the file but leaving the directory non-traversable for the group:

```bash
sudo chown root:posit-ssl /etc/ssl/private/<VM_HOSTNAME>.key
sudo chmod 640 /etc/ssl/private/<VM_HOSTNAME>.key
sudo chmod 750 /etc/ssl/private
sudo chgrp posit-ssl /etc/ssl/private
```

Certificate file (public, less sensitive) permissions:

```bash
sudo chmod 644 /etc/ssl/certs/<VM_HOSTNAME>.crt
```

Group membership changes require an affected service to restart before they take effect — this is handled in the phases below.

---

## Phase 4 — Configure Posit Connect

Edit `/etc/rstudio-connect/rstudio-connect.gcfg`:

```ini
[Server]
Address = https://<VM_HOSTNAME>:<CONNECT_PORT>

[HTTPS]
Listen = :<CONNECT_PORT>
Certificate = /etc/ssl/certs/<VM_HOSTNAME>.crt
Key = /etc/ssl/private/<VM_HOSTNAME>.key
Permanent = t
```

Restart:

```bash
sudo systemctl restart rstudio-connect
```

---

## Phase 5 — Configure Posit Workbench

Edit `/etc/rstudio/rserver.conf`:

```ini
www-port=<WORKBENCH_PORT>
ssl-enabled=1
ssl-certificate=/etc/ssl/certs/<VM_HOSTNAME>.crt
ssl-certificate-key=/etc/ssl/private/<VM_HOSTNAME>.key
ssl-protocols=TLSv1.2 TLSv1.3
```

Restart:

```bash
sudo rstudio-server restart
```

If you see a warning like `Self-signed certificate is not in the system CA store`, add the certificate to the OS trust store to clear it:

```bash
sudo cp /etc/ssl/certs/<VM_HOSTNAME>.crt /etc/pki/ca-trust/source/anchors/
sudo update-ca-trust extract
sudo rstudio-server restart
```

---

## Phase 6 — Configure Posit Package Manager

Edit `/etc/rstudio-pm/rstudio-pm.gcfg`. Package Manager requires distinct HTTP and HTTPS ports — reusing the same port for both will cause a fatal startup error (`HTTP.Listen and HTTPS.Listen using same value`):

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

Validate the configuration before restarting:

```bash
sudo rspm check-config
```

Restart:

```bash
sudo systemctl restart rstudio-pm
```

---

## Phase 7 — Trust the Certificate on Client Machines

Copy the certificate to your local machine:

```bash
scp <user>@<VM_HOSTNAME>:/etc/ssl/certs/<VM_HOSTNAME>.crt ~/Desktop/
```

**On macOS:**

1. Open **Keychain Access**
2. Select the **System** keychain
3. Drag in `<VM_HOSTNAME>.crt`
4. Double-click the imported cert → **Trust** → set to **Always Trust**

**On Windows:**

1. Double-click the `.crt` file → **Install Certificate**
2. Choose **Local Machine** → **Place all certificates in the following store** → **Trusted Root Certification Authorities**

**On Linux clients:**

```bash
sudo cp <VM_HOSTNAME>.crt /etc/pki/ca-trust/source/anchors/
sudo update-ca-trust extract
```

Fully quit and reopen your browser after trusting the certificate — trust decisions are often cached per session.

---

## Phase 8 — Verify

```bash
curl -vk https://<VM_HOSTNAME>:<CONNECT_PORT>
curl -vk https://<VM_HOSTNAME>:<WORKBENCH_PORT>
curl -vk https://<VM_HOSTNAME>:<PACKAGE_MANAGER_PORT>
```

Then browse to each URL using the **hostname** (not the IP address — the certificate's SAN only covers the hostname). Confirm the browser shows a secure connection with no warnings.

---

## Troubleshooting Reference

| Symptom                                                                | Likely Cause                                                                                         | Fix                                                                                                                                               |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Can't open ".../key" for writing, No such file or directory`          | Target directory doesn't exist                                                                       | `sudo mkdir -p /etc/ssl/private /etc/ssl/certs`                                                                                                   |
| `HTTP.Listen and HTTPS.Listen using same value`                        | Both sections configured on the same port                                                            | Assign HTTP a separate port in the config                                                                                                         |
| `open ".../key": permission denied`                                    | Service user lacks read access to the key, or its parent directory isn't traversable by the group    | Verify group membership (`id <service-user>`), confirm file is `640 root:posit-ssl`, and confirm the containing directory is `750 root:posit-ssl` |
| `Self-signed certificate is not in the system CA store` (warning only) | OS-level trust store doesn't include the cert                                                        | `sudo cp <cert> /etc/pki/ca-trust/source/anchors/ && sudo update-ca-trust extract`                                                                |
| Browser still shows "Not Secure"                                       | Cert not yet trusted on the **client**, browsing by IP instead of hostname, or stale browser session | Re-check Keychain/cert store trust settings, use the hostname, restart the browser                                                                |
| SELinux denials in `ausearch -m avc`                                   | SELinux policy blocking access to non-standard cert paths                                            | Relabel with `semanage fcontext` + `restorecon`, or confirm SELinux mode with `getenforce`                                                        |

---

## Notes on Scaling This Approach

- This setup uses a single self-signed certificate trusted manually per client machine. For environments with multiple client machines or users, consider standing up a lightweight **internal CA**: sign your server certificate with it, then distribute and trust only the CA's root certificate once per client — new server certificates issued under that CA won't require repeated manual trust steps.
- If your server later gains a public domain and internet-reachable port 80/443, this setup can be swapped for a **Let's Encrypt** certificate (via Certbot) with minimal changes — only the certificate and key file source changes; the Posit configuration blocks stay the same.
