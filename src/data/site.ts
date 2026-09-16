// Public-safe site identity and resume-derived content.
// Deliberately excludes: personal email, phone, home address.
// Only city/state-level location and professional links are shown.
// Everything a page needs to know about who this site belongs to lives here.

export type CalendlyOption = {
  id: 'discovery' | 'working';
  url: string;
  title: string;
  minutes: number;
  /** USD. 0 means free. */
  price: number;
  summary: string;
};

export const site = {
  name: 'Jimmy Lubega',
  shortName: 'Jimmy',
  role: 'Technical Consultant and Platform Engineer',
  company: 'purenest360 llc',
  domain: 'jlpro-po.com',
  url: 'https://jlpro-po.com',
  /** Rendered in the header. Mono, lowercase, no cursor. */
  wordmark: 'jimmy',
  description:
    'Technical Consultant and Platform Engineer specializing in Cloud Infrastructure, Linux, Automation, and Kubernetes. Secure, scalable platforms across AWS and Azure.',
  /** Requested sections, in nav order. Routes are created in Phase 3. */
  nav: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/education', label: 'Education' },
    { href: '/projects', label: 'Projects' },
    { href: '/connect', label: 'Connect' },
  ],
  social: {
    linkedin: 'https://www.linkedin.com/in/jimmy-lubega-393652184/',
    github: 'https://github.com/j-lubega',
  },
  /**
   * Calendly event types, verified live on 2026-09-13.
   * Prices below are the client brief. As of that date Calendly itself had them
   * inverted (30min charging $100, 1-hour free); the client must correct Calendly
   * before Phase 4 ships (website-improvement.md, Section 5, item 1).
   */
  calendly: {
    discovery: {
      id: 'discovery',
      url: 'https://calendly.com/jimmylubegapro/30min',
      title: 'Discovery consultation',
      minutes: 30,
      price: 0,
      summary: 'Tell me about your platform and get a straight opinion on the next step.',
    },
    working: {
      id: 'working',
      url: 'https://calendly.com/jimmylubegapro/1-hour',
      title: 'Working session',
      minutes: 60,
      price: 100,
      summary: 'Architecture review, troubleshooting, or an implementation plan, live.',
    },
  } satisfies Record<string, CalendlyOption>,
  /** Theme system: localStorage key for the manual choice. */
  themeStorageKey: 'jl-theme',
} as const;

/** Stable @id values for the JSON-LD graph, so pages can reference site-level nodes. */
export const jsonLdIds = {
  website: `${site.url}/#website`,
  person: `${site.url}/#person`,
  organization: `${site.url}/#organization`,
  service: `${site.url}/#service`,
} as const;

export const profile = {
  name: 'Jimmy',
  title: 'Technical Consultant',
  location: 'Virginia, USA',
  tagline: 'High-level infrastructure support for cloud, Linux, Posit, and enterprise systems.',
  summary:
    'Technical consultant and platform engineer with hands-on experience supporting mission-critical applications across cloud and on-premises environments. I bring practical expertise in enterprise Linux, cloud architecture, automation, security, incident response, and production support, translating operational complexity into clear plans and stable outcomes.',
  social: site.social,
};

export const skillGroups = [
  {
    category: 'Operating Systems & Linux Administration',
    skills: [
      'RHEL',
      'Rocky Linux',
      'Ubuntu',
      'Amazon Linux',
      'Windows',
      'macOS',
      'Patch Management',
      'System Hardening',
      'User Access Management',
    ],
  },
  {
    category: 'Infrastructure & Automation',
    skills: ['Bash', 'Python', 'Ansible', 'Terraform', 'Infrastructure as Code', 'GitHub Actions'],
  },
  {
    category: 'Cloud & Virtualization',
    skills: [
      'AWS (EC2, IAM, Route 53, S3)',
      'Microsoft Azure',
      'Google Cloud Platform',
      'VMware',
      'Proxmox',
    ],
  },
  {
    category: 'Monitoring & Operational Support',
    skills: ['Prometheus', 'Grafana', 'CloudWatch', 'ServiceNow', 'Zendesk', 'Jira'],
  },
  {
    category: 'Networking & Security',
    skills: [
      'TCP/IP',
      'DNS',
      'Load Balancing',
      'Firewalls',
      'VPC Concepts',
      'Vulnerability Remediation',
    ],
  },
  {
    category: 'Containers & Platforms',
    skills: [
      'Docker',
      'Kubernetes',
      'ECS',
      'EKS',
      'AKS',
      'GKE',
      'Posit Workbench',
      'Posit Connect',
      'Posit Package Manager',
    ],
  },
];

export type ExperienceEntry = {
  role: string;
  company: string;
  /** Engagement context, e.g. "Freelance" or "via purenest360 llc". */
  note?: string;
  dates: string;
  location: string;
  bullets: string[];
};

export const experience: ExperienceEntry[] = [
  {
    role: 'Consultant / Platform Engineer',
    company: 'Katalyze Data (formerly Amadeus Software)',
    note: 'via purenest360 llc',
    dates: 'July 2026 – Present',
    location: 'Remote, UK',
    bullets: [
      'Write solution design documents, deploy, and support secure, scalable Posit Team (Workbench, Connect & Package Manager) environments across Microsoft Azure and AWS.',
      'Develop solution architectures, security models, technical documentation, and user manuals.',
      'Provision and configure cloud infrastructure and deploy Posit applications to meet customer requirements.',
      'Provide direct technical guidance, Linux and cloud platform support, troubleshooting, and training throughout the deployment and platform lifecycle.',
    ],
  },
  {
    role: 'Consultant / Platform Engineer',
    company: 'purenest360 llc',
    note: 'Freelance',
    dates: 'January 2026 – Present',
    location: 'Virginia, US',
    bullets: [
      'Design, provision, and support secure, scalable cloud and Linux platforms across Microsoft Azure and AWS using Terraform, managing VMs, storage, VPCs/VNets, DNS, IAM, and security controls.',
      'Work directly with clients to gather requirements, deliver and troubleshoot infrastructure and applications.',
      'Provide Linux and cloud training, create technical documentation, and deliver secure, reliable platform solutions aligned with business needs.',
    ],
  },
  {
    role: 'Technical Support Engineer',
    company: 'Posit PBC',
    dates: 'July 2022 – January 2026',
    location: 'Remote, Boston, MA, US',
    bullets: [
      'Served as a senior Linux engineer supporting production infrastructure by leading troubleshooting efforts, performing root cause analysis, mentoring junior engineers, and driving automation initiatives.',
      'Provisioned and deployed RHEL servers using standardized build procedures and Infrastructure as Code (Terraform), ensuring consistent, secure, repeatable deployments.',
      'Developed and maintained Ansible playbooks and roles to automate Linux configuration, software deployment, system hardening, and configuration drift remediation.',
      'Managed enterprise Linux patching and software lifecycle activities, coordinating maintenance windows, kernel updates, vulnerability remediation, and post-patch validation.',
      'Administered and supported Linux-based application environments across AWS, Azure, and GCP.',
      'Provisioned and managed cloud infrastructure resources including virtual machines and storage buckets.',
      'Implemented GitHub Actions CI/CD workflows to automate diagnostics, validation, deployment, and operational tasks.',
      'Performed troubleshooting, system analysis, and incident resolution for enterprise customer environments.',
      'Collaborated with engineering and security teams to improve platform stability, observability, and operational efficiency.',
      'Supported Posit applications including Workbench, Connect, and Package Manager.',
    ],
  },
  {
    role: 'Software Systems Engineer',
    company: 'Dominion Energy',
    dates: 'October 2019 – July 2022',
    location: 'Virginia, US',
    bullets: [
      'Administered enterprise Linux systems (RHEL, Rocky Linux, Ubuntu) supporting critical business operations.',
      'Led Linux server patch management activities including system updates, vulnerability remediation, and maintenance scheduling across enterprise environments.',
      'Performed Linux system administration tasks including user account management, permissions, and configuration.',
      'Automated server configuration, patching, and maintenance processes using Ansible playbooks and shell scripting.',
      'Monitored Linux server health, performance, and operational stability while troubleshooting infrastructure and application issues.',
      'Participated in incident response, live troubleshooting sessions, root cause analysis, and on-call rotations.',
      'Collaborated with network, security, database, and application teams to resolve infrastructure incidents.',
      'Leveraged Python alongside Bash, Ansible, and Linux utilities to automate workflows and generate operational reports.',
    ],
  },
  {
    role: 'Manager / Systems Administrator',
    company: 'National Vision Inc',
    dates: 'July 2015 – October 2019',
    location: 'Virginia, US',
    bullets: [
      'Managed store inventory, mentored team members, and promoted operational best practices.',
      'Collaborated with internal teams to resolve technical incidents and improve operational efficiency.',
    ],
  },
];

/** Proof strip on Home. Values from the enterprise builds case study; confirm with the client (Open question 9). */
export const stats = [
  { value: '10+', label: 'years in infrastructure' },
  { value: '5', label: 'certifications' },
  { value: '400+', label: 'physical servers built' },
  { value: '2,000+', label: 'virtual machines' },
] as const;

export type Capability = {
  index: string;
  title: string;
  summary: string;
  bullets: string[];
  /** Tag label plus optional astro-icon name. */
  stack: { label: string; icon?: string }[];
  icon: string;
};

/** "What I do" on Home. Seeded from skillGroups, framed the way the brief frames the role. */
export const capabilities: Capability[] = [
  {
    index: '01',
    title: 'Cloud infrastructure',
    summary:
      'Design, provision and support platforms on AWS and Azure with Infrastructure as Code, so environments are repeatable and auditable.',
    bullets: [
      'VPCs and VNets, DNS, IAM, storage and compute laid out from a written design',
      'Terraform for provisioning, GitHub Actions for validation and deployment',
      'Security models and documentation that survive the handover',
    ],
    stack: [
      { label: 'AWS', icon: 'simple-icons:amazonwebservices' },
      { label: 'Azure', icon: 'lucide:cloud' },
      { label: 'Terraform', icon: 'simple-icons:terraform' },
      { label: 'GCP', icon: 'simple-icons:googlecloud' },
      { label: 'GitHub Actions', icon: 'simple-icons:githubactions' },
    ],
    icon: 'lucide:cloud',
  },
  {
    index: '02',
    title: 'Linux and automation',
    summary:
      'Enterprise Linux run as a managed fleet: standard builds, patch windows, hardening and configuration kept in code.',
    bullets: [
      'RHEL, Rocky and Ubuntu builds from standard images and hardened baselines',
      'Ansible roles and shell automation for configuration, patching and drift remediation',
      'SELinux kept enforcing, with denials diagnosed rather than switched off',
    ],
    stack: [
      { label: 'RHEL', icon: 'simple-icons:redhat' },
      { label: 'Rocky Linux', icon: 'simple-icons:rockylinux' },
      { label: 'Ubuntu', icon: 'simple-icons:ubuntu' },
      { label: 'Ansible', icon: 'simple-icons:ansible' },
      { label: 'Bash', icon: 'simple-icons:gnubash' },
      { label: 'Python', icon: 'simple-icons:python' },
    ],
    icon: 'lucide:terminal',
  },
  {
    index: '03',
    title: 'Kubernetes and platforms',
    summary:
      'Container platforms and data-science tooling deployed, secured and kept observable, on managed Kubernetes or on VMs.',
    bullets: [
      'EKS, AKS and GKE clusters with Docker-based workloads and clear ownership',
      'Posit Team (Workbench, Connect, Package Manager) on cloud and on premises',
      'Prometheus, Grafana and CloudWatch so problems are seen before users report them',
    ],
    stack: [
      { label: 'Kubernetes', icon: 'simple-icons:kubernetes' },
      { label: 'Docker', icon: 'simple-icons:docker' },
      { label: 'Posit Team', icon: 'simple-icons:posit' },
      { label: 'Prometheus', icon: 'simple-icons:prometheus' },
      { label: 'Grafana', icon: 'simple-icons:grafana' },
    ],
    icon: 'lucide:server',
  },
];

/** About page: how Jimmy works. Copy drafted in docs/copy/about.md for approval. */
export const principles = [
  {
    title: 'Design before deploy',
    body: 'Every environment starts as a written design: network zones, identity, naming, backup and patching, agreed before the first resource exists.',
    icon: 'lucide:git-branch',
  },
  {
    title: 'Automate the second time',
    body: 'Anything done twice becomes code. Terraform and Ansible are how a platform stays the same on Friday as it was on Monday.',
    icon: 'lucide:terminal',
  },
  {
    title: 'Document the handover',
    body: 'A platform is finished when the team running it has the runbook, the diagram and the person to call. That is part of the work, not an extra.',
    icon: 'lucide:shield-check',
  },
] as const;
