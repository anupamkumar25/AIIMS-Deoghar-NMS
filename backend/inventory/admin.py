from django.contrib import admin
from .models import Device, Location

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("name", "building", "floor", "room_or_rack")
    search_fields = ("name", "building", "floor")

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("name", "ip_address", "device_type", "vendor", "location", "status", "monitoring_enabled")
    list_filter = ("device_type", "status", "monitoring_enabled", "vendor", "location")
    search_fields = ("name", "ip_address", "vendor", "model", "mac_address")
    readonly_fields = ("last_checked_at", "created_at", "updated_at")
