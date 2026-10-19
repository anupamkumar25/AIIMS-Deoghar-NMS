from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeviceViewSet, LocationViewSet, dashboard_summary

router = DefaultRouter()
router.register("devices", DeviceViewSet, basename="device")
router.register("locations", LocationViewSet, basename="location")

urlpatterns = [
    path("dashboard/summary/", dashboard_summary, name="dashboard-summary"),
    path("", include(router.urls)),
]
