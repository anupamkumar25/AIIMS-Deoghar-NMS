from django.db import models

class Location(models.Model):
    name = models.CharField(max_length=120, unique=True)
    building = models.CharField(max_length=120, blank=True)
    floor = models.CharField(max_length=60, blank=True)
    room_or_rack = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

class Device(models.Model):
    class DeviceType(models.TextChoices):
        CORE_SWITCH = "core_switch", "Core switch"
        DISTRIBUTION_SWITCH = "distribution_switch", "Distribution switch"
        ACCESS_SWITCH = "access_switch", "Access switch"
        ROUTER = "router", "Router"
        FIREWALL = "firewall", "Firewall"
        SERVER = "server", "Server"
        ACCESS_POINT = "access_point", "Access point"
        CCTV_NVR = "cctv_nvr", "CCTV / NVR"
        PRINTER = "printer", "Printer"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        UNKNOWN = "unknown", "Unknown"
        UP = "up", "Up"
        DOWN = "down", "Down"
        MAINTENANCE = "maintenance", "Maintenance"

    name = models.CharField(max_length=150)
    ip_address = models.GenericIPAddressField(protocol="IPv4", unique=True)
    device_type = models.CharField(max_length=30, choices=DeviceType.choices, default=DeviceType.OTHER)
    vendor = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    mac_address = models.CharField(max_length=17, blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="devices")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNKNOWN)
    monitoring_enabled = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    last_checked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["device_type"]),
            models.Index(fields=["location"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.ip_address})"
