// Public-safe professional content, derived from resume.
// Deliberately excludes: personal email, phone, home address.
// Only city/state-level location and professional links are shown.

export const profile = {
  name: "Jimmy",
  title: "Technical Consultant",
  location: "Virginia, USA",
  tagline:
    "High-level infrastructure support for cloud, Linux, Posit, and enterprise systems.",
  summary:
    "Technical consultant and platform engineer with hands-on experience supporting mission-critical applications across cloud and on-premises environments. I bring practical expertise in enterprise Linux, cloud architecture, automation, security, incident response, and production support, translating operational complexity into clear plans and stable outcomes.",
  social: {
    linkedin: "https://www.linkedin.com/in/jimmy-lubega-393652184/",
    github: "https://github.com/j-lubega",
  },
};

export const certifications = [
  "Certified Kubernetes Administrator (CKA)",
  "CompTIA Security+ Certified",
  "AWS Certified Solutions Architect – Professional",
  "AWS Certified SysOps Administrator – Associate",
  "Linux Essentials Professional Certificate (LPIC-1)",
];

export const skillGroups = [
  {
    category: "Operating Systems & Linux Administration",
    skills: [
      "RHEL",
      "Rocky Linux",
      "Ubuntu",
      "Amazon Linux",
      "Windows",
      "macOS",
      "Patch Management",
      "System Hardening",
      "User Access Management",
    ],
  },
  {
    category: "Infrastructure & Automation",
    skills: [
      "Bash",
      "Python",
      "Ansible",
      "Terraform",
      "Infrastructure as Code",
      "GitHub Actions",
    ],
  },
  {
    category: "Cloud & Virtualization",
    skills: [
      "AWS (EC2, IAM, Route 53, S3)",
      "Microsoft Azure",
      "Google Cloud Platform",
      "VMware",
      "Proxmox",
    ],
  },
  {
    category: "Monitoring & Operational Support",
    skills: [
      "Prometheus",
      "Grafana",
      "CloudWatch",
      "ServiceNow",
      "Zendesk",
      "Jira",
    ],
  },
  {
    category: "Networking & Security",
    skills: [
      "TCP/IP",
      "DNS",
      "Load Balancing",
      "Firewalls",
      "VPC Concepts",
      "Vulnerability Remediation",
    ],
  },
  {
    category: "Containers & Platforms",
    skills: [
      "Docker",
      "Kubernetes",
      "ECS",
      "EKS",
      "AKS",
      "GKE",
      "Posit Workbench",
      "Posit Connect",
      "Posit Package Manager",
    ],
  },
];

export type ExperienceEntry = {
  role: string;
  company: string;
  dates: string;
  location: string;
  bullets: string[];
};

export const experience: ExperienceEntry[] = [
  {
    role: "Consultant / Platform Engineer",
    company: "Katalyze Data (formerly Amadeus Software) — via purenest360 llc",
    dates: "July 2026 – Present",
    location: "Remote, UK",
    bullets: [
      "Write solution design documents, deploy, and support secure, scalable Posit Team (Workbench, Connect & Package Manager) environments across Microsoft Azure and AWS.",
      "Develop solution architectures, security models, technical documentation, and user manuals.",
      "Provision and configure cloud infrastructure and deploy Posit applications to meet customer requirements.",
      "Provide direct technical guidance, Linux and cloud platform support, troubleshooting, and training throughout the deployment and platform lifecycle.",
    ],
  },
  {
    role: "Consultant / Platform Engineer",
    company: "purenest360 llc — Freelance",
    dates: "January 2026 – Present",
    location: "Virginia, US",
    bullets: [
      "Design, provision, and support secure, scalable cloud and Linux platforms across Microsoft Azure and AWS using Terraform, managing VMs, storage, VPCs/VNets, DNS, IAM, and security controls.",
      "Work directly with clients to gather requirements, deliver and troubleshoot infrastructure and applications.",
      "Provide Linux and cloud training, create technical documentation, and deliver secure, reliable platform solutions aligned with business needs.",
    ],
  },
  {
    role: "Technical Support Engineer",
    company: "Posit PBC",
    dates: "July 2022 – January 2026",
    location: "Remote, Boston, MA, US",
    bullets: [
      "Served as a senior Linux engineer supporting production infrastructure by leading troubleshooting efforts, performing root cause analysis, mentoring junior engineers, and driving automation initiatives.",
      "Provisioned and deployed RHEL servers using standardized build procedures and Infrastructure as Code (Terraform), ensuring consistent, secure, repeatable deployments.",
      "Developed and maintained Ansible playbooks and roles to automate Linux configuration, software deployment, system hardening, and configuration drift remediation.",
      "Managed enterprise Linux patching and software lifecycle activities, coordinating maintenance windows, kernel updates, vulnerability remediation, and post-patch validation.",
      "Administered and supported Linux-based application environments across AWS, Azure, and GCP.",
      "Provisioned and managed cloud infrastructure resources including virtual machines and storage buckets.",
      "Implemented GitHub Actions CI/CD workflows to automate diagnostics, validation, deployment, and operational tasks.",
      "Performed troubleshooting, system analysis, and incident resolution for enterprise customer environments.",
      "Collaborated with engineering and security teams to improve platform stability, observability, and operational efficiency.",
      "Supported Posit applications including Workbench, Connect, and Package Manager.",
    ],
  },
  {
    role: "Software Systems Engineer",
    company: "Dominion Energy",
    dates: "October 2019 – July 2022",
    location: "Virginia, US",
    bullets: [
      "Administered enterprise Linux systems (RHEL, Rocky Linux, Ubuntu) supporting critical business operations.",
      "Led Linux server patch management activities including system updates, vulnerability remediation, and maintenance scheduling across enterprise environments.",
      "Performed Linux system administration tasks including user account management, permissions, and configuration.",
      "Automated server configuration, patching, and maintenance processes using Ansible playbooks and shell scripting.",
      "Monitored Linux server health, performance, and operational stability while troubleshooting infrastructure and application issues.",
      "Participated in incident response, live troubleshooting sessions, root cause analysis, and on-call rotations.",
      "Collaborated with network, security, database, and application teams to resolve infrastructure incidents.",
      "Leveraged Python alongside Bash, Ansible, and Linux utilities to automate workflows and generate operational reports.",
    ],
  },
  {
    role: "Manager / Systems Administrator",
    company: "National Vision Inc",
    dates: "July 2015 – October 2019",
    location: "Virginia, US",
    bullets: [
      "Managed store inventory, mentored team members, and promoted operational best practices.",
      "Collaborated with internal teams to resolve technical incidents and improve operational efficiency.",
    ],
  },
];

export const education = {
  degree: "Bachelor of Science in Computer Science",
  institution: "Makerere University",
};
