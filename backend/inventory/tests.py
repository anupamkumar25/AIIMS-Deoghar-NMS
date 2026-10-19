from django.test import TestCase
from .models import Device, Location

class InventoryModelTests(TestCase):
    def test_device_defaults_to_unknown(self):
        device = Device.objects.create(name="Test switch", ip_address="192.0.2.10")
        self.assertEqual(device.status, Device.Status.UNKNOWN)

    def test_location_can_be_assigned(self):
        location = Location.objects.create(name="Test building")
        device = Device.objects.create(name="Test server", ip_address="192.0.2.11", location=location)
        self.assertEqual(device.location.name, "Test building")
