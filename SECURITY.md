# Security Policy

This project may be used to monitor internal network infrastructure. Please do not publish sensitive device details, credentials, SNMP community strings, private keys, logs, or production configuration in issues or pull requests.

## Reporting a vulnerability

Report suspected security issues privately to the repository owner or the responsible institute IT/security contact. Do not open a public issue containing exploit details or sensitive network information.

## Deployment baseline

Before shared or production use, configure a strong secret key, disable Django debug mode, restrict allowed hosts and trusted origins, enable appropriate authentication and authorization, use HTTPS, protect monitoring credentials, restrict management access to approved networks, and establish backups and an incident-response process.
