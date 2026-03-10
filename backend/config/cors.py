from django.conf import settings
from django.http import HttpResponse


class SimpleCorsMiddleware:
    """Allow the frontend origin to call JSON endpoints during trial deployment."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        origin = request.headers.get("Origin", "")
        if origin.rstrip("/") == settings.FRONTEND_URL:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Headers"] = "Content-Type"
            response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"

        return response
