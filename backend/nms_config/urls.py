from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie


def health(request):
    return JsonResponse({"status": "ok", "service": "AIIMS Deoghar NMS API"})


@ensure_csrf_cookie
def csrf_token_view(request):
    """Issue the CSRF cookie required for unsafe browser requests."""
    return JsonResponse({"detail": "CSRF cookie set"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/csrf/", csrf_token_view, name="csrf_token"),
    path("api/", include("inventory.urls")),
]
