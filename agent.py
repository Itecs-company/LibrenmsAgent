import logging
import os
import socket
import time
from dataclasses import dataclass, asdict
from typing import Dict, Any

import psutil
import requests
from dotenv import load_dotenv
from pysnmp.hlapi import (
    CommunityData,
    ContextData,
    NotificationType,
    ObjectIdentity,
    ObjectType,
    SnmpEngine,
    UdpTransportTarget,
    sendNotification,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)


@dataclass
class AgentSettings:
    libre_url: str
    api_token: str
    snmp_target: str
    snmp_port: int
    snmp_community: str
    interval: int
    hostname: str

    @classmethod
    def from_env(cls) -> "AgentSettings":
        return cls(
            libre_url=os.getenv("LIBRENMS_URL", ""),
            api_token=os.getenv("LIBRENMS_API_TOKEN", ""),
            snmp_target=os.getenv("SNMP_TARGET", ""),
            snmp_port=int(os.getenv("SNMP_PORT", "162")),
            snmp_community=os.getenv("SNMP_COMMUNITY", "public"),
            interval=int(os.getenv("AGENT_INTERVAL", "60")),
            hostname=os.getenv("AGENT_HOSTNAME", socket.gethostname()),
        )


OID_BASE = "1.3.6.1.4.1.8072.9999"


def collect_metrics() -> Dict[str, Any]:
    cpu = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()

    metrics: Dict[str, Any] = {
        "cpu_percent": round(cpu, 2),
        "memory_percent": round(mem.percent, 2),
        "disk_percent": round(disk.percent, 2),
        "bytes_sent": net.bytes_sent,
        "bytes_recv": net.bytes_recv,
        "timestamp": int(time.time()),
    }
    return metrics


def send_via_api(settings: AgentSettings, metrics: Dict[str, Any]) -> bool:
    if not settings.libre_url or not settings.api_token:
        logging.warning("API credentials are not configured; skipping API push")
        return False

    url = settings.libre_url.rstrip("/") + "/api/v0/agent/metrics"
    payload = {"hostname": settings.hostname, **metrics}

    try:
        response = requests.post(
            url,
            headers={"X-Auth-Token": settings.api_token},
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        logging.info("Pushed metrics via API to %s (status %s)", url, response.status_code)
        return True
    except requests.RequestException as exc:
        logging.error("API push failed: %s", exc)
        return False


def send_via_snmp(settings: AgentSettings, metrics: Dict[str, Any]) -> bool:
    if not settings.snmp_target:
        logging.warning("SNMP target is not configured; skipping SNMP trap")
        return False

    error_indication = sendNotification(
        SnmpEngine(),
        CommunityData(settings.snmp_community, mpModel=1),
        UdpTransportTarget((settings.snmp_target, settings.snmp_port)),
        ContextData(),
        "trap",
        NotificationType(ObjectIdentity(OID_BASE))
        .addVarBinds(
            ObjectType(ObjectIdentity(f"{OID_BASE}.1.0"), settings.hostname),
            ObjectType(ObjectIdentity(f"{OID_BASE}.1.1"), metrics["cpu_percent"]),
            ObjectType(ObjectIdentity(f"{OID_BASE}.1.2"), metrics["memory_percent"]),
            ObjectType(ObjectIdentity(f"{OID_BASE}.1.3"), metrics["disk_percent"]),
            ObjectType(ObjectIdentity(f"{OID_BASE}.1.4"), metrics["bytes_sent"]),
            ObjectType(ObjectIdentity(f"{OID_BASE}.1.5"), metrics["bytes_recv"]),
            ObjectType(ObjectIdentity(f"{OID_BASE}.1.6"), metrics["timestamp"]),
        )
        .loadMibs("SNMPv2-MIB")
    )

    if error_indication:
        logging.error("SNMP trap failed: %s", error_indication)
        return False

    logging.info(
        "Sent SNMP trap to %s:%s with hostname %s", settings.snmp_target, settings.snmp_port, settings.hostname
    )
    return True


def main() -> None:
    settings = AgentSettings.from_env()
    logging.info("Starting LibreNMS edge agent with settings: %s", asdict(settings))

    while True:
        metrics = collect_metrics()
        sent_api = send_via_api(settings, metrics)
        sent_snmp = send_via_snmp(settings, metrics)

        if not (sent_api or sent_snmp):
            logging.warning("Metrics were not delivered via API or SNMP; check configuration")

        time.sleep(settings.interval)


if __name__ == "__main__":
    main()
