"""
API key authentication for device requests.
Provides a DRF authentication class that looks up devices by the `X-API-Key` header
and attaches the `device` to the `request` for downstream handlers.
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import Device


class APIKeyAuthentication(BaseAuthentication):
    """Authenticate requests using an `X-API-Key` header matching a Device.

    If the header is missing, this returns `None` so other authentication
    methods may run. If the key is invalid, it raises `AuthenticationFailed`.
    On success the authenticated user is the device owner and the device
    instance is attached to `request.device`.
    """

    def authenticate(self, request):
        api_key = request.headers.get('X-API-Key') or request.META.get('HTTP_X_API_KEY')
        if not api_key:
            return None

        try:
            device = Device.objects.get(api_key=api_key, is_active=True)
        except Device.DoesNotExist:
            raise AuthenticationFailed('Invalid API key')

        # Attach device for convenience
        setattr(request, 'device', device)

        # Return the device owner as the authenticated user and the device as auth
        return (device.user, device)
