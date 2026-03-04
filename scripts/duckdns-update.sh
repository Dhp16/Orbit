#!/bin/bash
# DuckDNS IP Update Script
# Keeps your DuckDNS subdomain pointed at your current public IP.
# Run as a cron job every 5 minutes.

DUCKDNS_TOKEN="YOUR_DUCKDNS_TOKEN"
DUCKDNS_DOMAIN="orbit-crm"

echo url="https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=" | curl -k -o /var/log/duckdns.log -K -
