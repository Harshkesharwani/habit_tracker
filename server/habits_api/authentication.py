from rest_framework.authentication import TokenAuthentication, get_authorization_header
from rest_framework import exceptions
from django.utils.translation import gettext_lazy as _

class BearerOrTokenAuthentication(TokenAuthentication):
    """
    Seamlessly authenticates both 'Token <key>' and 'Bearer <key>' in the Authorization header.
    Prevents 401 Unauthorized errors when developers or Postman use Bearer tokens.
    """
    def authenticate(self, request):
        auth = get_authorization_header(request).split()

        if not auth:
            return None

        # Accept both 'token' and 'bearer' (case-insensitive)
        prefix = auth[0].lower()
        if prefix not in (b'token', b'bearer'):
            return None

        if len(auth) == 1:
            msg = _('Invalid token header. No credentials provided.')
            raise exceptions.AuthenticationFailed(msg)
        elif len(auth) > 2:
            msg = _('Invalid token header. Token string should not contain spaces.')
            raise exceptions.AuthenticationFailed(msg)

        try:
            token = auth[1].decode()
        except UnicodeError:
            msg = _('Invalid token header. Token string should not contain invalid characters.')
            raise exceptions.AuthenticationFailed(msg)

        return self.authenticate_credentials(token)
