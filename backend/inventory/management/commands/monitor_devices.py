"""Continuously check reachability of explicitly registered NMS devices.

This command does not discover or scan networks. It checks only devices already
registered in the inventory and with monitoring_enabled=True.
"""
import platform
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from django.core.management.base import BaseCommand, CommandError
from django.db import close_old_connections
from django.utils import timezone

from inventory.models import Device


def ping_host(ip_address: str, timeout_ms: int = 1200) -> bool:
    """Return True if one ICMP echo reply is received, using OS-native ping."""
    system = platform.system().lower()
    if system == "windows":
        command = ["ping", "-n", "1", "-w", str(timeout_ms), ip_address]
    elif system == "darwin":
        command = ["ping", "-c", "1", "-W", str(timeout_ms), ip_address]
    else:
        # Linux ping's -W is measured in seconds.
        command = ["ping", "-c", "1", "-W", str(max(1, round(timeout_ms / 1000))), ip_address]

    try:
        result = subprocess.run(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=(timeout_ms / 1000) + 1.5,
            check=False,
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return False


class Command(BaseCommand):
    help = "Check reachability of registered, monitoring-enabled devices."

    def add_arguments(self, parser):
        parser.add_argument("--interval", type=int, default=30, help="Seconds between polling rounds (default: 30).")
        parser.add_argument("--workers", type=int, default=40, help="Maximum parallel ping checks (default: 40).")
        parser.add_argument("--once", action="store_true", help="Run one polling round and exit.")
        parser.add_argument("--timeout-ms", type=int, default=1200, help="Ping timeout in milliseconds (default: 1200).")

    def handle(self, *args, **options):
        interval = options["interval"]
        workers = options["workers"]
        timeout_ms = options["timeout_ms"]
        if interval < 1 or workers < 1 or timeout_ms < 100:
            raise CommandError("interval and workers must be positive; timeout-ms must be at least 100.")

        self.stdout.write(self.style.SUCCESS("NMS reachability monitor started."))
        self.stdout.write("Checking registered devices only. Press Ctrl+C to stop.")
        try:
            while True:
                started = time.monotonic()
                devices = list(Device.objects.filter(monitoring_enabled=True).exclude(status=Device.Status.MAINTENANCE))
                if not devices:
                    self.stdout.write("No monitoring-enabled devices to check.")
                else:
                    results = {}
                    with ThreadPoolExecutor(max_workers=workers) as pool:
                        futures = {pool.submit(ping_host, device.ip_address, timeout_ms): device for device in devices}
                        for future in as_completed(futures):
                            device = futures[future]
                            try:
                                results[device.id] = Device.Status.UP if future.result() else Device.Status.DOWN
                            except Exception:
                                results[device.id] = Device.Status.DOWN

                    checked_at = timezone.now()
                    # Persist all results in one bulk operation to avoid concurrent SQLite writes.
                    for device in devices:
                        if device.id in results:
                            device.status = results[device.id]
                            device.last_checked_at = checked_at
                    Device.objects.bulk_update(devices, ["status", "last_checked_at"])
                    up_count = sum(status == Device.Status.UP for status in results.values())
                    down_count = len(results) - up_count
                    self.stdout.write(
                        f"{timezone.localtime(checked_at):%Y-%m-%d %H:%M:%S} | "
                        f"Checked {len(results)} | Online {up_count} | Offline {down_count}"
                    )

                if options["once"]:
                    break
                elapsed = time.monotonic() - started
                time.sleep(max(1, interval - elapsed))
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("NMS reachability monitor stopped."))
