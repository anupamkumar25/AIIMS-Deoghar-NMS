from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Device, Location
from .serializers import DeviceSerializer, LocationSerializer

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.select_related("location").all()
    serializer_class = DeviceSerializer
    search_fields = ["name", "ip_address", "vendor", "model", "mac_address"]
    filterset_fields = ["status", "device_type", "location", "monitoring_enabled"]
    ordering_fields = ["name", "ip_address", "status", "last_checked_at", "created_at"]

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    search_fields = ["name", "building", "floor"]

@api_view(["GET"])
@permission_classes([AllowAny])
def dashboard_summary(request):
    counts = {row["status"]: row["total"] for row in Device.objects.values("status").annotate(total=Count("id"))}
    return Response({
        "total_devices": Device.objects.count(),
        "enabled_devices": Device.objects.filter(monitoring_enabled=True).count(),
        "up": counts.get("up", 0),
        "down": counts.get("down", 0),
        "unknown": counts.get("unknown", 0),
        "maintenance": counts.get("maintenance", 0),
        "note": "Status is updated by the monitor_devices management command. This dashboard refreshes automatically."
    })
