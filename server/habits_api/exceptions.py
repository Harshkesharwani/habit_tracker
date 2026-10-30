from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        code = "API_ERROR"
        message = "An error occurred."
        details = {}

        if response.status_code == status.HTTP_400_BAD_REQUEST:
            code = "VALIDATION_ERROR"
            message = "Validation failed for provided input."
            if isinstance(response.data, dict):
                details = response.data
                # Pick the first error as message for readability
                first_key = next(iter(response.data))
                first_val = response.data[first_key]
                if isinstance(first_val, list) and len(first_val) > 0:
                    message = f"{first_key.capitalize()}: {first_val[0]}"
                elif isinstance(first_val, str):
                    message = f"{first_key.capitalize()}: {first_val}"
            elif isinstance(response.data, list) and len(response.data) > 0:
                message = str(response.data[0])
                details = {"non_field_errors": response.data}
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            code = "UNAUTHORIZED"
            message = "Authentication credentials were not provided or are invalid."
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            code = "FORBIDDEN"
            message = "You do not have permission to perform this action."
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            code = "NOT_FOUND"
            message = "The requested resource was not found or is not accessible."
        elif response.status_code == status.HTTP_409_CONFLICT:
            code = "CONFLICT"
            message = "A conflict occurred with an existing resource."

        response.data = {
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        }

    return response
