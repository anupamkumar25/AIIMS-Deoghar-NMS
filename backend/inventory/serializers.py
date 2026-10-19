from rest_framework import serializers
from .models import Device, Location

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = "__all__"

class DeviceSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source="location.name", read_only=True)

    class Meta:
        model = Device
        fields = [
            "id", "name", "ip_address", "device_type", "vendor", "model",
            "mac_address", "location", "location_name", "status",
            "monitoring_enabled", "notes", "last_checked_at", "created_at", "updated_at",
        ]
        read_only_fields = ["status", "last_checked_at", "created_at", "updated_at"]
