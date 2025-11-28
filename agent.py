import logging
import os
import socket
import threading
import time
from dataclasses import dataclass, asdict
from typing import Dict, Any, Tuple

import psutil
import requests
from dotenv import load_dotenv
from pysnmp.carrier.asyncore.dgram import udp
from pysnmp.entity import config, engine
from pysnmp.entity.rfc3413 import cmdrsp
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
from pysnmp.smi import builder, instrum, rfc1902

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
    snmp_trap_port: int
    snmp_listen_port: int
    snmp_community: str
    interval: int
    hostname: str

    @classmethod
    def from_env(cls) -> "AgentSettings":
        return cls(
            libre_url=os.getenv("LIBRENMS_URL", ""),
            api_token=os.getenv("LIBRENMS_API_TOKEN", ""),
            snmp_target=os.getenv("SNMP_TARGET", ""),
            snmp_trap_port=int(os.getenv("SNMP_TRAP_PORT", "162")),
            snmp_listen_port=int(os.getenv("SNMP_LISTEN_PORT", "161")),
            snmp_community=os.getenv("SNMP_COMMUNITY", "public"),
            interval=int(os.getenv("AGENT_INTERVAL", "60")),
            hostname=os.getenv("AGENT_HOSTNAME", socket.gethostname()),
        )


OID_BASE = "1.3.6.1.4.1.8072.9999"
OID_BASE_TUPLE: Tuple[int, ...] = tuple(int(part) for part in OID_BASE.split("."))


def init_snmp_mib(snmp_engine: engine.SnmpEngine) -> Tuple[instrum.MibInstrumController, Dict[str, rfc1902.MibScalarInstance]]:
    mib_builder = snmp_engine.getMibBuilder()
    mib_controller = instrum.MibInstrumController(mib_builder)

    metric_templates: Dict[str, rfc1902.AbstractSimpleAsn1Item] = {
        "hostname": rfc1902.OctetString(""),
        "cpu_percent": rfc1902.Integer32(0),
        "memory_percent": rfc1902.Integer32(0),
        "disk_percent": rfc1902.Integer32(0),
        "bytes_sent": rfc1902.Counter64(0),
        "bytes_recv": rfc1902.Counter64(0),
        "timestamp": rfc1902.TimeTicks(0),
    }

    instances: Dict[str, rfc1902.MibScalarInstance] = {}
    symbols = []

    for index, (name, template) in enumerate(metric_templates.items(), start=1):
        scalar = rfc1902.MibScalar(OID_BASE_TUPLE + (1, index), template.clone(0)).setMaxAccess("readonly")
        instance = rfc1902.MibScalarInstance(scalar.name, (0,), template.clone(template))
        instances[name] = instance
        symbols.extend([scalar, instance])

    mib_builder.exportSymbols("LIBRENMS-AGENT-MIB", *symbols)
    return mib_controller, instances


def update_snmp_instances(instances: Dict[str, rfc1902.MibScalarInstance], hostname: str, metrics: Dict[str, Any]) -> None:
    mapped_values = {
        "hostname": rfc1902.OctetString(hostname),
        "cpu_percent": rfc1902.Integer32(int(metrics.get("cpu_percent", 0))),
        "memory_percent": rfc1902.Integer32(int(metrics.get("memory_percent", 0))),
        "disk_percent": rfc1902.Integer32(int(metrics.get("disk_percent", 0))),
        "bytes_sent": rfc1902.Counter64(int(metrics.get("bytes_sent", 0))),
        "bytes_recv": rfc1902.Counter64(int(metrics.get("bytes_recv", 0))),
        "timestamp": rfc1902.TimeTicks(int(metrics.get("timestamp", 0))),
    }

    for key, value in mapped_values.items():
        if key in instances:
            instances[key].setValue(value)


def start_snmp_responder(settings: AgentSettings) -> Tuple[Dict[str, rfc1902.MibScalarInstance], threading.Thread]:
    snmp_engine = engine.SnmpEngine()
    config.addSocketTransport(
        snmp_engine,
        udp.domainName,
        udp.UdpTransport().openServerMode(("0.0.0.0", settings.snmp_listen_port)),
    )
    config.addV1System(snmp_engine, "librenms-agent", settings.snmp_community)
    config.addVacmUser(
        snmp_engine,
        2,
        "librenms-agent",
        "noAuthNoPriv",
        readSubTree=(OID_BASE_TUPLE,),
    )

    mib_controller, instances = init_snmp_mib(snmp_engine)

    def _run_responder() -> None:
        try:
            cmdrsp.GetCommandResponder(snmp_engine, mib_controller)
            cmdrsp.NextCommandResponder(snmp_engine, mib_controller)
            cmdrsp.BulkCommandResponder(snmp_engine, mib_controller)
            snmp_engine.transportDispatcher.jobStarted(1)
            logging.info(
                "SNMP responder listening on 0.0.0.0:%s with community %s",
                settings.snmp_listen_port,
                settings.snmp_community,
            )
            snmp_engine.transportDispatcher.runDispatcher()
        except Exception as exc:  # pragma: no cover - defensive logging
            logging.error("SNMP responder stopped: %s", exc)
            raise

    responder_thread = threading.Thread(
        target=_run_responder, name="snmp-responder", daemon=True
    )
    responder_thread.start()
    return instances, responder_thread


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
        UdpTransportTarget((settings.snmp_target, settings.snmp_trap_port)),
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
        "Sent SNMP trap to %s:%s with hostname %s",
        settings.snmp_target,
        settings.snmp_trap_port,
        settings.hostname,
    )
    return True


def main() -> None:
    settings = AgentSettings.from_env()
    logging.info("Starting LibreNMS edge agent with settings: %s", asdict(settings))

    snmp_instances, _ = start_snmp_responder(settings)
    snmp_lock = threading.Lock()

    while True:
        metrics = collect_metrics()

        with snmp_lock:
            update_snmp_instances(snmp_instances, settings.hostname, metrics)

        sent_api = send_via_api(settings, metrics)
        sent_snmp = send_via_snmp(settings, metrics)

        if not (sent_api or sent_snmp):
            logging.warning("Metrics were not delivered via API or SNMP; check configuration")

        time.sleep(settings.interval)


if __name__ == "__main__":
    main()
